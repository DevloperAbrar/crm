const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraud.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const territoryMiddleware = require('../middlewares/territory.middleware');
const auditLogger = require('../middlewares/auditLogger.middleware');

router.use(authMiddleware, territoryMiddleware, auditLogger, roleMiddleware('founder', 'team_lead'));

router.get('/flags', fraudController.listFlags);
router.get('/summary', fraudController.summary);
router.post('/flags/review', fraudController.reviewFlags);
router.put('/flags/:id/review', fraudController.reviewFlag);

module.exports = router;