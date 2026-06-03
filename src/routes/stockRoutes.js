const express = require('express');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const stockController = require('../controllers/stockController');

const router = express.Router();

router.post('/movements', auth, roleCheck(['admin', 'pharmacist']), stockController.validateMovement, stockController.createMovement);

module.exports = router;
