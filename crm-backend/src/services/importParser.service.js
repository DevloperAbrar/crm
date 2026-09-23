const { parseCsvBuffer, normalizePhone } = require('../utils/csvParser');
const XLSX = require('xlsx');
const { buildStateResolver } = require('./stateResolver.service');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { findDuplicate, findWeakDuplicate } = require('./dedupe.service');
const crypto = require('crypto');

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
 * Step 1: preview - just returns detected columns + sample rows for the
 * frontend's ColumnMapper component.
 */
function previewImport(buffer, originalName) {
  const rows = parseFileBuffer(buffer, originalName);
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return { columns, sampleRows: rows.slice(0, 10), totalRows: rows.length };
}

/**
 * Step 2: commit - applies the column mapping, de-duplicates, and inserts
 * new Lead documents tagged with a batchId (for undo support).
 *
 * Every row now falls into exactly one bucket, all of which are returned
 * to the caller so the Founder can see what actually happened instead of
 * a single opaque count:
 *   - inserted: no match found, imported normally
 *   - skipped: matched an existing lead by phone or placeId, NOT imported
 *   - flagged: no phone/placeId to check, but businessName+cityName
 *     matched an existing lead - imported anyway, tagged for manual review
 */
async function commitImport(buffer, originalName, columnMapping, categoryId, defaultAssignee) {
  const rows = parseFileBuffer(buffer, originalName);
  const batchId = crypto.randomUUID();

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
  const stateResolver = await buildStateResolver();

  let rowNumber = 0;
  for (const row of rows) {
    rowNumber += 1;
    const mapped = {};
    for (const [sourceCol, targetField] of Object.entries(columnMapping)) {
      mapped[targetField] = row[sourceCol];
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
      const weak = await findWeakDuplicate({ businessName: mapped.businessName, cityName: mapped.cityName });
      if (weak) flaggedAsPossibleDupe = weak.lead;
    }

    const created = await Lead.create({
      businessName: mapped.businessName,
      categoryId,
      cityName: mapped.cityName ? String(mapped.cityName).trim() : mapped.cityName,
      stateCode: stateResolver.resolve(mapped.cityName, mapped.stateCode) || undefined,
      address: mapped.address,
      lat: mapped.lat,
      lng: mapped.lng,
      phones: mapped.phone ? [mapped.phone] : [],
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

    if (flaggedAsPossibleDupe) {
      flagged.push({
        row: rowNumber,
        businessName: mapped.businessName,
        newLeadId: created._id,
        possibleMatchId: flaggedAsPossibleDupe._id,
        possibleMatchName: flaggedAsPossibleDupe.businessName,
      });
    }
  }

  return {
    batchId,
    inserted,
    skippedDuplicates: skipped.length,
    skipped,
    flagged,
    totalRows: rows.length,
  };
}

async function undoImport(batchId) {
  const result = await Lead.deleteMany({ importBatchId: batchId });
  return { deletedCount: result.deletedCount };
}

module.exports = { previewImport, commitImport, undoImport };
