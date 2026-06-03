const express = require('express');
const { body } = require('express-validator');

const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const batchController = require('../controllers/batchController');

const router = express.Router();

// Rotas sob /api/medicines/:medicineId/batches
router.post(
  '/medicines/:medicineId/batches',
  auth,
  roleCheck(['admin', 'pharmacist']),
  batchController.validateCreate,
  batchController.create
);

router.get(
  '/medicines/:medicineId/batches',
  auth,
  roleCheck(['admin', 'pharmacist']),
  batchController.listByMedicine
);

// Rotas sob /api/batches
router.post(
  '/batches/:batchId/expire',
  auth,
  roleCheck(['admin', 'pharmacist']),
  batchController.expireManually
);

router.get(
  '/batches/expiring',
  auth,
  roleCheck(['admin', 'pharmacist']),
  batchController.expiring
);

// Rota pública de rastreio por número do lote
router.get('/batches/trace', batchController.trace);

module.exports = router;
