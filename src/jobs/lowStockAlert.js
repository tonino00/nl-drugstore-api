const cron = require('node-cron');
const { Op } = require('sequelize');

const { Medicine, User } = require('../models');
const notificationService = require('../services/notificationService');

async function run() {
  const low = await Medicine.findAll({
    where: {
      active: true,
      quantidade: { [Op.lt]: { [Op.col]: 'quantidade_minima' } },
    },
    order: [['quantidade', 'ASC']],
    limit: 200,
  });

  if (low.length === 0) return;

  const pharmacists = await User.findAll({ where: { role: { [Op.in]: ['admin', 'pharmacist'] }, active: true } });

  for (const p of pharmacists) {
    await notificationService.createNotification(
      p.id,
      'Alerta de estoque baixo',
      `Há ${low.length} medicamento(s) abaixo do mínimo`,
      'sla_warning',
      { count: low.length },
      'sla_warning'
    );
  }
}

module.exports = {
  start: () => cron.schedule('*/10 * * * *', () => run().catch(() => null)),
};
