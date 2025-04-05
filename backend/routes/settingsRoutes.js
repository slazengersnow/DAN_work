// routes/settingsRoutes.js

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// システム設定の取得
router.get('/', settingsController.getSettings);

// システム設定の更新
router.put('/', settingsController.updateSettings);

// 部門マスターデータの取得
router.get('/departments', settingsController.getDepartments);

// 部門の追加
router.post('/departments', settingsController.addDepartment);

// 部門の更新
router.put('/departments/:id', settingsController.updateDepartment);

// 部門の削除
router.delete('/departments/:id', settingsController.deleteDepartment);

// 雇用形態マスターデータの取得
router.get('/employment-statuses', settingsController.getEmploymentStatuses);

// 雇用形態の追加
router.post('/employment-statuses', settingsController.addEmploymentStatus);

// 雇用形態の更新
router.put('/employment-statuses/:id', settingsController.updateEmploymentStatus);

// 雇用形態の削除
router.delete('/employment-statuses/:id', settingsController.deleteEmploymentStatus);

// 障害種別マスターデータの取得
router.get('/disability-types', settingsController.getDisabilityTypes);

// 障害種別の追加
router.post('/disability-types', settingsController.addDisabilityType);

// 障害種別の更新
router.put('/disability-types/:id', settingsController.updateDisabilityType);

// 障害種別の削除
router.delete('/disability-types/:id', settingsController.deleteDisabilityType);

module.exports = router;