// backend/models/Setting.js
const pool = require('../config/database');

class Setting {
  static async getCompanySettings() {
    try {
      const query = 'SELECT * FROM company_settings LIMIT 1';
      const { rows } = await pool.query(query);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  static async updateCompanySettings(settings) {
    try {
      // 設定が存在するか確認
      const checkQuery = 'SELECT id FROM company_settings LIMIT 1';
      const checkResult = await pool.query(checkQuery);
      
      let query, values;
      
      if (checkResult.rows.length > 0) {
        // 更新
        query = `
          UPDATE company_settings 
          SET 
            company_name = $1,
            company_code = $2,
            company_address = $3,
            legal_rate = $4,
            fiscal_year_start = $5,
            fiscal_year_end = $6,
            monthly_report_reminder = $7,
            legal_rate_alert = $8,
            employment_end_notice = $9,
            theme = $10,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $11
          RETURNING *
        `;
        
        values = [
          settings.company_name,
          settings.company_code,
          settings.company_address,
          settings.legal_rate,
          settings.fiscal_year_start,
          settings.fiscal_year_end,
          settings.monthly_report_reminder,
          settings.legal_rate_alert,
          settings.employment_end_notice,
          settings.theme,
          checkResult.rows[0].id
        ];
      } else {
        // 新規作成
        query = `
          INSERT INTO company_settings 
          (company_name, company_code, company_address, legal_rate, 
           fiscal_year_start, fiscal_year_end, monthly_report_reminder, 
           legal_rate_alert, employment_end_notice, theme)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;
        
        values = [
          settings.company_name,
          settings.company_code,
          settings.company_address,
          settings.legal_rate,
          settings.fiscal_year_start,
          settings.fiscal_year_end,
          settings.monthly_report_reminder,
          settings.legal_rate_alert,
          settings.employment_end_notice,
          settings.theme
        ];
      }
      
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async getUsers() {
    try {
      const query = `
        SELECT id, username, role, created_at, updated_at
        FROM users
        ORDER BY id
      `;
      
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  static async createUser(user) {
    const bcrypt = require('bcrypt');
    
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      const query = `
        INSERT INTO users (username, password, role)
        VALUES ($1, $2, $3)
        RETURNING id, username, role, created_at
      `;
      
      const values = [user.username, hashedPassword, user.role || 'user'];
      
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async updateUser(id, user) {
    try {
      let query, values;
      
      // パスワードが提供されている場合は更新
      if (user.password) {
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        query = `
          UPDATE users
          SET username = $1, password = $2, role = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING id, username, role, created_at, updated_at
        `;
        
        values = [user.username, hashedPassword, user.role, id];
      } else {
        // パスワードがない場合はパスワード以外を更新
        query = `
          UPDATE users
          SET username = $1, role = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING id, username, role, created_at, updated_at
        `;
        
        values = [user.username, user.role, id];
      }
      
      const { rows } = await pool.query(query, values);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  static async deleteUser(id) {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      await pool.query(query, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Setting;