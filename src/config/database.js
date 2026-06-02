const { Sequelize } = require('sequelize');

function buildSequelize() {
  const databaseUrl = process.env.DATABASE_URL;

  const dialectOptions = {};
  const sslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';

  if (sslEnabled) {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false,
    };
  }

  if (databaseUrl) {
    return new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions,
    });
  }

  const dbName = process.env.DB_NAME || process.env.DB_DATABASE;
  const dbUser = process.env.DB_USER || process.env.DB_USERNAME;
  const dbPassword = process.env.DB_PASSWORD;

  return new Sequelize(dbName, dbUser, dbPassword, {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres',
    logging: false,
    dialectOptions,
  });
}

const sequelize = buildSequelize();

module.exports = sequelize;
