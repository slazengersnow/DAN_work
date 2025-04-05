// controllers/settingsController.js

const settingsModel = require('../models/settingsModel');

const settingsController = {
  // システム設定の取得
  getSettings: async (req, res) => {
    try {
      const settings = await settingsModel.getSettings();
      res.status(200).json(settings);
    } catch (error) {
      console.error('設定の取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '設定の取得に失敗しました' });
    }
  },

  // システム設定の更新
  updateSettings: async (req, res) => {
    const settingsData = req.body;
    
    try {
      // バリデーション
      if (!settingsData.company_name) {
        return res.status(400).json({ error: '会社名は必須です' });
      }
      
      const updatedSettings = await settingsModel.updateSettings(settingsData);
      res.status(200).json(updatedSettings);
    } catch (error) {
      console.error('設定の更新中にエラーが発生しました:', error);
      res.status(500).json({ error: '設定の更新に失敗しました' });
    }
  },

  // 部門マスターデータの取得
  getDepartments: async (req, res) => {
    try {
      const departments = await settingsModel.getDepartments();
      res.status(200).json(departments);
    } catch (error) {
      console.error('部門データの取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '部門データの取得に失敗しました' });
    }
  },

  // 部門の追加
  addDepartment: async (req, res) => {
    const { name } = req.body;
    
    try {
      // バリデーション
      if (!name) {
        return res.status(400).json({ error: '部門名は必須です' });
      }
      
      const newDepartment = await settingsModel.addDepartment(name);
      res.status(201).json(newDepartment);
    } catch (error) {
      console.error('部門の追加中にエラーが発生しました:', error);
      res.status(500).json({ error: '部門の追加に失敗しました' });
    }
  },

  // 部門の更新
  updateDepartment: async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    try {
      // バリデーション
      if (!name) {
        return res.status(400).json({ error: '部門名は必須です' });
      }
      
      const updatedDepartment = await settingsModel.updateDepartment(id, name);
      
      if (!updatedDepartment) {
        return res.status(404).json({ error: '指定された部門が見つかりません' });
      }
      
      res.status(200).json(updatedDepartment);
    } catch (error) {
      console.error('部門の更新中にエラーが発生しました:', error);
      res.status(500).json({ error: '部門の更新に失敗しました' });
    }
  },

  // 部門の削除
  deleteDepartment: async (req, res) => {
    const { id } = req.params;
    
    try {
      const deletedDepartment = await settingsModel.deleteDepartment(id);
      
      if (!deletedDepartment) {
        return res.status(404).json({ error: '指定された部門が見つかりません' });
      }
      
      res.status(200).json({ message: '部門を削除しました', department: deletedDepartment });
    } catch (error) {
      if (error.message.includes('所属する従業員が存在する')) {
        return res.status(400).json({ error: error.message });
      }
      
      console.error('部門の削除中にエラーが発生しました:', error);
      res.status(500).json({ error: '部門の削除に失敗しました' });
    }
  },

  // 雇用形態マスターデータの取得
  getEmploymentStatuses: async (req, res) => {
    try {
      const statuses = await settingsModel.getEmploymentStatuses();
      res.status(200).json(statuses);
    } catch (error) {
      console.error('雇用形態データの取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '雇用形態データの取得に失敗しました' });
    }
  },

  // 雇用形態の追加
  addEmploymentStatus: async (req, res) => {
    const { name } = req.body;
    
    try {
      // バリデーション
      if (!name) {
        return res.status(400).json({ error: '雇用形態名は必須です' });
      }
      
      const newStatus = await settingsModel.addEmploymentStatus(name);
      res.status(201).json(newStatus);
    } catch (error) {
      console.error('雇用形態の追加中にエラーが発生しました:', error);
      res.status(500).json({ error: '雇用形態の追加に失敗しました' });
    }
  },

  // 雇用形態の更新
  updateEmploymentStatus: async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    try {
      // バリデーション
      if (!name) {
        return res.status(400).json({ error: '雇用形態名は必須です' });
      }
      
      const updatedStatus = await settingsModel.updateEmploymentStatus(id, name);
      
      if (!updatedStatus) {
        return res.status(404).json({ error: '指定された雇用形態が見つかりません' });
      }
      
      res.status(200).json(updatedStatus);
    } catch (error) {
      console.error('雇用形態の更新中にエラーが発生しました:', error);
      res.status(500).json({ error: '雇用形態の更新に失敗しました' });
    }
  },

  // 雇用形態の削除
  deleteEmploymentStatus: async (req, res) => {
    const { id } = req.params;
    
    try {
      const deletedStatus = await settingsModel.deleteEmploymentStatus(id);
      
      if (!deletedStatus) {
        return res.status(404).json({ error: '指定された雇用形態が見つかりません' });
      }
      
      res.status(200).json({ message: '雇用形態を削除しました', status: deletedStatus });
    } catch (error) {
      if (error.message.includes('従業員が存在する')) {
        return res.status(400).json({ error: error.message });
      }
      
      console.error('雇用形態の削除中にエラーが発生しました:', error);
      res.status(500).json({ error: '雇用形態の削除に失敗しました' });
    }
  },

  // 障害種別マスターデータの取得
  getDisabilityTypes: async (req, res) => {
    try {
      const types = await settingsModel.getDisabilityTypes();
      res.status(200).json(types);
    } catch (error) {
      console.error('障害種別データの取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '障害種別データの取得に失敗しました' });
    }
  },

  // 障害種別の追加
  addDisabilityType: async (req, res) => {
    const { name } = req.body;
    
    try {
      // バリデーション
      if (!name) {
        return res.status(400).json({ error: '障害種別名は必須です' });
      }
      
      const newType = await settingsModel.addDisabilityType(name);
      res.status(201).json(newType);
    } catch (error) {
      console.error('障害種別の追加中にエラーが発生しました:', error);
      res.status(500).json({ error: '障害種別の追加に失敗しました' });
    }
  },

  // 障害種別の更新
  updateDisabilityType: async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    try {
      // バリデーション
      if (!name) {
        return res.status(400).json({ error: '障害種別名は必須です' });
      }
      
      const updatedType = await settingsModel.updateDisabilityType(id, name);
      
      if (!updatedType) {
        return res.status(404).json({ error: '指定された障害種別が見つかりません' });
      }
      
      res.status(200).json(updatedType);
    } catch (error) {
      console.error('障害種別の更新中にエラーが発生しました:', error);
      res.status(500).json({ error: '障害種別の更新に失敗しました' });
    }
  },

  // 障害種別の削除
  deleteDisabilityType: async (req, res) => {
    const { id } = req.params;
    
    try {
      const deletedType = await settingsModel.deleteDisabilityType(id);
      
      if (!deletedType) {
        return res.status(404).json({ error: '指定された障害種別が見つかりません' });
      }
      
      res.status(200).json({ message: '障害種別を削除しました', type: deletedType });
    } catch (error) {
      if (error.message.includes('従業員が存在する')) {
        return res.status(400).json({ error: error.message });
      }
      
      console.error('障害種別の削除中にエラーが発生しました:', error);
      res.status(500).json({ error: '障害種別の削除に失敗しました' });
    }
  }
};

module.exports = settingsController;