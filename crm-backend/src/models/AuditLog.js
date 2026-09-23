const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. 'lead.statusChanged', 'lead.reassigned'
    targetCollection: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ targetCollection: 1, targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
