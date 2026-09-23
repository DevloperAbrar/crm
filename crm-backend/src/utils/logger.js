const levels = ['info', 'warn', 'error'];

function log(level, ...args) {
  const ts = new Date().toISOString();
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`[${ts}] [${level.toUpperCase()}]`, ...args);
}

module.exports = levels.reduce((logger, level) => {
  logger[level] = (...args) => log(level, ...args);
  return logger;
}, {});
