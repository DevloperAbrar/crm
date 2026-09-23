/**
 * Loads the India states/cities reference data (india.json, sourced from
 * countrystatecity.in per Section 6 of the blueprint) into the states_cities
 * collection, so the frontend's State/City dropdowns are backed by a real
 * API instead of free-text input.
 *
 * Usage:
 *   node src/scripts/seedStatesCities.js
 *
 * Safe to re-run - it upserts by stateCode instead of duplicating.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const { MONGO_URI } = require('../config/env');
const StateCity = require('../models/StateCity');
const indiaData = require('../data/india.json');

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('[seedStatesCities] Connected to MongoDB');

  let upserted = 0;

  for (const state of indiaData.states) {
    await StateCity.findOneAndUpdate(
      { stateCode: state.code },
      {
        stateCode: state.code,
        stateName: state.name,
        cities: state.cities.map((c) => c.name),
      },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  console.log(`[seedStatesCities] Upserted ${upserted} states.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seedStatesCities] Failed:', err);
  process.exit(1);
});
