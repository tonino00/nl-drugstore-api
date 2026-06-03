const expiryAlert = require('./expiryAlert');
const lowStockAlert = require('./lowStockAlert');
const cleanOldNotifications = require('./cleanOldNotifications');
const expiryCheck = require('./expiryCheck');

function startJobs() {
  expiryAlert.start();
  lowStockAlert.start();
  cleanOldNotifications.start();
  expiryCheck.start();
}

module.exports = { startJobs };
