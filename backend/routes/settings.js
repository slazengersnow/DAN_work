// backend/routes/settings.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

// 会社設定
router.get('/company', authenticate, settingsController.getCompanySettings);
router.put('/company', authenticate, authorize('admin'), settingsController.updateCompanySettings);

// ユーザー管理
router.get('/users', authenticate, authorize('admin'), settingsController.getUsers);
router.post('/users', authenticate, authorize('admin'), settingsController.createUser);
router.put('/users/:id', authenticate, authorize('admin'), settingsController.updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), settingsController.deleteUser);

module.exports = router;