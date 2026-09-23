const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    type: { type: String, enum: ['call', 'visit', 'demo', 'email'], required: true },
    attemptNumber: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    secondsOnScreen: { type: Number, default: 0 },
    outcome: {
      type: String,
      enum: [
        'Interested',
        'Not Interested',
        'Call Back Later',
        'No Response',
        'Already Using Competitor',
        'Demo Booked',
        'Converted',
      ],
      required: true,
    },
    notes: { type: String, trim: true },
    nextFollowUpDate: { type: Date },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

interactionSchema.index({ leadId: 1, date: -1 });
interactionSchema.index({ handledBy: 1, date: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
