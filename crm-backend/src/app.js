const express = require('express');
const cors = require('cors');
const path = require('path');
const { CLIENT_URL } = require('./config/env');
const errorHandlerMiddleware = require('./middlewares/errorHandler.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const leadRoutes = require('./routes/lead.routes');
const interactionRoutes = require('./routes/interaction.routes');
const calendarRoutes = require('./routes/calendar.routes');
const categoryRoutes = require('./routes/category.routes');
const importRoutes = require('./routes/import.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const fraudRoutes = require('./routes/fraud.routes');
const mapRoutes = require('./routes/map.routes');
const metaRoutes = require('./routes/meta.routes');
const dealRoutes = require('./routes/deal.routes');
const auditRoutes = require('./routes/audit.routes');
const coverageRoutes = require('./routes/coverage.routes');


const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serves uploaded attachments (Section 4.4/5.10 - visiting cards, pricing
// PDFs). Swap this for a signed S3 URL scheme later without touching any
// controller, since callers only ever deal in `fileUrl`.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'CRM API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/import', importRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/coverage', coverageRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/deals', dealRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandlerMiddleware);

module.exports = app;
