const express = require('express');
const router = express.Router();
const dealController = require('../controllers/deal.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const territoryMiddleware = require('../middlewares/territory.middleware');
const auditLogger = require('../middlewares/auditLogger.middleware');

router.use(authMiddleware, territoryMiddleware, auditLogger);

router.get('/', dealController.listDeals);
router.post('/', dealController.createDeal);
router.get('/lead/:leadId', dealController.getDealForLead);
router.put('/:id', dealController.updateDeal);

module.exports = router;
