const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate } = require('../middleware/auth');
const { validateEmployee } = require('../middleware/validation');
// 基本CRUD操作
router.get('/', authenticate, employeeController.getAllEmployees);
router.get('/:id', authenticate, employeeController.getEmployeeById);
router.post('/', authenticate, validateEmployee, employeeController.createEmployee);
router.put('/:id', authenticate, employeeController.updateEmployee);
router.delete('/:id', authenticate, employeeController.deleteEmployee);

module.exports = router;
