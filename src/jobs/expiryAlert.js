const cron = require('node-cron');
const { Op } = require('sequelize');

const { Medicine, User } = require('../models');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

async function run() {
  const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const expiring = await Medicine.findAll({
    where: { active: true, validade: { [Op.lte]: cutoff } },
    order: [['validade', 'ASC']],
    limit: 200,
  });

  if (expiring.length === 0) return;

  const pharmacists = await User.findAll({ where: { role: { [Op.in]: ['admin', 'pharmacist'] }, active: true } });

  for (const p of pharmacists) {
    await notificationService.createNotification(
      p.id,
      'Alerta de vencimento (7 dias)',
      `Há ${expiring.length} medicamento(s) vencendo em até 7 dias`,
      'sla_warning',
      { count: expiring.length },
      'sla_warning'
    );

    await emailService.sendDailyReport(
      p.email,
      `<p>Medicamentos vencendo em até 7 dias: ${expiring.length}</p>`
    );
  }
}

module.exports = {
  start: () => cron.schedule('*/5 * * * *', () => run().catch(() => null)),
};
