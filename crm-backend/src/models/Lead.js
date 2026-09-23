const mongoose = require('mongoose');

const LEAD_STATUSES = [
  'New',
  'Attempted Contact',
  'Contacted',
  'Interested',
  'Demo/Visit Scheduled',
  'Visited',
  'Negotiation',
  'Converted',
  'Lost',
];

const leadSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    customFieldValues: { type: mongoose.Schema.Types.Mixed, default: {} },

    stateCode: { type: String },
    cityName: { type: String },
    area: { type: String },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },

    phones: [{ type: String }],
    email: { type: String },
    website: { type: String },
    socialHandles: {
      instagram: { type: String },
      other: { type: String },
    },

    mapsRating: { type: Number },
    mapsReviewCount: { type: Number },
    placeId: { type: String },

    source: {
      type: String,
      enum: ['maps_scrape', 'referral', 'walk_in', 'manual_bde'],
      default: 'maps_scrape',
    },
    selfSourced: { type: Boolean, default: false },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTeamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: { type: String, enum: LEAD_STATUSES, default: 'New' },
    tags: [{ type: String }],

    lastContactedAt: { type: Date },
    nextFollowUpDate: { type: Date },
    followUpStep: { type: Number, default: 0 }, // steps (call/visit/demo) completed so far
    followUpMode: { type: String, enum: ['auto', 'manual', 'none'], default: 'none' },
    followUpOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // whose calendar holds the next follow-up
    
    normalizedPhone: { type: String },

    importBatchId: { type: String },
  },
  { timestamps: true }
);

leadSchema.index({ normalizedPhone: 1 });
leadSchema.index({ placeId: 1 });
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ stateCode: 1, cityName: 1 });

leadSchema.statics.STATUSES = LEAD_STATUSES;

module.exports = mongoose.model('Lead', leadSchema);
