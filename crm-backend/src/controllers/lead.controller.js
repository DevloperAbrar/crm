const Lead = require('../models/Lead');
const User = require('../models/User');
const { validateLeadInput, validateLeadUpdate } = require('../validators/lead.validator');
const { normalizePhone } = require('../utils/csvParser');
const { buildLeadScopeQuery, leadInScope } = require('../utils/leadScope');
const { success, error } = require('../utils/apiResponse');
const { getIO, rooms } = require('../config/socket');
const { evaluateBulkEdit } = require('../services/fraudDetection.service');
const { STEP_TYPES, SEQUENCE_DAYS, computeNextFollowUp } = require('../services/followUp.service');

async function resolveTeamLeadFor(bdeId) {
  if (!bdeId) return null;
  const bde = await User.findById(bdeId).select('reportsTo role');
  if (!bde) return null;
  return bde.role === 'bde' ? bde.reportsTo : null;
}

// Builds the Mongo filter for the leads list from the request's query string.
// Shared by listLeads (paged rows) and listLeadIds (every matching id) so the
// two can never disagree about which leads match the current filters.
function buildListQuery(req) {
  const {
    status, city, state, categoryId, assignedTo, search, unassigned, tag,
    phone, dateFrom, dateTo, minRating, maxRating,
  } = req.query;

  const query = buildLeadScopeQuery(req.scope);

  if (status) query.status = status;
  if (city) query.cityName = city;
  if (state) query.stateCode = state;
  if (categoryId) query.categoryId = categoryId;
  if (assignedTo) query.assignedTo = assignedTo;
  if (tag) query.tags = tag;
  if (search) {
    // Escape regex characters so searching "A.B. Road (Indore)" cannot throw.
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.businessName = { $regex: safe, $options: 'i' };
  }

  // Phone search - matches on the normalised phone so formatting differences
  // (+91, spaces, dashes) don't matter.
  if (phone) query.normalizedPhone = normalizePhone(phone);

  // Date-added range.
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }

  // Google rating range.
  if (minRating || maxRating) {
    query.mapsRating = {};
    if (minRating) query.mapsRating.$gte = Number(minRating);
    if (maxRating) query.mapsRating.$lte = Number(maxRating);
  }

  if (unassigned === 'true' && req.scope.role === 'founder') {
    query.assignedTo = null;
  }

  return query;
}

const MAX_PAGE_SIZE = 500;
const MAX_SELECT_ALL = 5000;

exports.listLeads = async (req, res) => {
  try {
    const query = buildListQuery(req);

    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || 25));

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name')
      .populate('categoryId', 'name colour')
      .sort({ createdAt: -1, _id: -1 }) // _id tie-break keeps pages stable
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Lead.countDocuments(query);
    const unassignedCount =
      req.scope.role === 'founder' ? await Lead.countDocuments({ assignedTo: null }) : 0;

    return success(res, { leads, total, unassignedCount, page: pageNum, limit: limitNum });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// Returns ONLY the ids of every lead matching the current filters (within the
