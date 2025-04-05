const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
// 認証ミドルウェア（一時的にコメントアウト）
// const authMiddleware = require('../middleware/authMiddleware');

// 全従業員の取得
// 認証ミドルウェアを一時的に無効化
router.get('/', /*authMiddleware,*/ employeeController.getAllEmployees);

// 従業員統計の取得
// 認証ミドルウェアを一時的に無効化
router.get('/stats', /*authMiddleware,*/ employeeController.getEmployeeStats);

// 部門別従業員情報の取得
// 認証ミドルウェアを一時的に無効化
router.get('/departments', /*authMiddleware,*/ employeeController.getEmployeesByDepartment);

// 従業員の追加
// 認証ミドルウェアを一時的に無効化
router.post('/', /*authMiddleware,*/ employeeController.createEmployee);

// IDによる従業員の取得
// 認証ミドルウェアを一時的に無効化
router.get('/:id', /*authMiddleware,*/ employeeController.getEmployeeById);

// 従業員情報の更新
// 認証ミドルウェアを一時的に無効化
router.put('/:id', /*authMiddleware,*/ employeeController.updateEmployee);

// 従業員の削除
// 認証ミドルウェアを一時的に無効化
router.delete('/:id', /*authMiddleware,*/ employeeController.deleteEmployee);

module.exports = router;