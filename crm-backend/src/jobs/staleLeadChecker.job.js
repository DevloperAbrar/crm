const cron = require('node-cron');
const { evaluateStaleLeads } = require('../services/fraudDetection.service');
const logger = require('../utils/logger');

// Runs daily at 02:00 server time
function scheduleStaleLeadChecker() {
  cron.schedule('0 2 * * *', async () => {
    try {
      const count = await evaluateStaleLeads();
      logger.info(`[staleLeadChecker] Flagged ${count} stale lead(s)`);
    } catch (err) {
      logger.error('[staleLeadChecker] Failed:', err.message);
    }
  });
}

module.exports = scheduleStaleLeadChecker;
