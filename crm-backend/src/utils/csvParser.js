const { parse } = require('csv-parse/sync');

function parseCsvBuffer(buffer) {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

function normalizePhone(phone) {
  if (!phone) return null;
  return String(phone).replace(/[^\d]/g, '').replace(/^0+/, '').slice(-10);
}

module.exports = { parseCsvBuffer, normalizePhone };
