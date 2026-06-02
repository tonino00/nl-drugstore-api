const expiryAlert = require('./expiryAlert');
const lowStockAlert = require('./lowStockAlert');
const cleanOldNotifications = require('./cleanOldNotifications');

function startJobs() {
  expiryAlert.start();
  lowStockAlert.start();
  cleanOldNotifications.start();
}

module.exports = { startJobs };
