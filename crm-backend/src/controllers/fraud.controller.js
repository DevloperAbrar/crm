const FraudFlag = require('../models/FraudFlag');
const User = require('../models/User');
const { recalcTrustScore } = require('../services/trust.service');
const { success, error } = require('../utils/apiResponse');

const STATUSES = ['open', 'reviewed_genuine', 'reviewed_fraudulent'];

// Founder: everyone except themselves. Team Lead: only their own BDEs.
// Nobody can review their own flags.
function scopeQuery(req) {
  if (req.scope.role === 'founder') return { userId: { $ne: req.user._id } };
  return { userId: { $in: req.scope.teamBdeIds } };
}

exports.listFlags = async (req, res) => {
  try {
    const status = STATUSES.includes(req.query.status) ? req.query.status : 'open';

    const flags = await FraudFlag.find({ ...scopeQuery(req), status })
      .populate('userId', 'name role trustScore')
      .populate('leadId', 'businessName')
      .populate('interactionId', 'type outcome notes date secondsOnScreen')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(1000);

    return success(res, flags);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// Counts for the tabs + the people whose trust score is below 100
exports.summary = async (req, res) => {
  try {
    const scope = scopeQuery(req);
    const [open, genuine, fraudulent] = await Promise.all(
      STATUSES.map((status) => FraudFlag.countDocuments({ ...scope, status }))
    );

    const people = await User.find(
      req.scope.role === 'founder'
        ? { role: { $in: ['team_lead', 'bde'] }, isActive: true }
        : { reportsTo: req.user._id, isActive: true }
    )
      .select('name role trustScore')
      .sort({ trustScore: 1 })
      .limit(5);

    return success(res, {
      counts: { open, genuine, fraudulent },
      lowestTrust: people.filter((p) => p.trustScore < 100),
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

async function applyReview(req, res, flagIds) {
  const { decision, reviewNotes } = req.body;
  if (!['genuine', 'fraudulent'].includes(decision)) {
    return error(res, "decision must be 'genuine' or 'fraudulent'", 422);
  }

  // Only flags inside the reviewer's scope can be touched
  const flags = await FraudFlag.find({ _id: { $in: flagIds }, ...scopeQuery(req) }).select('userId');
  if (!flags.length) return error(res, 'No matching flags found in your scope', 404);

  const status = decision === 'fraudulent' ? 'reviewed_fraudulent' : 'reviewed_genuine';

  await FraudFlag.updateMany(
    { _id: { $in: flags.map((f) => f._id) } },
    {
      $set: {
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: (reviewNotes || '').trim(),
      },
    }
  );

  const trustScores = {};
  for (const uid of new Set(flags.map((f) => String(f.userId)))) {
    trustScores[uid] = await recalcTrustScore(uid);
  }

  if (req.audit) {
    await req.audit('fraud.reviewed', 'fraud_flags', flags[0]._id, null, {
      flagIds: flags.map((f) => f._id),
      decision,
      reviewNotes,
      trustScores,
    });
  }

  return success(res, { reviewed: flags.length, trustScores }, 'Flags reviewed');
}

// PUT /flags/:id/review (single flag, kept for compatibility)
exports.reviewFlag = async (req, res) => {
  try {
    return await applyReview(req, res, [req.params.id]);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// POST /flags/review  { flagIds, decision, reviewNotes } (a whole group at once)
exports.reviewFlags = async (req, res) => {
  try {
    const { flagIds } = req.body;
    if (!Array.isArray(flagIds) || flagIds.length === 0) {
      return error(res, 'flagIds is required', 422);
    }
    return await applyReview(req, res, flagIds);
  } catch (err) {
    return error(res, err.message, 500);
  }
};