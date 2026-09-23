const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const territoryMiddleware = require('../middlewares/territory.middleware');

router.use(authMiddleware, territoryMiddleware);

router.get('/founder', roleMiddleware('founder'), dashboardController.founderDashboard);
router.get('/team', roleMiddleware('team_lead', 'founder'), dashboardController.teamDashboard);
router.get('/bde/:id', dashboardController.bdeDashboard);
router.get('/export', roleMiddleware('founder', 'team_lead'), dashboardController.exportReport);

module.exports = router;
