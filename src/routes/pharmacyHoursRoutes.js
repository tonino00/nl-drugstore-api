const express = require('express');
const { body } = require('express-validator');

const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const pharmacyHoursController = require('../controllers/pharmacyHoursController');

const router = express.Router();

router.get('/', pharmacyHoursController.get);
router.get('/status', pharmacyHoursController.status);
router.get('/next-opening', pharmacyHoursController.nextOpening);

router.put(
  '/',
  auth,
  roleCheck(['admin', 'pharmacist']),
  body().custom(() => true),
  pharmacyHoursController.set
);

module.exports = router;
