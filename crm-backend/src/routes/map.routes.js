const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const territoryMiddleware = require('../middlewares/territory.middleware');

router.use(authMiddleware, territoryMiddleware);

router.get('/pins', mapController.getPins);
router.get('/heatmap', mapController.getHeatmap);
router.get('/coverage-summary', mapController.getCoverageSummary);
router.get('/city/:cityId', mapController.getCityDrilldown);

module.exports = router;
