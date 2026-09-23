const Deal = require('../models/Deal');
const Lead = require('../models/Lead');
const { success, error } = require('../utils/apiResponse');

// Deal ownership check mirrors leadInScope in lead.controller.js: a deal is
// only visible/editable if the underlying Lead is in the caller's scope.
async function dealLeadInScope(leadId, scope) {
  if (scope.role === 'founder') return true;
  const lead = await Lead.findById(leadId).select('assignedTo');
  if (!lead || !lead.assignedTo) return false;
  return scope.teamBdeIds.some((id) => String(id) === String(lead.assignedTo));
}

exports.createDeal = async (req, res) => {
  try {
    const { leadId, serviceType, value, onboardedDate, paymentStatus } = req.body;

    if (!leadId || !serviceType || value == null) {
      return error(res, 'leadId, serviceType and value are required', 422);
    }

    if (!(await dealLeadInScope(leadId, req.scope))) {
      return error(res, 'Forbidden: this lead is not in your scope', 403);
    }

    const existing = await Deal.findOne({ leadId });
    if (existing) return error(res, 'A deal already exists for this lead - update it instead', 409);

    const deal = await Deal.create({ leadId, serviceType, value, onboardedDate, paymentStatus });

    // Converting a lead should be reflected on the Lead itself too.
    await Lead.findByIdAndUpdate(leadId, { status: 'Converted' });

    if (req.audit) await req.audit('deal.created', 'deals', deal._id, null, deal);

    return success(res, deal, 'Deal created', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getDealForLead = async (req, res) => {
  try {
    const deal = await Deal.findOne({ leadId: req.params.leadId });
    return success(res, deal);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.updateDeal = async (req, res) => {
  try {
    const previous = await Deal.findById(req.params.id);
    if (!previous) return error(res, 'Deal not found', 404);

    if (!(await dealLeadInScope(previous.leadId, req.scope))) {
      return error(res, 'Forbidden: this lead is not in your scope', 403);
    }

    const updated = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (req.audit) await req.audit('deal.updated', 'deals', updated._id, previous, updated);

    return success(res, updated, 'Deal updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.listDeals = async (req, res) => {
  try {
    const { role, teamBdeIds } = req.scope;
    const leadQuery = role === 'founder' ? {} : { assignedTo: { $in: teamBdeIds } };

    const scopedLeads = await Lead.find(leadQuery).select('_id');
    const deals = await Deal.find({ leadId: { $in: scopedLeads.map((l) => l._id) } })
      .populate({ path: 'leadId', select: 'businessName cityName assignedTo', populate: { path: 'assignedTo', select: 'name' } })
      .sort({ onboardedDate: -1 });

    return success(res, deals);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
