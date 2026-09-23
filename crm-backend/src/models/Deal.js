const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    serviceType: { type: String, required: true },
    value: { type: Number, required: true },
    onboardedDate: { type: Date, default: Date.now },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deal', dealSchema);
