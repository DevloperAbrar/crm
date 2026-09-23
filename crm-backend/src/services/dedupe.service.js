const Lead = require('../models/Lead');
const { normalizePhone } = require('../utils/csvParser');

function normalizeName(str) {
  return String(str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Strong duplicate check - matches by normalised phone number or Google
 * Place ID (Section 4.2 / 5.1). Either signal is considered confident
 * enough to skip the row automatically.
 *
 * Returns { lead, matchedOn: 'phone' | 'placeId' } or null.
 */
async function findDuplicate({ phone, placeId }) {
  const normalizedPhone = normalizePhone(phone);

  if (normalizedPhone) {
    const byPhone = await Lead.findOne({ normalizedPhone });
    if (byPhone) return { lead: byPhone, matchedOn: 'phone' };
  }

  if (placeId) {
    const byPlace = await Lead.findOne({ placeId });
    if (byPlace) return { lead: byPlace, matchedOn: 'placeId' };
  }

  return null;
}

/**
 * Weak duplicate check - used ONLY when a row has neither phone nor
 * placeId to check against (common for informal businesses in scraped
 * data). Matches on normalised businessName + cityName.
 *
 * This is intentionally NOT auto-skipped by the importer, since business
 * names can collide across genuinely different leads. Rows that match
 * here are still imported, but flagged as "possible duplicate" so the
 * Founder can review and merge manually if they turn out to be the same.
 *
 * Returns { lead } or null.
 */
async function findWeakDuplicate({ businessName, cityName }) {
  const normalizedName = normalizeName(businessName);
  if (!normalizedName) return null;

  const candidates = await Lead.find({
    cityName: cityName || null,
  }).select('businessName cityName');

  const match = candidates.find((c) => normalizeName(c.businessName) === normalizedName);
  return match ? { lead: match } : null;
}

async function mergeDuplicates(primaryId, duplicateId) {
  const [primary, duplicate] = await Promise.all([
    Lead.findById(primaryId),
    Lead.findById(duplicateId),
  ]);

  if (!primary || !duplicate) {
    throw new Error('Both primary and duplicate lead IDs must exist');
  }

  // Merge phones/tags/email/website, keep primary's assignment and status.
  // Fill in any field primary is missing from duplicate, rather than
  // silently dropping duplicate's data on the floor.
  primary.phones = [...new Set([...(primary.phones || []), ...(duplicate.phones || [])])];
  primary.tags = [...new Set([...(primary.tags || []), ...(duplicate.tags || [])])];
  if (!primary.email && duplicate.email) primary.email = duplicate.email;
  if (!primary.website && duplicate.website) primary.website = duplicate.website;
  if (!primary.address && duplicate.address) primary.address = duplicate.address;
  if (!primary.placeId && duplicate.placeId) primary.placeId = duplicate.placeId;
  await primary.save();

  const Interaction = require('../models/Interaction');
  await Interaction.updateMany({ leadId: duplicate._id }, { $set: { leadId: primary._id } });

  await duplicate.deleteOne();

  return primary;
}

module.exports = { findDuplicate, findWeakDuplicate, mergeDuplicates };
