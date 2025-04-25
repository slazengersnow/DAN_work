// models/settingsModel.js

const { pool } = require('../config/db');  // 正しいインポート方法に修正

const settingsModel = {
  // システム設定の取得
  getSettings: async () => {
    try {
      const result = await pool.query('SELECT * FROM settings WHERE id = 1');
      
      if (result.rows.length === 0) {
        // デフォルト設定を返す
        return {
          success: true,
          data: {
            company_name: '株式会社サンプル',
            company_address: '東京都千代田区サンプル1-1-1',
            representative_name: '代表 太郎',
            legal_employment_rate: 2.3,
            fiscal_year_start_month: 4,
            contact_person: '担当 花子',
            phone_number: '03-1234-5678',
            email: 'contact@sample.co.jp',
            legal_employment_rates: [{ fiscal_year: new Date().getFullYear(), rate: 2.5 }],
            created_at: new Date(),
            updated_at: new Date()
          }
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('設定の取得中にエラーが発生しました:', error);
      // エラー時にもデフォルト値を返却
      return { 
        success: false, 
        message: 'エラーが発生しました',
        data: {
          legal_employment_rates: [{ fiscal_year: new Date().getFullYear(), rate: 2.5 }]
        }
      };
    }
  },

  // システム設定の更新
  updateSettings: async (settingsData) => {
    try {
      // 設定が存在するか確認
      const existingSettings = await pool.query('SELECT 1 FROM settings WHERE id = 1');
      
      if (existingSettings.rows.length === 0) {
        // 新規作成
        const result = await pool.query(
          `INSERT INTO settings (
            id, company_name, company_address, representative_name,
            legal_employment_rate, fiscal_year_start_month, contact_person,
            phone_number, email, created_at, updated_at
          ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
          RETURNING *`,
          [
            settingsData.company_name,
            settingsData.company_address,
            settingsData.representative_name,
            settingsData.legal_employment_rate,
            settingsData.fiscal_year_start_month,
            settingsData.contact_person,
            settingsData.phone_number,
            settingsData.email
          ]
        );
        
        return {
          success: true,
          data: result.rows[0]
        };
      } else {
        // 更新
        const result = await pool.query(
          `UPDATE settings SET
            company_name = $1,
            company_address = $2,
            representative_name = $3,
            legal_employment_rate = $4,
            fiscal_year_start_month = $5,
            contact_person = $6,
            phone_number = $7,
            email = $8,
            updated_at = NOW()
           WHERE id = 1
           RETURNING *`,
          [
            settingsData.company_name,
            settingsData.company_address,
            settingsData.representative_name,
            settingsData.legal_employment_rate,
            settingsData.fiscal_year_start_month,
            settingsData.contact_person,
            settingsData.phone_number,
            settingsData.email
          ]
        );
        
        return {
          success: true,
          data: result.rows[0]
        };
      }
    } catch (error) {
      console.error('設定の更新中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 部門マスターデータの取得
  getDepartments: async () => {
    try {
      const result = await pool.query('SELECT * FROM departments ORDER BY name');
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('部門データの取得中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 部門の追加
  addDepartment: async (name) => {
    try {
      const result = await pool.query(
        'INSERT INTO departments (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING *',
        [name]
      );
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('部門の追加中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 部門の更新
  updateDepartment: async (id, name) => {
    try {
      const result = await pool.query(
        'UPDATE departments SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [name, id]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: '更新対象の部門が見つかりません'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('部門の更新中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 部門の削除
  deleteDepartment: async (id) => {
    try {
      // この部門を使用している従業員がいないか確認
      const employeeCheck = await pool.query(
        'SELECT 1 FROM employees WHERE department = (SELECT name FROM departments WHERE id = $1)',
        [id]
      );
      
      if (employeeCheck.rows.length > 0) {
        return {
          success: false,
          message: 'この部門に所属する従業員が存在するため削除できません'
        };
      }
      
      const result = await pool.query(
        'DELETE FROM departments WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: '削除対象の部門が見つかりません'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('部門の削除中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 雇用形態マスターデータの取得
  getEmploymentStatuses: async () => {
    try {
      const result = await pool.query('SELECT * FROM employment_statuses ORDER BY name');
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('雇用形態データの取得中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 雇用形態の追加
  addEmploymentStatus: async (name) => {
    try {
      const result = await pool.query(
        'INSERT INTO employment_statuses (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING *',
        [name]
      );
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('雇用形態の追加中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 雇用形態の更新
  updateEmploymentStatus: async (id, name) => {
    try {
      const result = await pool.query(
        'UPDATE employment_statuses SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [name, id]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: '更新対象の雇用形態が見つかりません'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('雇用形態の更新中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 雇用形態の削除
  deleteEmploymentStatus: async (id) => {
    try {
      // この雇用形態を使用している従業員がいないか確認
      const employeeCheck = await pool.query(
        'SELECT 1 FROM employees WHERE employment_status = (SELECT name FROM employment_statuses WHERE id = $1)',
        [id]
      );
      
      if (employeeCheck.rows.length > 0) {
        return {
          success: false,
          message: 'この雇用形態の従業員が存在するため削除できません'
        };
      }
      
      const result = await pool.query(
        'DELETE FROM employment_statuses WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: '削除対象の雇用形態が見つかりません'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('雇用形態の削除中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 障害種別マスターデータの取得
  getDisabilityTypes: async () => {
    try {
      const result = await pool.query('SELECT * FROM disability_types ORDER BY name');
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('障害種別データの取得中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 障害種別の追加
  addDisabilityType: async (name) => {
    try {
      const result = await pool.query(
        'INSERT INTO disability_types (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING *',
        [name]
      );
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('障害種別の追加中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 障害種別の更新
  updateDisabilityType: async (id, name) => {
    try {
      const result = await pool.query(
        'UPDATE disability_types SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [name, id]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: '更新対象の障害種別が見つかりません'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('障害種別の更新中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  },

  // 障害種別の削除
  deleteDisabilityType: async (id) => {
    try {
      // この障害種別を使用している従業員がいないか確認
      const disabilityCheck = await pool.query(
        'SELECT 1 FROM disabilities WHERE disability_type = (SELECT name FROM disability_types WHERE id = $1)',
        [id]
      );
      
      if (disabilityCheck.rows.length > 0) {
        return {
          success: false,
          message: 'この障害種別の従業員が存在するため削除できません'
        };
      }
      
      const result = await pool.query(
        'DELETE FROM disability_types WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: '削除対象の障害種別が見つかりません'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('障害種別の削除中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: 'エラーが発生しました',
      };
    }
  }
};

module.exports = settingsModel;