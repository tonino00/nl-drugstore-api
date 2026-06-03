const { Op } = require('sequelize');
const { sequelize, Medicine, Batch, StockMovement, User } = require('../models');

function todayDateOnly() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function recalcMedicineQuantity(medicineId, t) {
  const total = await Batch.sum('quantity', {
    where: { medicine_id: medicineId, is_active: true },
    transaction: t,
  });
  const qty = Number(total || 0);
  const med = await Medicine.findByPk(medicineId, { transaction: t });
  if (med) await med.update({ quantidade: qty }, { transaction: t });
  return qty;
}

async function addStockEntry({ medicineId, batchNumber, quantity, expiryDate, manufacturingDate, motivo, observacao, userId }) {
  if (!batchNumber) throw new Error('batchNumber é obrigatório');
  if (!quantity || Number(quantity) <= 0) throw new Error('quantity deve ser > 0');

  const today = todayDateOnly();
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  if (isNaN(exp.getTime()) || exp <= today) throw new Error('expiryDate inválida ou no passado');

  return sequelize.transaction(async (t) => {
    const med = await Medicine.findByPk(medicineId, { transaction: t });
    if (!med || !med.active) throw new Error('Medicamento não encontrado');

    let batch = await Batch.findOne({ where: { medicine_id: medicineId, batch_number: batchNumber }, transaction: t, lock: t.LOCK.UPDATE });

    if (!batch) {
      batch = await Batch.create(
        {
          medicine_id: medicineId,
          batch_number: batchNumber,
          quantity: Number(quantity),
          manufacturing_date: manufacturingDate || null,
          expiry_date: exp,
          is_active: true,
          created_by: userId || null,
        },
        { transaction: t }
      );
    } else {
      if (batch.is_active === false) throw new Error('Lote inativo');
      const batchExp = new Date(batch.expiry_date);
      batchExp.setHours(0, 0, 0, 0);
      if (batchExp.getTime() !== exp.getTime()) {
        throw new Error('expiryDate não corresponde ao lote existente');
      }
      const newQty = Number(batch.quantity) + Number(quantity);
      await batch.update(
        {
          quantity: newQty,
          manufacturing_date: batch.manufacturing_date || manufacturingDate || null,
        },
        { transaction: t }
      );
    }

    await StockMovement.create(
      {
        medicine_id: medicineId,
        tipo: 'entrada',
        quantidade: Number(quantity),
        motivo: motivo || 'entrada_lote',
        observacao: observacao || null,
        usuario_id: userId || null,
        batch_id: batch.id,
        batch_number: batch.batch_number,
      },
      { transaction: t }
    );

    await recalcMedicineQuantity(medicineId, t);

    return batch;
  });
}

async function consumeStockPEPS({ medicineId, quantity, motivo, observacao, userId }) {
  if (!quantity || Number(quantity) <= 0) throw new Error('quantity deve ser > 0');

  return sequelize.transaction(async (t) => {
    const med = await Medicine.findByPk(medicineId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!med || !med.active) throw new Error('Medicamento não encontrado');

    const now = todayDateOnly();

    const batches = await Batch.findAll({
      where: {
        medicine_id: medicineId,
        is_active: true,
        quantity: { [Op.gt]: 0 },
        expiry_date: { [Op.gt]: now },
      },
      order: [
        ['expiry_date', 'ASC'],
        ['id', 'ASC'],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let remaining = Number(quantity);
    const totalAvailable = batches.reduce((sum, b) => sum + Number(b.quantity), 0);
    if (totalAvailable < remaining) {
      const err = new Error('Estoque insuficiente para saída solicitada');
      err.code = 'INSUFFICIENT_STOCK';
      throw err;
    }

    const consumed = [];

    for (const b of batches) {
      if (remaining <= 0) break;
      const take = Math.min(Number(b.quantity), remaining);
      if (take <= 0) continue;

      await b.update({ quantity: Number(b.quantity) - take }, { transaction: t });

      await StockMovement.create(
        {
          medicine_id: medicineId,
          tipo: 'saida',
          quantidade: take,
          motivo: motivo || 'saida_consumo',
          observacao: observacao || null,
          usuario_id: userId || null,
          batch_id: b.id,
          batch_number: b.batch_number,
        },
        { transaction: t }
      );

      consumed.push({ batchId: b.id, batchNumber: b.batch_number, quantity: take, expiryDate: b.expiry_date });
      remaining -= take;
    }

    await recalcMedicineQuantity(medicineId, t);

    return { consumed };
  });
}

async function expireBatch(batchId, userId) {
  return sequelize.transaction(async (t) => {
    const batch = await Batch.findByPk(batchId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!batch) throw new Error('Lote não encontrado');

    if (batch.is_active) {
      // registrar baixa do restante
      const remaining = Number(batch.quantity || 0);
      if (remaining > 0) {
        await StockMovement.create(
          {
            medicine_id: batch.medicine_id,
            tipo: 'saida',
            quantidade: remaining,
            motivo: 'baixa_lote_vencido',
            observacao: null,
            usuario_id: userId || null,
            batch_id: batch.id,
            batch_number: batch.batch_number,
          },
          { transaction: t }
        );
      }
      await batch.update({ is_active: false, quantity: 0 }, { transaction: t });
      await recalcMedicineQuantity(batch.medicine_id, t);
    }

    return batch;
  });
}

async function listBatchesForMedicine(medicineId, status) {
  const where = { medicine_id: medicineId };
  const now = todayDateOnly();
  if (status === 'active') {
    Object.assign(where, { is_active: true });
  } else if (status === 'expired') {
    Object.assign(where, { is_active: false });
  }

  const batches = await Batch.findAll({ where, order: [['expiry_date', 'ASC'], ['batch_number', 'ASC']] });

  const totalQuantity = batches.filter((b) => b.is_active).reduce((s, b) => s + Number(b.quantity || 0), 0);
  const activeBatches = batches.filter((b) => b.is_active).length;
  const expiredBatches = batches.filter((b) => !b.is_active || new Date(b.expiry_date) <= now).length;
  const expSoonCut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoon = batches.filter((b) => b.is_active && new Date(b.expiry_date) > now && new Date(b.expiry_date) <= expSoonCut).length;

  return { batches, summary: { totalQuantity, activeBatches, expiredBatches, expiringSoon } };
}

async function getExpiringBatches(days = 30) {
  const now = todayDateOnly();
  const cutoff = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
  const rows = await Batch.findAll({
    where: { is_active: true, quantity: { [Op.gt]: 0 }, expiry_date: { [Op.gt]: now, [Op.lte]: cutoff } },
    order: [['expiry_date', 'ASC']],
    limit: 500,
  });
  return rows;
}

async function traceBatch(batchNumber) {
  const b = await Batch.findOne({ where: { batch_number: batchNumber }, include: [{ model: Medicine, attributes: ['id', 'nome'] }] });
  if (!b) return null;
  const now = todayDateOnly();
  const isValid = !!(b.is_active && new Date(b.expiry_date) > now && Number(b.quantity || 0) > 0);
  return {
    medicineName: b.Medicine ? b.Medicine.nome : null,
    manufacturingDate: b.manufacturing_date,
    expiryDate: b.expiry_date,
    isValid,
  };
}

module.exports = {
  recalcMedicineQuantity,
  addStockEntry,
  consumeStockPEPS,
  expireBatch,
  listBatchesForMedicine,
  getExpiringBatches,
  traceBatch,
};
