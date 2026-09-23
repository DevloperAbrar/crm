const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const {
  listAuditLogs,
  getLogsForRecord,
  getAuditSummary,
} = require('../controllers/audit.controller');

// All audit log routes are founder-only.
router.use(authMiddleware, roleMiddleware('founder'));

router.get('/', listAuditLogs);
router.get('/summary', getAuditSummary);
router.get('/:targetCollection/:targetId', getLogsForRecord);

module.exports = router;
