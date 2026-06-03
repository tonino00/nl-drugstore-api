const { body, validationResult } = require('express-validator');
const stockService = require('../services/stockService');
const { Medicine } = require('../models');

function ok(res, data = {}, message = '') {
  return res.json({ success: true, data, message, errors: [] });
}

function bad(res, message, errors = []) {
  return res.status(400).json({ success: false, data: {}, message, errors });
}

module.exports = {
  validateMovement: [
    body('medicineId').isInt({ min: 1 }),
    body('type').isString().isIn(['entrada', 'saida']),
    body('quantity').isInt({ min: 1 }),
    body('batchNumber').if((v, { req }) => req.body.type === 'entrada').isString().notEmpty(),
    body('expiryDate').if((v, { req }) => req.body.type === 'entrada').isISO8601().toDate(),
    body('manufacturingDate').optional().isISO8601().toDate(),
  ],

  createMovement: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return bad(res, 'Dados inválidos', errors.array());

    const { medicineId, type, quantity, batchNumber, expiryDate, manufacturingDate, motivo, observacao, pacienteId } = req.body;

    try {
      const med = await Medicine.findByPk(medicineId);
      if (!med || !med.active) return res.status(404).json({ success: false, data: {}, message: 'Medicamento não encontrado', errors: [] });

      if (type === 'entrada') {
        const batch = await stockService.addStockEntry({
          medicineId: Number(medicineId),
          batchNumber,
          quantity: Number(quantity),
          expiryDate,
          manufacturingDate,
          motivo: motivo || 'entrada_manual',
          observacao: observacao || null,
          userId: req.user?.id || null,
        });
        return ok(res, { batch }, 'Entrada registrada');
      }

      if (type === 'saida') {
        const comment = pacienteId ? `Paciente: ${pacienteId}${observacao ? ' - ' + observacao : ''}` : observacao || null;
        const result = await stockService.consumeStockPEPS({
          medicineId: Number(medicineId),
          quantity: Number(quantity),
          motivo: motivo || 'dispensacao',
          observacao: comment,
          userId: req.user?.id || null,
        });
        return ok(res, result, 'Saída registrada');
      }

      return bad(res, 'Tipo inválido');
    } catch (err) {
      if (err.code === 'INSUFFICIENT_STOCK') {
        return res.status(409).json({ success: false, data: {}, message: err.message, errors: [] });
      }
      return bad(res, err.message);
    }
  },
};
