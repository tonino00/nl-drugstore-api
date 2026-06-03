const cron = require('node-cron');
const { Op } = require('sequelize');

const { sequelize, Batch, ExpiryAlert, User, Medicine } = require('../models');
const notificationService = require('../services/notificationService');

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function jobDeactivateExpired() {
  const now = today();

  const expired = await Batch.findAll({ where: { is_active: true, expiry_date: { [Op.lt]: now } }, limit: 1000 });
  if (expired.length === 0) return;

  await sequelize.transaction(async (t) => {
    for (const b of expired) {
      await b.update({ is_active: false }, { transaction: t });
      await ExpiryAlert.create({ batch_id: b.id, alert_type: 'expired' }, { transaction: t });
    }
  });

  const count = expired.length;
  const pharmacists = await User.findAll({ where: { role: { [Op.in]: ['admin', 'pharmacist'] }, active: true } });
  for (const p of pharmacists) {
    await notificationService.createNotification(
      p.id,
      'Lotes vencidos desativados',
      `Foram desativados ${count} lote(s) vencido(s).`,
      'sla_warning',
      { count },
      'sla_warning'
    );
  }
}

async function jobUpcomingExpiries() {
  const now = today();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const rows = await Batch.findAll({
    where: { is_active: true, quantity: { [Op.gt]: 0 }, expiry_date: { [Op.gt]: now, [Op.lte]: in30 } },
    include: [{ model: Medicine, attributes: ['id', 'nome'] }],
    order: [['expiry_date', 'ASC']],
    limit: 2000,
  });

  for (const b of rows) {
    const exp = new Date(b.expiry_date);
    const type = exp <= in7 ? '7_days' : '30_days';
    await ExpiryAlert.create({ batch_id: b.id, alert_type: type });
  }

  if (rows.length > 0) {
    const pharmacists = await User.findAll({ where: { role: { [Op.in]: ['admin', 'pharmacist'] }, active: true } });
    for (const p of pharmacists) {
      await notificationService.createNotification(
        p.id,
        'Alertas de validade por lote',
        `${rows.length} lote(s) com validade próxima`,
        'sla_warning',
        { count: rows.length },
        'sla_warning'
      );
    }
  }
}

module.exports = {
  start: () => {
    // Job 1: diário 00:00
    cron.schedule('0 0 * * *', () => jobDeactivateExpired().catch(() => null));
    // Job 2: diário 08:00
    cron.schedule('0 8 * * *', () => jobUpcomingExpiries().catch(() => null));
  },
};
