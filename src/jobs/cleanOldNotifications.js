const cron = require('node-cron');
const notificationService = require('../services/notificationService');

async function run() {
  await notificationService.deleteOldNotifications(30);
}

module.exports = {
  start: () => cron.schedule('0 23 * * *', () => run().catch(() => null)),
};
