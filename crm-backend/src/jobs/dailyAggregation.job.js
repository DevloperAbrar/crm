const cron = require('node-cron');
const { getFounderDashboard, getCityCoverageSummary } = require('../services/aggregation.service');
const logger = require('../utils/logger');

// In-memory cache for heavy dashboard stats, refreshed daily.
// A real deployment might persist this to a `dashboard_cache` collection instead.
const cache = {
  founderDashboard: null,
  cityCoverage: null,
  lastUpdated: null,
};

function scheduleDailyAggregation() {
  cron.schedule('0 1 * * *', async () => {
    try {
      cache.founderDashboard = await getFounderDashboard();
      cache.cityCoverage = await getCityCoverageSummary();
      cache.lastUpdated = new Date();
      logger.info('[dailyAggregation] Dashboard cache refreshed');
    } catch (err) {
      logger.error('[dailyAggregation] Failed:', err.message);
    }
  });
}

module.exports = { scheduleDailyAggregation, cache };
