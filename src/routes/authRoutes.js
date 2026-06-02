const express = require('express');
const { body } = require('express-validator');

const auth = require('../middlewares/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  body('nome').isString().notEmpty(),
  body('email').isEmail(),
  body('senha').isString().isLength({ min: 6 }),
  authController.register
);

router.post('/login', body('email').isEmail(), body('senha').isString().notEmpty(), authController.login);
router.post('/logout', auth, authController.logout);

router.get('/me', auth, authController.me);
router.put('/profile', auth, authController.updateProfile);
router.put(
  '/change-password',
  auth,
  body('currentPassword').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 6 }),
  authController.changePassword
);

router.post('/forgot-password', body('email').isEmail(), authController.forgotPassword);
router.post('/verify-reset-token', body('token').isString().notEmpty(), authController.verifyResetToken);
router.post(
  '/reset-password',
  body('token').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 6 }),
  authController.resetPassword
);

module.exports = router;
