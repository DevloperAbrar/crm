const AuditLog = require('../models/AuditLog');

/**
 * Attaches a req.audit(action, targetCollection, targetId, previousValue, newValue)
 * helper that controllers can call after a mutation to record an audit trail entry.
 */
function auditLoggerMiddleware(req, res, next) {
  req.audit = async (action, targetCollection, targetId, previousValue = null, newValue = null) => {
    try {
      await AuditLog.create({
        userId: req.user?._id,
        action,
        targetCollection,
        targetId,
        previousValue,
        newValue,
      });
    } catch (err) {
      console.error('[auditLogger] Failed to write audit log:', err.message);
    }
  };
  next();
}

module.exports = auditLoggerMiddleware;
