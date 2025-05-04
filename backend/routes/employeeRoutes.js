const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
// 認証ミドルウェア（一時的にコメントアウト）
// const authMiddleware = require('../middleware/authMiddleware');

// ======= 従業員関連のルート =======

// 全従業員の取得
// GET /api/employees?year=2024 (年度パラメータはオプション)
router.get('/', /*authMiddleware,*/ employeeController.getAllEmployees);

// 従業員統計の取得
// GET /api/employees/stats?year=2024 (年度パラメータはオプション)
router.get('/stats', /*authMiddleware,*/ employeeController.getEmployeeStats);

// 部門別従業員情報の取得
// GET /api/employees/departments?year=2024 (年度パラメータはオプション)
router.get('/departments', /*authMiddleware,*/ employeeController.getEmployeesByDepartment);

// 従業員の追加
// POST /api/employees
router.post('/', /*authMiddleware,*/ employeeController.createEmployee);

// IDによる従業員の取得
// GET /api/employees/:id
router.get('/:id', /*authMiddleware,*/ employeeController.getEmployeeById);

// 従業員情報の更新
// PUT /api/employees/:id
router.put('/:id', /*authMiddleware,*/ employeeController.updateEmployee);

// 従業員の削除
// DELETE /api/employees/:id
router.delete('/:id', /*authMiddleware,*/ employeeController.deleteEmployee);

// デバッグ用のログミドルウェア
router.use((req, res, next) => {
  console.log(`${req.method} リクエスト: ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('リクエストボディ:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// エラーハンドリングミドルウェア
router.use((err, req, res, next) => {
  console.error('ルーターでエラーが発生しました:', err);
  res.status(500).json({
    error: 'サーバーエラーが発生しました',
    message: err.message || '不明なエラー'
  });
});

module.exports = router;