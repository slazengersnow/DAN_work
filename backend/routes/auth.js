const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');

router.post('/login', validateUser, authController.login);
router.post('/register', authenticate, authorize('admin'), validateUser, authController.register);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
