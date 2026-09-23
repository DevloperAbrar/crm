const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { PORT, validateEnv } = require('./config/env');
const scheduleStaleLeadChecker = require('./jobs/staleLeadChecker.job');
const { scheduleDailyAggregation } = require('./jobs/dailyAggregation.job');

// Safety net: log unexpected async errors instead of letting one bad
// promise (e.g. a transient DB write failure in a socket handler) take
// the whole server down. This does NOT replace fixing the root cause -
// it just stops a single non-fatal error from becoming total downtime.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection] Non-fatal error, server staying up:', reason);
});

async function start() {
  validateEnv();
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  scheduleStaleLeadChecker();
  scheduleDailyAggregation();

  server.listen(PORT, () => {
    console.log(`[server] Campussafar CRM backend running on port ${PORT}`);
  });
}

start();
