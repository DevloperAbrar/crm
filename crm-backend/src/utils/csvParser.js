const { parse } = require('csv-parse/sync');

function parseCsvBuffer(buffer) {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Excel "CSV UTF-8" files start with a BOM that would corrupt the first header
    relax_column_count: true,
  });
  return records;
}

/**
 * Excel turns long numbers into scientific notation (e.g. "9.19826E+11")
 * when a CSV is saved. The real digits are already gone at that point, so
 * the value is unusable and must never be treated as a phone number.
 */
function isScientificNotation(value) {
  if (value === null || value === undefined) return false;
  return /^\d+(\.\d+)?e[+-]?\d+$/i.test(String(value).trim());
}

function normalizePhone(phone) {
  if (!phone) return null;
  if (isScientificNotation(phone)) return null;
  return String(phone).replace(/[^\d]/g, '').replace(/^0+/, '').slice(-10);
}

module.exports = { parseCsvBuffer, normalizePhone, isScientificNotation };