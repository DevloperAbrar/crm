const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');
const Lead = require('../models/Lead');
const { buildStateResolver } = require('../services/stateResolver.service');

(async () => {
  await mongoose.connect(MONGO_URI);
  const resolver = await buildStateResolver();

  const leads = await Lead.find({
    cityName: { $nin: [null, ''] },
    stateCode: { $in: [null, ''] },
  }).select('cityName');

  const ops = [];
  const ambiguous = new Map();
  const unknown = new Set();

  for (const lead of leads) {
    const code = resolver.resolve(lead.cityName);
    if (code) {
      ops.push({ updateOne: { filter: { _id: lead._id }, update: { $set: { stateCode: code } } } });
    } else if (resolver.candidates(lead.cityName).length > 1) {
      ambiguous.set(lead.cityName, resolver.candidates(lead.cityName));
    } else {
      unknown.add(lead.cityName);
    }
  }

  if (ops.length) await Lead.bulkWrite(ops);

  console.log(`Checked ${leads.length} lead(s); filled the state on ${ops.length}.`);
  if (ambiguous.size) {
    console.log('Left blank (city exists in several states):');
    ambiguous.forEach((codes, city) => console.log(`  ${city}: ${codes.join(', ')}`));
  }
  if (unknown.size) console.log('Left blank (city not in the states list):', [...unknown].join(', '));

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});