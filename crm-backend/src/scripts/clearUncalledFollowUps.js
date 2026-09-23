const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');
const Lead = require('../models/Lead');
const Interaction = require('../models/Interaction');
const { STEP_TYPES } = require('../services/followUp.service');

(async () => {
  await mongoose.connect(MONGO_URI);

  const contactedIds = await Interaction.distinct('leadId', { type: { $in: STEP_TYPES } });

  const result = await Lead.updateMany(
    { _id: { $nin: contactedIds }, nextFollowUpDate: { $ne: null } },
    { $set: { nextFollowUpDate: null, followUpMode: 'none', followUpStep: 0 } }
  );

  console.log(`Cleared follow-up date on ${result.modifiedCount} never-contacted lead(s).`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});