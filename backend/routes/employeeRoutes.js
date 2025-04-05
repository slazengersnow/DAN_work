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

router.post('/', (req, res) => {
  console.log('POST request received:', req.body);
  try {
    // 仮の実装
    res.status(201).json({ message: '従業員が追加されました', data: req.body });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '従業員の追加に失敗しました' });
  }
});

router.put('/:id', (req, res) => {
  console.log(`PUT request for ID ${req.params.id}:`, req.body);
  try {
    // 仮の実装
    res.status(200).json({ message: '従業員が更新されました', id: req.params.id, data: req.body });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '従業員の更新に失敗しました' });
  }
});

router.delete('/:id', (req, res) => {
  console.log(`DELETE request for ID ${req.params.id}`);
  try {
    // 仮の実装
    res.status(200).json({ message: '従業員が削除されました', id: req.params.id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '従業員の削除に失敗しました' });
  }
});

module.exports = router;
