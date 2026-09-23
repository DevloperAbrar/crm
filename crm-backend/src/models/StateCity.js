const mongoose = require('mongoose');

// Static reference data loaded from countrystatecity.in export.
// Served read-only via GET /api/meta/states-cities
const stateCitySchema = new mongoose.Schema(
  {
    stateCode: { type: String, required: true, index: true },
    stateName: { type: String, required: true },
    cities: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('StateCity', stateCitySchema);
