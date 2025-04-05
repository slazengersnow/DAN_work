// routes/employeeRoutes.js

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// 全従業員の取得
router.get('/', employeeController.getAllEmployees);

// 従業員統計の取得
router.get('/stats', employeeController.getEmployeeStats);

// 部門別従業員情報の取得
router.get('/departments', employeeController.getEmployeesByDepartment);

// 従業員の追加
router.post('/', employeeController.createEmployee);

// IDによる従業員の取得
router.get('/:id', employeeController.getEmployeeById);

// 従業員情報の更新
router.put('/:id', employeeController.updateEmployee);

// 従業員の削除
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;