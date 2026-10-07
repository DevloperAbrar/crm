const { parseCsvBuffer, normalizePhone, isScientificNotation } = require('../utils/csvParser');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const { buildStateResolver } = require('./stateResolver.service');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Category = require('../models/Category');
const crypto = require('crypto');

const INSERT_CHUNK_SIZE = 500;

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

function normalizeName(str) {
  return String(str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function weakKey(businessName, cityName) {
  const n = normalizeName(businessName);
  if (!n) return null;
  return `${n}|${String(cityName || '').trim().toLowerCase()}`;
}

/**
 * Loads every existing lead's dedupe signals ONCE (phone, placeId,
 * name+city) so the import loop can check duplicates in memory instead of
 * running several database queries per row. Leads accepted during this
 * import are added to the same lookup, so duplicates inside the file itself
 * are caught too.
 */
async function loadDedupeIndex() {
  const byPhone = new Map();
  const byPlaceId = new Map();
  const byWeakKey = new Map();

  const cursor = Lead.find({})
    .select('businessName cityName normalizedPhone placeId')
    .lean()
    .cursor();

  for await (const l of cursor) {
    const ref = { _id: l._id, businessName: l.businessName };
    if (l.normalizedPhone) byPhone.set(l.normalizedPhone, ref);
    if (l.placeId) byPlaceId.set(l.placeId, ref);
    const wk = weakKey(l.businessName, l.cityName);
    if (wk && !byWeakKey.has(wk)) byWeakKey.set(wk, ref);
  }

  return { byPhone, byPlaceId, byWeakKey };
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
 * Performance: all lookups (categories, states, existing leads) are loaded
 * once up front and rows are inserted in bulk chunks, so a file with
 * thousands of rows finishes in seconds rather than hitting proxy timeouts.
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

  const [categoryResolver, stateResolver, dedupeIndex] = await Promise.all([
    buildCategoryResolver(),
    buildStateResolver(),
    loadDedupeIndex(),
  ]);

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
  const pending = []; // rows accepted in pass 1, inserted in pass 2

  // ---------- Pass 1: validate, categorise, de-duplicate (all in memory) ----------
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

      const normalizedPhone = normalizePhone(mapped.phone) || undefined;
      const placeId = mapped.placeId ? String(mapped.placeId) : undefined;

      // ---- Strong duplicate check (phone, then placeId) ----
      let strongMatch = null;
      let matchedOn = null;
      if (normalizedPhone && dedupeIndex.byPhone.has(normalizedPhone)) {
        strongMatch = dedupeIndex.byPhone.get(normalizedPhone);
        matchedOn = 'phone';
      } else if (placeId && dedupeIndex.byPlaceId.has(placeId)) {
        strongMatch = dedupeIndex.byPlaceId.get(placeId);
        matchedOn = 'placeId';
      }
      if (strongMatch) {
        skipped.push({
          row: rowNumber,
          businessName: mapped.businessName,
          matchedOn,
          matchedLeadId: strongMatch._id,
          matchedLeadName: strongMatch.businessName,
        });
        continue;
      }

      // ---- Weak duplicate check (only when no phone / placeId to rely on) ----
      const cityName = mapped.cityName ? String(mapped.cityName).trim() : undefined;
      const wk = weakKey(mapped.businessName, cityName);
      let flaggedAsPossibleDupe = null;
      if (!normalizedPhone && !placeId && wk && dedupeIndex.byWeakKey.has(wk)) {
        flaggedAsPossibleDupe = dedupeIndex.byWeakKey.get(wk);
      }

      const _id = new mongoose.Types.ObjectId();
      const doc = new Lead({
        _id,
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
        placeId,
        normalizedPhone,
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

      const validationError = doc.validateSync();
      if (validationError) {
        failed.push({
          row: rowNumber,
          businessName: mapped.businessName,
          reason: validationError.message,
        });
        continue;
      }

      // Register in the lookup so later rows in the same file see it.
      const ref = { _id, businessName: mapped.businessName };
      if (normalizedPhone) dedupeIndex.byPhone.set(normalizedPhone, ref);
      if (placeId) dedupeIndex.byPlaceId.set(placeId, ref);
      if (wk && !dedupeIndex.byWeakKey.has(wk)) dedupeIndex.byWeakKey.set(wk, ref);

      pending.push({
        row: rowNumber,
        businessName: mapped.businessName,
        doc,
        category,
        flaggedAsPossibleDupe,
      });
    } catch (rowErr) {
      // One bad row must never abort the whole import.
      failed.push({
        row: rowNumber,
        businessName: mapped.businessName || '',
        reason: rowErr.message,
      });
    }
  }

  // ---------- Pass 2: bulk insert in chunks ----------
  for (let i = 0; i < pending.length; i += INSERT_CHUNK_SIZE) {
    const chunk = pending.slice(i, i + INSERT_CHUNK_SIZE);
    const failedIdx = new Map();

    try {
      await Lead.insertMany(
        chunk.map((p) => p.doc),
        { ordered: false }
      );
    } catch (err) {
      const writeErrors = err.writeErrors || err.result?.result?.writeErrors;
      if (Array.isArray(writeErrors) && writeErrors.length) {
        writeErrors.forEach((we) =>
          failedIdx.set(we.index, we.errmsg || we.err?.errmsg || err.message)
        );
      } else {
        chunk.forEach((_, idx) => failedIdx.set(idx, err.message));
      }
    }

    chunk.forEach((p, idx) => {
      if (failedIdx.has(idx)) {
        failed.push({ row: p.row, businessName: p.businessName, reason: failedIdx.get(idx) });
        return;
      }

      inserted += 1;

      const catKey = String(p.category._id);
      const catEntry = byCategoryMap.get(catKey) || {
        categoryId: catKey,
        name: p.category.name,
        count: 0,
      };
      catEntry.count += 1;
      byCategoryMap.set(catKey, catEntry);

      if (p.flaggedAsPossibleDupe) {
        flagged.push({
          row: p.row,
          businessName: p.businessName,
          newLeadId: p.doc._id,
          possibleMatchId: p.flaggedAsPossibleDupe._id,
          possibleMatchName: p.flaggedAsPossibleDupe.businessName,
        });
      }
    });
  }

  failed.sort((a, b) => a.row - b.row);
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