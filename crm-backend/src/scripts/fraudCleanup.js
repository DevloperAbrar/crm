const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');
const FraudFlag = require('../models/FraudFlag');
const User = require('../models/User');
const { hourInTimezone, WORKING_HOURS } = require('../services/fraudDetection.service');
const { recalcTrustScore } = require('../services/trust.service');

(async () => {
  await mongoose.connect(MONGO_URI);

  const open = await FraudFlag.find({ rule: 'odd_hour_activity', status: 'open' }).populate('interactionId', 'date');
  let cleared = 0;

  for (const flag of open) {
    const when = flag.interactionId?.date || flag.createdAt;
    const hour = hourInTimezone(new Date(when));
    if (hour >= WORKING_HOURS.start && hour < WORKING_HOURS.end) {
      await FraudFlag.updateOne(
        { _id: flag._id },
        {
          $set: {
            status: 'reviewed_genuine',
            reviewedAt: new Date(),
            reviewNotes: 'Auto-cleared: the activity was within working hours in the team timezone.',
          },
        }
      );
      cleared += 1;
    }
  }

  const users = await User.find({ role: { $in: ['team_lead', 'bde'] } }).select('_id');
  for (const u of users) await recalcTrustScore(u._id);

  console.log(`Cleared ${cleared} wrong odd-hour flag(s); recalculated trust for ${users.length} user(s).`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});