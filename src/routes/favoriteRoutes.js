const express = require('express');

const auth = require('../middlewares/auth');
const favoriteController = require('../controllers/favoriteController');

const router = express.Router();

router.post('/:medicineId', auth, favoriteController.add);
router.delete('/:medicineId', auth, favoriteController.remove);
router.get('/', auth, favoriteController.list);
router.post('/:medicineId/notify', auth, favoriteController.enableNotify);

module.exports = router;
