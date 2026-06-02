const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const rateLimitMiddleware = require('./middlewares/rateLimit');
const sseMiddleware = require('./middlewares/sse');

const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pharmacyHoursRoutes = require('./routes/pharmacyHoursRoutes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Desativar rate limiting em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ Rate limiting desativado em desenvolvimento');
} else {
  app.use(rateLimitMiddleware);
}

app.use(sseMiddleware);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pharmacy-hours', pharmacyHoursRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erro interno' });
});

module.exports = app;
