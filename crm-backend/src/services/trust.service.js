const FraudFlag = require('../models/FraudFlag');
const User = require('../models/User');

// Points lost per CONFIRMED fraudulent flag
const PENALTY = { low: 2, medium: 5, high: 10 };

// Trust = 100 minus the points of every confirmed flag, never below 0.
// Recomputed from scratch, so changing a verdict to "genuine" restores the points.
async function recalcTrustScore(userId) {
  const confirmed = await FraudFlag.find({ userId, status: 'reviewed_fraudulent' }).select('severity');
  const lost = confirmed.reduce((sum, f) => sum + (PENALTY[f.severity] || 0), 0);
  const trustScore = Math.max(0, 100 - lost);
  await User.findByIdAndUpdate(userId, { trustScore });
  return trustScore;
}

module.exports = { PENALTY, recalcTrustScore };