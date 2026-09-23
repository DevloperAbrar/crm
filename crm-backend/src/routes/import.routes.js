const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/import.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const auditLogger = require('../middlewares/auditLogger.middleware');

const upload = multer({ storage: multer.memoryStorage() });

// Restricted to Founder only, per explicit client decision. Note: Section 15
// of the original blueprint's RBAC table lists Team Lead as "Yes (own team)"
// for this action - this route intentionally overrides that.
router.use(authMiddleware, roleMiddleware('founder'), auditLogger);

router.post('/preview', upload.single('file'), importController.previewImportFile);
router.post('/commit', upload.single('file'), importController.commitImportFile);
router.post('/undo/:batchId', importController.undoImportBatch);

module.exports = router;
