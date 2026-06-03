require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');
const { startJobs } = require('./jobs');
const notificationService = require('./services/notificationService');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await sequelize.authenticate();

  const shouldSync = String(process.env.DB_SYNC || '').toLowerCase() === 'true';
  const alter = String(process.env.DB_SYNC_ALTER || '').toLowerCase() === 'true';
  const force = String(process.env.DB_SYNC_FORCE || '').toLowerCase() === 'true';
  if (shouldSync) {
    const options = force ? { force: true } : alter ? { alter: true } : undefined;
    await sequelize.sync(options);
  }

  notificationService.startPolling();
  startJobs();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API rodando na porta ${PORT}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Falha ao iniciar a API:', err);
  process.exit(1);
});
