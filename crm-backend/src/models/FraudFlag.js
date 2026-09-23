const mongoose = require('mongoose');

const fraudFlagSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    interactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interaction' },
    rule: {
      type: String,
      enum: [
        'too_fast_logging',
        'duplicate_note_text',
        'outcome_burst',
        'odd_hour_activity',
        'stale_lead',
        'bulk_edit_spike',
      ],
      required: true,
    },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    status: {
      type: String,
      enum: ['open', 'reviewed_genuine', 'reviewed_fraudulent'],
      default: 'open',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

fraudFlagSchema.index({ userId: 1, status: 1 });
fraudFlagSchema.index({ leadId: 1, rule: 1, status: 1 });

module.exports = mongoose.model('FraudFlag', fraudFlagSchema);
