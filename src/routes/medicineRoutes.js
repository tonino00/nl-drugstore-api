const express = require('express');
const { body } = require('express-validator');
const { Op } = require('sequelize');

const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const medicineController = require('../controllers/medicineController');
const { Medicine } = require('../models');

const router = express.Router();

// Validação reutilizável de codigo_barras (POST e PUT):
// opcional; se informado, deve ter entre 8 e 14 dígitos numéricos e ser único no banco.
const codigoBarrasValidator = body('codigo_barras')
  .optional({ nullable: true, checkFalsy: true })
  .matches(/^\d{8,14}$/)
  .withMessage('codigo_barras deve conter entre 8 e 14 dígitos numéricos')
  .bail()
  .custom(async (value, { req }) => {
    const where = { codigo_barras: value };
    // No update, ignora o próprio registro para não acusar conflito consigo mesmo.
    if (req.params.id) where.id = { [Op.ne]: req.params.id };
    const existing = await Medicine.findOne({ where });
    if (existing) throw new Error('codigo_barras já cadastrado');
    return true;
  });

router.get('/', medicineController.listPublic);
router.get('/search', medicineController.search);
router.get('/categories', medicineController.categories);
router.get('/expiring', auth, roleCheck(['admin', 'pharmacist']), medicineController.expiring);
router.get('/low-stock', auth, roleCheck(['admin', 'pharmacist']), medicineController.lowStock);
router.get('/barcode/:code', medicineController.findByBarcode);
router.get('/:id', medicineController.detail);
router.get('/:id/movements', auth, roleCheck(['admin', 'pharmacist']), medicineController.movements);

router.post(
  '/',
  auth,
  roleCheck(['admin', 'pharmacist']),
  body('nome').isString().notEmpty(),
  body('principio_ativo').isString().notEmpty(),
  body('validade').isString().notEmpty(),
  codigoBarrasValidator,
  medicineController.create
);

router.put(
  '/:id',
  auth,
  roleCheck(['admin', 'pharmacist']),
  body().custom(() => true),
  codigoBarrasValidator,
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
