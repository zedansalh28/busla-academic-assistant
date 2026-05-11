require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { initializeDatabase } = require('./db/schema');
const sessionsRouter = require('./routes/sessions');
const profilesRouter = require('./routes/profiles');
const chatRouter = require('./routes/chat');
const plansRouter = require('./routes/plans');
const recommendationsRouter = require('./routes/recommendations');
const coursesRouter = require('./routes/courses');
const demoRouter = require('./routes/demo');
const authRouter = require('./routes/auth');
const optimizerRouter = require('./routes/optimizer');
const riskRouter = require('./routes/risk');
const analyticsRouter = require('./routes/analytics');
const predictionsRouter = require('./routes/predictions');
const memoryRouter = require('./routes/memory');
const { errorHandler } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initializeDatabase();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/sessions', sessionsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/plans', plansRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/demo', demoRouter);
app.use('/api/auth', authRouter);
app.use('/api/optimizer', optimizerRouter);
app.use('/api/risk', riskRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/memory', memoryRouter);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Busla Backend Server`);
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
