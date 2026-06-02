const express = require('express');
const { body } = require('express-validator');

const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const medicineController = require('../controllers/medicineController');

const router = express.Router();

router.get('/', medicineController.listPublic);
router.get('/search', medicineController.search);
router.get('/categories', medicineController.categories);
router.get('/expiring', auth, roleCheck(['admin', 'pharmacist']), medicineController.expiring);
router.get('/low-stock', auth, roleCheck(['admin', 'pharmacist']), medicineController.lowStock);
router.get('/:id', medicineController.detail);
router.get('/:id/movements', auth, roleCheck(['admin', 'pharmacist']), medicineController.movements);

router.post(
  '/',
  auth,
  roleCheck(['admin', 'pharmacist']),
  body('nome').isString().notEmpty(),
  body('principio_ativo').isString().notEmpty(),
  body('validade').isString().notEmpty(),
  medicineController.create
);

router.put(
  '/:id',
  auth,
  roleCheck(['admin', 'pharmacist']),
  body().custom(() => true),
  medicineController.update
);

router.delete('/:id', auth, roleCheck(['admin', 'pharmacist']), medicineController.softDelete);

router.patch(
  '/:id/stock',
  auth,
  roleCheck(['admin', 'pharmacist']),
  body('delta').isInt(),
  medicineController.updateStock
);

module.exports = router;
