const { parseCsvBuffer, normalizePhone, isScientificNotation } = require('../utils/csvParser');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const { buildStateResolver } = require('./stateResolver.service');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Category = require('../models/Category');
const { findDuplicate, findWeakDuplicate } = require('./dedupe.service');
const crypto = require('crypto');

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseFileBuffer(buffer, originalName) {
  if (originalName.toLowerCase().endsWith('.csv')) {
    return parseCsvBuffer(buffer);
  }
  // xlsx/xls
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

/**
 * Normalises a category label so that "Sound & Lighting", "sound and
 * lighting" and "SOUND&LIGHTING" all resolve to the same key.
 */
function normalizeCategoryKey(str) {
  return String(str ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

async function buildCategoryResolver() {
  const categories = await Category.find({ isActive: { $ne: false } }).select('_id name');
  const byKey = new Map();
  categories.forEach((c) => byKey.set(normalizeCategoryKey(c.name), c));
  return {
    resolve(label) {
      const key = normalizeCategoryKey(label);
      if (!key) return null;
      return byKey.get(key) || null;
    },
  };
}

/** Trims strings and turns empty cells into undefined. */
function cleanCell(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return value;
}

/**
 * Step 1: preview - just returns detected columns + sample rows for the
 * frontend's ColumnMapper component.
 */
function previewImport(buffer, originalName) {
  const rows = parseFileBuffer(buffer, originalName);
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return { columns, sampleRows: rows.slice(0, 10), totalRows: rows.length };
}

/**
 * Step 2: commit - applies the column mapping, resolves each row's category,
 * de-duplicates, and inserts new Lead documents tagged with a batchId
 * (for undo support).
 *
 * Category resolution (per row):
 *   1. If the file has a column mapped to "category" and the cell has a
 *      value, it must match an active Category (case/punctuation
 *      insensitive). If it doesn't, the row is NOT imported and is reported
 *      under unmatchedCategories - we never silently misfile a lead.
 *   2. If the cell is blank, the optional default category (categoryId) is
 *      used. If there is no default either, the row is reported as failed.
 *
 * Every row ends up in exactly one bucket, all returned to the caller:
 *   - inserted, skipped (duplicate), flagged (imported + possible duplicate),
 *     unmatchedCategories, failed.
 */
async function commitImport(buffer, originalName, columnMapping, categoryId, defaultAssignee) {
  const rows = parseFileBuffer(buffer, originalName);
  const batchId = crypto.randomUUID();

  const mappingValues = Object.values(columnMapping || {});
  if (!mappingValues.includes('businessName')) {
    throw httpError('Please map a column to "businessName" before importing.');
  }
  const hasCategoryColumn = mappingValues.includes('category');

  // Optional default category
  let defaultCategory = null;
  if (categoryId) {
    if (!mongoose.isValidObjectId(categoryId)) throw httpError('Invalid default category.');
    defaultCategory = await Category.findById(categoryId).select('_id name');
    if (!defaultCategory) throw httpError('Default category not found.');
  }

  if (!hasCategoryColumn && !defaultCategory) {
    throw httpError(
      'Your file has no category column mapped. Map a column to "category" or choose a default category.'
    );
  }

  const categoryResolver = await buildCategoryResolver();

  // Resolve the assignee's Team Lead once up front (same lead owner for
  // every row in this batch), so every imported Lead's assignedTeamLead
  // stays correct for Team Lead visibility (Section 15) and Socket.io room
  // routing (Section 7) - matches the fix in lead.controller.js.
  let assignedTeamLead = null;
  if (defaultAssignee) {
    const assigneeUser = await User.findById(defaultAssignee).select('reportsTo role');
    if (assigneeUser?.role === 'bde') assignedTeamLead = assigneeUser.reportsTo;
  }

  let inserted = 0;
  const skipped = [];
  const flagged = [];
  const failed = [];
  const invalidPhones = [];
  const byCategoryMap = new Map(); // categoryId string -> { categoryId, name, count }
  const unmatchedMap = new Map(); // normalised key -> { name, count, rows: [] }
  const stateResolver = await buildStateResolver();

  let rowNumber = 0;
  for (const row of rows) {
    rowNumber += 1;

    const mapped = {};
    for (const [sourceCol, targetField] of Object.entries(columnMapping)) {
      if (!targetField) continue;
      mapped[targetField] = cleanCell(row[sourceCol]);
    }

    try {
      if (!mapped.businessName) {
        failed.push({ row: rowNumber, businessName: '', reason: 'Missing business name' });
        continue;
      }
      mapped.businessName = String(mapped.businessName);

      // ---- Category ----
      let category = null;
      if (mapped.category) {
        category = categoryResolver.resolve(mapped.category);
        if (!category) {
          const label = String(mapped.category);
          const key = normalizeCategoryKey(label) || label;
          const entry = unmatchedMap.get(key) || { name: label, count: 0, rows: [] };
          entry.count += 1;
          if (entry.rows.length < 10) entry.rows.push(rowNumber);
          unmatchedMap.set(key, entry);
          continue;
        }
      } else if (defaultCategory) {
        category = defaultCategory;
      } else {
        failed.push({
          row: rowNumber,
          businessName: mapped.businessName,
          reason: 'No category in row and no default category selected',
        });
        continue;
      }

      // ---- Phone (reject Excel scientific-notation corruption) ----
      if (mapped.phone !== undefined && isScientificNotation(mapped.phone)) {
        invalidPhones.push({
          row: rowNumber,
          businessName: mapped.businessName,
          value: String(mapped.phone),
        });
        mapped.phone = undefined;
      }

      const hasPhone = Boolean(normalizePhone(mapped.phone));
      const hasPlaceId = Boolean(mapped.placeId);

      if (hasPhone || hasPlaceId) {
        const dup = await findDuplicate({ phone: mapped.phone, placeId: mapped.placeId });
        if (dup) {
          skipped.push({
            row: rowNumber,
            businessName: mapped.businessName,
            matchedOn: dup.matchedOn,
            matchedLeadId: dup.lead._id,
            matchedLeadName: dup.lead.businessName,
          });
          continue;
        }
      }

      let flaggedAsPossibleDupe = null;
      if (!hasPhone && !hasPlaceId) {
        const weak = await findWeakDuplicate({
          businessName: mapped.businessName,
          cityName: mapped.cityName,
        });
        if (weak) flaggedAsPossibleDupe = weak.lead;
      }

      const cityName = mapped.cityName ? String(mapped.cityName).trim() : undefined;

      const created = await Lead.create({
        businessName: mapped.businessName,
        categoryId: category._id,
        cityName,
        stateCode: stateResolver.resolve(cityName, mapped.stateCode) || undefined,
        address: mapped.address,
        lat: mapped.lat,
        lng: mapped.lng,
        phones: mapped.phone ? [String(mapped.phone)] : [],
        email: mapped.email,
        website: mapped.website,
        mapsRating: mapped.mapsRating,
        mapsReviewCount: mapped.mapsReviewCount,
        placeId: mapped.placeId,
        normalizedPhone: normalizePhone(mapped.phone),
        source: 'maps_scrape',
        status: 'New',
        tags: flaggedAsPossibleDupe ? ['possible_duplicate'] : [],
        assignedTo: defaultAssignee || null,
        assignedTeamLead,
        // Same reasoning as in lead.controller.js: a lead with an owner but
        // no due date is invisible on that BDE's calendar (Section 9).
        nextFollowUpDate: null, // set automatically after the first call/visit is logged
        importBatchId: batchId,
      });
      inserted += 1;

      const catKey = String(category._id);
      const catEntry = byCategoryMap.get(catKey) || { categoryId: catKey, name: category.name, count: 0 };
      catEntry.count += 1;
      byCategoryMap.set(catKey, catEntry);

      if (flaggedAsPossibleDupe) {
        flagged.push({
          row: rowNumber,
          businessName: mapped.businessName,
          newLeadId: created._id,
          possibleMatchId: flaggedAsPossibleDupe._id,
          possibleMatchName: flaggedAsPossibleDupe.businessName,
        });
      }
    } catch (rowErr) {
      // One bad row must never abort the whole import.
      failed.push({
        row: rowNumber,
        businessName: mapped.businessName || '',
        reason: rowErr.message,
      });
    }
  }

  const unmatchedCategories = Array.from(unmatchedMap.values()).sort((a, b) => b.count - a.count);

  return {
    batchId,
    inserted,
    skippedDuplicates: skipped.length,
    skipped,
    flagged,
    failed,
    invalidPhones,
    byCategory: Array.from(byCategoryMap.values()).sort((a, b) => b.count - a.count),
    unmatchedCategories,
    unmatchedRowCount: unmatchedCategories.reduce((sum, c) => sum + c.count, 0),
    totalRows: rows.length,
  };
}

async function undoImport(batchId) {
  const result = await Lead.deleteMany({ importBatchId: batchId });
  return { deletedCount: result.deletedCount };
}

module.exports = { previewImport, commitImport, undoImport };