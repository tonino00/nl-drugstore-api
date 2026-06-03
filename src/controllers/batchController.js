const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Medicine, Batch, ExpiryAlert } = require('../models');
const stockService = require('../services/stockService');

function ok(res, data = {}, message = '') {
  return res.json({ success: true, data, message, errors: [] });
}

function bad(res, message, errors = []) {
  return res.status(400).json({ success: false, data: {}, message, errors });
}

module.exports = {
  validateCreate: [
    body('batchNumber').isString().notEmpty(),
    body('quantity').isInt({ min: 0 }),
    body('expiryDate').isISO8601().toDate(),
    body('manufacturingDate').optional().isISO8601().toDate(),
  ],

  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return bad(res, 'Dados inválidos', errors.array());

    const { medicineId } = req.params;
    const { batchNumber, quantity, manufacturingDate, expiryDate, notes } = req.body;

    try {
      // validações de negócio básicas
      const today = new Date(); today.setHours(0,0,0,0);
      const exp = new Date(expiryDate); exp.setHours(0,0,0,0);
      if (exp <= today) return bad(res, 'expiryDate não pode ser anterior a hoje');
      if (Number(quantity) < 0) return bad(res, 'quantity não pode ser negativa');

      const med = await Medicine.findByPk(medicineId);
      if (!med || !med.active) return res.status(404).json({ success: false, data: {}, message: 'Medicamento não encontrado', errors: [] });

      const existing = await Batch.findOne({ where: { medicine_id: medicineId, batch_number: batchNumber } });
      if (existing) return bad(res, 'batchNumber já cadastrado para este medicamento');

      const batch = await stockService.addStockEntry({
        medicineId: Number(medicineId),
        batchNumber,
        quantity: Number(quantity),
        expiryDate,
        manufacturingDate,
        motivo: 'cadastro_lote',
        observacao: notes || null,
        userId: req.user?.id || null,
      });

      return ok(res, { batch }, 'Lote criado com sucesso');
    } catch (err) {
      return bad(res, err.message);
    }
  },

  listByMedicine: async (req, res) => {
    const { medicineId } = req.params;
    const status = String(req.query.status || 'active');
    try {
      const med = await Medicine.findByPk(medicineId);
      if (!med) return res.status(404).json({ success: false, data: {}, message: 'Medicamento não encontrado', errors: [] });

      const { batches, summary } = await stockService.listBatchesForMedicine(Number(medicineId), status);
      return ok(res, { rows: batches, summary });
    } catch (err) {
      return bad(res, err.message);
    }
  },

  expireManually: async (req, res) => {
    const { batchId } = req.params;
    try {
      const batch = await stockService.expireBatch(Number(batchId), req.user?.id || null);
      return ok(res, { batch }, 'Lote desativado');
    } catch (err) {
      return bad(res, err.message);
    }
  },

  expiring: async (req, res) => {
    const days = Number(req.query.days || 30);
    try {
      const rows = await stockService.getExpiringBatches(days);
      return ok(res, { rows });
    } catch (err) {
      return bad(res, err.message);
    }
  },

  trace: async (req, res) => {
    const { batchNumber } = req.query;
    if (!batchNumber) return bad(res, 'batchNumber é obrigatório');

    try {
      const info = await stockService.traceBatch(String(batchNumber));
      if (!info) return res.status(404).json({ success: false, data: {}, message: 'Lote não encontrado', errors: [] });
      return ok(res, info);
    } catch (err) {
      return bad(res, err.message);
    }
  },
};
