// controllers/employeeController.js

const employeeModel = require('../models/employeeModel');

const employeeController = {
  // 全従業員情報の取得
  getAllEmployees: async (req, res) => {
    try {
      const employees = await employeeModel.getAllEmployees();
      res.status(200).json(employees);
    } catch (error) {
      console.error('従業員情報の取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員情報の取得に失敗しました' });
    }
  },

  // ID別従業員情報の取得
  getEmployeeById: async (req, res) => {
    const { id } = req.params;
    
    try {
      const employee = await employeeModel.getEmployeeById(id);
      
      if (!employee) {
        return res.status(404).json({ error: '従業員が見つかりません' });
      }
      
      res.status(200).json(employee);
    } catch (error) {
      console.error('従業員情報の取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員情報の取得に失敗しました' });
    }
  },

  // 従業員情報の作成
  createEmployee: async (req, res) => {
    const employeeData = req.body;
    
    try {
      // バリデーション
      if (!employeeData.name || !employeeData.employee_id) {
        return res.status(400).json({ error: '従業員IDと氏名は必須です' });
      }
      
      const newEmployee = await employeeModel.createEmployee(employeeData);
      res.status(201).json(newEmployee);
    } catch (error) {
      console.error('従業員情報の作成中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員情報の作成に失敗しました' });
    }
  },

  // 従業員情報の更新
  updateEmployee: async (req, res) => {
    const { id } = req.params;
    const employeeData = req.body;
    
    try {
      // 従業員の存在確認
      const employee = await employeeModel.getEmployeeById(id);
      
      if (!employee) {
        return res.status(404).json({ error: '従業員が見つかりません' });
      }
      
      // バリデーション
      if (!employeeData.name || !employeeData.employee_id) {
        return res.status(400).json({ error: '従業員IDと氏名は必須です' });
      }
      
      const updatedEmployee = await employeeModel.updateEmployee(id, employeeData);
      res.status(200).json(updatedEmployee);
    } catch (error) {
      console.error('従業員情報の更新中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員情報の更新に失敗しました' });
    }
  },

  // 従業員情報の削除
  deleteEmployee: async (req, res) => {
    const { id } = req.params;
    
    try {
      // 従業員の存在確認
      const employee = await employeeModel.getEmployeeById(id);
      
      if (!employee) {
        return res.status(404).json({ error: '従業員が見つかりません' });
      }
      
      await employeeModel.deleteEmployee(id);
      res.status(200).json({ message: '従業員情報を削除しました' });
    } catch (error) {
      console.error('従業員情報の削除中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員情報の削除に失敗しました' });
    }
  },

  // 従業員統計情報の取得
  getEmployeeStats: async (req, res) => {
    try {
      const stats = await employeeModel.getEmployeeStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error('従業員統計情報の取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員統計情報の取得に失敗しました' });
    }
  },

  // 部門別従業員情報の取得
  getEmployeesByDepartment: async (req, res) => {
    try {
      const departmentStats = await employeeModel.getEmployeesByDepartment();
      res.status(200).json(departmentStats);
    } catch (error) {
      console.error('部門別従業員情報の取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '部門別従業員情報の取得に失敗しました' });
    }
  }
};

module.exports = employeeController;