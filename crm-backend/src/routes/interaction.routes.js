const express = require('express');
const router = express.Router();
const multer = require('multer');
const interactionController = require('../controllers/interaction.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const territoryMiddleware = require('../middlewares/territory.middleware');
const auditLogger = require('../middlewares/auditLogger.middleware');
const { upload } = require('../middlewares/upload.middleware');
const { error } = require('../utils/apiResponse');

router.use(authMiddleware, territoryMiddleware, auditLogger);

// Runs multer and turns its errors into readable 400 responses.
// JSON requests (no files) pass straight through.
function handleUpload(req, res, next) {
  upload.array('files', 5)(req, res, (err) => {
    if (!err) return next();

    let message = err.message || 'File upload failed';
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') message = 'A file is too large. Maximum size is 10 MB per file.';
      else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE')
        message = 'You can attach at most 5 files.';
    }
    return error(res, message, 400);
  });
}

router.post('/', handleUpload, interactionController.createInteraction);
router.get('/lead/:leadId', interactionController.getInteractionsForLead);
router.put('/:id', interactionController.updateInteraction);
router.post('/:id/attachments', upload.array('files', 5), interactionController.uploadAttachments);

module.exports = router;