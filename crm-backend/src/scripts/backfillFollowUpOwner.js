const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');
const Lead = require('../models/Lead');
const Interaction = require('../models/Interaction');
const { STEP_TYPES } = require('../services/followUp.service');

(async () => {
  await mongoose.connect(MONGO_URI);

  const leads = await Lead.find({ nextFollowUpDate: { $ne: null }, followUpOwner: null }).select('_id');
  const ops = [];

  for (const lead of leads) {
    const last = await Interaction.findOne({ leadId: lead._id, type: { $in: STEP_TYPES } })
      .sort({ date: -1 })
      .select('handledBy');
    if (last) {
      ops.push({ updateOne: { filter: { _id: lead._id }, update: { $set: { followUpOwner: last.handledBy } } } });
    }
  }

  if (ops.length) await Lead.bulkWrite(ops);
  console.log(`Set the follow-up owner on ${ops.length} of ${leads.length} lead(s).`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});