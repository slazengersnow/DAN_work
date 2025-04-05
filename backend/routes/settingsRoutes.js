const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
// 認証ミドルウェア（一時的にコメントアウト）
// const authMiddleware = require('../middleware/authMiddleware');

// システム設定の取得
// 認証ミドルウェアを一時的に無効化
router.get('/', /*authMiddleware,*/ settingsController.getSettings);

// システム設定の更新
// 認証ミドルウェアを一時的に無効化
router.put('/', /*authMiddleware,*/ settingsController.updateSettings);

// 部門マスターデータの取得
// 認証ミドルウェアを一時的に無効化
router.get('/departments', /*authMiddleware,*/ settingsController.getDepartments);

// 部門の追加
// 認証ミドルウェアを一時的に無効化
router.post('/departments', /*authMiddleware,*/ settingsController.addDepartment);

// 部門の更新
// 認証ミドルウェアを一時的に無効化
router.put('/departments/:id', /*authMiddleware,*/ settingsController.updateDepartment);

// 部門の削除
// 認証ミドルウェアを一時的に無効化
router.delete('/departments/:id', /*authMiddleware,*/ settingsController.deleteDepartment);

// 雇用形態マスターデータの取得
// 認証ミドルウェアを一時的に無効化
router.get('/employment-statuses', /*authMiddleware,*/ settingsController.getEmploymentStatuses);

// 雇用形態の追加
// 認証ミドルウェアを一時的に無効化
router.post('/employment-statuses', /*authMiddleware,*/ settingsController.addEmploymentStatus);

// 雇用形態の更新
// 認証ミドルウェアを一時的に無効化
router.put('/employment-statuses/:id', /*authMiddleware,*/ settingsController.updateEmploymentStatus);

// 雇用形態の削除
// 認証ミドルウェアを一時的に無効化
router.delete('/employment-statuses/:id', /*authMiddleware,*/ settingsController.deleteEmploymentStatus);

// 障害種別マスターデータの取得
// 認証ミドルウェアを一時的に無効化
router.get('/disability-types', /*authMiddleware,*/ settingsController.getDisabilityTypes);

// 障害種別の追加
// 認証ミドルウェアを一時的に無効化
router.post('/disability-types', /*authMiddleware,*/ settingsController.addDisabilityType);

// 障害種別の更新
// 認証ミドルウェアを一時的に無効化
router.put('/disability-types/:id', /*authMiddleware,*/ settingsController.updateDisabilityType);

// 障害種別の削除
// 認証ミドルウェアを一時的に無効化
router.delete('/disability-types/:id', /*authMiddleware,*/ settingsController.deleteDisabilityType);

module.exports = router;