const express = require('express');
const { body } = require('express-validator');

const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/stream', auth, notificationController.stream);
router.get('/', auth, notificationController.list);
router.get('/unread-count', auth, notificationController.unreadCount);
router.patch('/read-all', auth, notificationController.markAllRead);
router.patch('/:id/read', auth, notificationController.markRead);
router.delete('/:id', auth, notificationController.remove);

router.post(
  '/test',
  auth,
  roleCheck(['admin', 'pharmacist']),
  body('userId').isInt(),
  body('title').isString().notEmpty(),
  body('body').isString().notEmpty(),
  body('type').isString().notEmpty(),
  notificationController.test
);

module.exports = router;
