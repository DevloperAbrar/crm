// Centralised error handler - must be registered last in app.js
function errorHandlerMiddleware(err, req, res, next) {
  console.error('[error]', err);

  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandlerMiddleware;
