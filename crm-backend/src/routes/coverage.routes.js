const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const {
  getStateCoverage,
  getCityCoverage,
  toggleCoverage,
  getStateSummary,
} = require('../controllers/coverage.controller');

// Founder-only feature: "which city have we already pitched which category in".
// Same auth + role pattern as import.routes.js / audit.routes.js.
router.get('/:stateCode/summary', authMiddleware, roleMiddleware('founder'), getStateSummary);
router.get('/:stateCode/:cityName', authMiddleware, roleMiddleware('founder'), getCityCoverage);
router.get('/:stateCode', authMiddleware, roleMiddleware('founder'), getStateCoverage);
router.put(
  '/:stateCode/:cityName/:categoryId',
  authMiddleware,
  roleMiddleware('founder'),
  toggleCoverage
);

module.exports = router;
