const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const adaptiveTokenBucket = require('./middlewares/adaptiveTokenBucket');
const concurrencyMiddleware = require('./middlewares/concurrency');
const sseMiddleware = require('./middlewares/sse');

const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pharmacyHoursRoutes = require('./routes/pharmacyHoursRoutes');
const batchRoutes = require('./routes/batchRoutes');
const stockRoutes = require('./routes/stockRoutes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = (process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(adaptiveTokenBucket);
// Controle de concorrência com fila curta e timeout
app.use(concurrencyMiddleware);

app.use(sseMiddleware);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pharmacy-hours', pharmacyHoursRoutes);
app.use('/api', batchRoutes);
app.use('/api/stock', stockRoutes);

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Not allowed by CORS' });
    return;
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erro interno' });
});

module.exports = app;
