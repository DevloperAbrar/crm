const mongoose = require('mongoose');

// Founder-only manual tracker: "for city X, have we already pitched category Y?"
// Independent of Leads - purely a manual checklist, per Section 6 state/city data.
const cityCoverageSchema = new mongoose.Schema(
  {
    stateCode: { type: String, required: true, index: true },
    cityName: { type: String, required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true }, // denormalized so UI doesn't need a join
    done: { type: Boolean, default: false },
    doneDate: { type: Date, default: null }, // set when marked done, cleared when unmarked
  },
  { timestamps: true }
);

// One record per (city, category) combination
cityCoverageSchema.index({ stateCode: 1, cityName: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model('CityCoverage', cityCoverageSchema);