// caller's scope), so the UI can offer "Select all N leads" across pages
// without downloading full lead documents.
exports.listLeadIds = async (req, res) => {
  try {
    const query = buildListQuery(req);
    const total = await Lead.countDocuments(query);

    if (total > MAX_SELECT_ALL) {
      return error(
        res,
        `${total} leads match. Narrow your filters to ${MAX_SELECT_ALL} or fewer to select them all at once.`,
        422
      );
    }

    const docs = await Lead.find(query).select('_id').sort({ createdAt: -1, _id: -1 }).lean();
    return success(res, { ids: docs.map((d) => String(d._id)), total });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createLead = async (req, res) => {
  try {
    const { valid, errors } = validateLeadInput(req.body);
    if (!valid) return error(res, errors.join(', '), 422);

    const isBdeCreated = req.user.role === 'bde';
    const assignedTo = isBdeCreated ? req.user._id : req.body.assignedTo || null;
    const assignedTeamLead = await resolveTeamLeadFor(assignedTo);

    const lead = await Lead.create({
      ...req.body,
      normalizedPhone: normalizePhone(req.body.phones?.[0]),
      source: isBdeCreated ? 'manual_bde' : req.body.source || 'manual_bde',
      selfSourced: isBdeCreated,
      assignedTo,
      assignedTeamLead,
      nextFollowUpDate: null, // set automatically once the first call/visit is logged
    });

    if (req.audit) await req.audit('lead.created', 'leads', lead._id, null, lead);

    return success(res, lead, 'Lead created', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getLeadProfile = async (req, res) => {
  try {
    const Interaction = require('../models/Interaction');
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name')
      .populate('categoryId');

    if (!lead) return error(res, 'Lead not found', 404);

    if (!leadInScope(lead, req.scope)) {
      return error(res, 'Forbidden: this lead is not in your scope', 403);
    }

    const interactions = await Interaction.find({ leadId: lead._id })
      .populate('handledBy', 'name')
      .sort({ date: -1 });

    const Deal = require('../models/Deal');
    const deal = await Deal.findOne({ leadId: lead._id });

        // Preview of what "log a call now" would schedule, so the form can show it
    const steps = interactions.filter((i) => STEP_TYPES.includes(i.type)); // sorted newest-first
    const isClosed = ['Converted', 'Lost'].includes(lead.status);
    const plan = computeNextFollowUp({
      stepNumber: steps.length + 1,
      firstContactAt: steps.length ? steps[steps.length - 1].date : null,
    });
    const followUp = {
      stepsDone: steps.length,
      totalFollowUps: SEQUENCE_DAYS.length,
      nextAutoDate: isClosed ? null : plan.date,
      willClose: !isClosed && plan.sequenceComplete,
    };

    return success(res, { lead, interactions, deal, followUp });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const EDITABLE_FIELDS = [
  'businessName',
  'categoryId',
  'customFieldValues',
  'stateCode',
  'cityName',
  'area',
  'address',
  'phones',
  'email',
  'website',
  'socialHandles',
  'tags',
  'status',
  'nextFollowUpDate',
  'assignedTo',
];

exports.updateLead = async (req, res) => {
  try {
    const previous = await Lead.findById(req.params.id);
    if (!previous) return error(res, 'Lead not found', 404);

    if (!leadInScope(previous, req.scope)) {
      return error(res, 'Forbidden: this lead is not in your scope', 403);
    }

    const { valid, errors } = validateLeadUpdate(req.body);
    if (!valid) return error(res, errors.join(', '), 422);

    // Whitelist: copy only editable fields
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in req.body) updates[field] = req.body[field];
    }

    if (typeof updates.businessName === 'string') updates.businessName = updates.businessName.trim();
    if (typeof updates.email === 'string') updates.email = updates.email.trim().toLowerCase();

    // BDEs can edit details but can never reassign a lead
    if (req.scope.role === 'bde') {
      delete updates.assignedTo;
    }

    // Keep the normalised phone in sync so duplicate detection and phone search stay correct
    let phoneChanged = false;
    if ('phones' in updates) {
      updates.phones = updates.phones.map((p) => String(p).trim()).filter(Boolean);
      updates.normalizedPhone = normalizePhone(updates.phones[0]);
      phoneChanged = updates.normalizedPhone !== previous.normalizedPhone;
    }

    if (updates.assignedTo && String(updates.assignedTo) !== String(previous.assignedTo)) {
      updates.assignedTeamLead = await resolveTeamLeadFor(updates.assignedTo);
    }

    const updated = await Lead.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (req.audit) await req.audit('lead.updated', 'leads', updated._id, previous, updated);

    if (previous.status !== updated.status) {
      const io = getIO();
      const targetRoom = updated.assignedTeamLead
        ? rooms.team(updated.assignedTeamLead)
        : rooms.global();
      io.to(targetRoom).emit('lead:statusChanged', {
        leadId: updated._id,
        oldStatus: previous.status,
        newStatus: updated.status,
      });
      io.to(rooms.global()).emit('lead:statusChanged', {
        leadId: updated._id,
        oldStatus: previous.status,
        newStatus: updated.status,
      });
    }

    // If the edit made this lead share a phone number with another lead, say so
    let message = 'Lead updated';
    if (phoneChanged && updated.normalizedPhone) {
      const clash = await Lead.exists({
        _id: { $ne: updated._id },
        normalizedPhone: updated.normalizedPhone,
      });
      if (clash) {
        message =
          'Lead updated. Note: another lead already uses this phone number. Use "Merge Duplicates" to combine them.';
      }
    }

    return success(res, updated, message);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return error(res, 'Lead not found', 404);

    if (!leadInScope(lead, req.scope)) {
      return error(res, 'Forbidden: this lead is not in your scope', 403);
    }

    await lead.deleteOne();

    if (req.audit) await req.audit('lead.deleted', 'leads', lead._id, lead, null);

    return success(res, null, 'Lead deleted');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.bulkAssign = async (req, res) => {
  try {
    const { leadIds, assignedTo } = req.body;
    if (!leadIds?.length || !assignedTo) {
      return error(res, 'leadIds and assignedTo are required', 422);
    }

    const assignedTeamLead = await resolveTeamLeadFor(assignedTo);

    await Lead.updateMany(
      { _id: { $in: leadIds } },
      { $set: { assignedTo, assignedTeamLead } }
    );

    if (req.audit) await req.audit('lead.bulkAssign', 'leads', req.user._id, null, { leadIds, assignedTo });
    await evaluateBulkEdit(req.user._id, leadIds.length);

    const io = getIO();
    io.to(rooms.user(assignedTo)).emit('lead:reassigned', { leadIds, assignedTo });

    return success(res, null, `${leadIds.length} lead(s) assigned`);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.bulkStatus = async (req, res) => {
  try {
    const { leadIds, status } = req.body;
    await Lead.updateMany({ _id: { $in: leadIds } }, { $set: { status } });

    if (req.audit) await req.audit('lead.bulkStatus', 'leads', req.user._id, null, { leadIds, status });
    await evaluateBulkEdit(req.user._id, leadIds.length);

    const io = getIO();
    io.to(rooms.global()).emit('lead:statusChanged', { leadIds, newStatus: status });

    return success(res, null, `${leadIds.length} lead(s) updated to ${status}`);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.bulkTag = async (req, res) => {
  try {
    const { leadIds, tag } = req.body;
    if (!leadIds?.length || !tag) {
      return error(res, 'leadIds and tag are required', 422);
    }

    await Lead.updateMany({ _id: { $in: leadIds } }, { $addToSet: { tags: tag } });

    if (req.audit) await req.audit('lead.bulkTag', 'leads', req.user._id, null, { leadIds, tag });
    await evaluateBulkEdit(req.user._id, leadIds.length);

    return success(res, null, `Tagged ${leadIds.length} lead(s) with "${tag}"`);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.mergeDuplicates = async (req, res) => {
  try {
    const { primaryId, duplicateId } = req.body;
    const { mergeDuplicates } = require('../services/dedupe.service');
    const merged = await mergeDuplicates(primaryId, duplicateId);

    if (req.audit) await req.audit('lead.merged', 'leads', primaryId, { duplicateId }, merged);

    return success(res, merged, 'Leads merged');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.findDuplicateGroups = async (req, res) => {
  try {
    const scopeQuery = buildLeadScopeQuery(req.scope);

    const phoneDupes = await Lead.aggregate([
      { $match: { ...scopeQuery, normalizedPhone: { $ne: null, $ne: '' } } },
      { $group: { _id: '$normalizedPhone', ids: { $push: '$_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    const placeDupes = await Lead.aggregate([
      { $match: { ...scopeQuery, placeId: { $ne: null, $ne: '' } } },
      { $group: { _id: '$placeId', ids: { $push: '$_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    const allIds = [...new Set([...phoneDupes, ...placeDupes].flatMap((g) => g.ids.map(String)))];
    const leads = await Lead.find({ _id: { $in: allIds } }).select('businessName phones placeId cityName status');
    const leadsById = Object.fromEntries(leads.map((l) => [String(l._id), l]));

    const groups = [...phoneDupes, ...placeDupes].map((g) => ({
      key: g._id,
      leads: g.ids.map((id) => leadsById[String(id)]).filter(Boolean),
    }));

    return success(res, groups);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
