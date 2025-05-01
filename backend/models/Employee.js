// backend/models/Employee.js
const { pool } = require('../config/db');

class Employee {
  // 従業員を検索
  static async findOne(conditions) {
    try {
      const { report_id, id, employee_id } = conditions;
      const whereClauses = [];
      const values = [];
      
      if (report_id) {
        whereClauses.push(`report_id = $${values.length + 1}`);
        values.push(report_id);
      }
      
      if (id) {
        whereClauses.push(`id = $${values.length + 1}`);
        values.push(id);
      }
      
      if (employee_id) {
        whereClauses.push(`employee_id = $${values.length + 1}`);
        values.push(employee_id);
      }
      
      let query = 'SELECT * FROM employee_monthly_status';
      
      if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
      }
      
      query += ' LIMIT 1';
      
      const result = await pool.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('従業員検索エラー:', error);
      throw error;
    }
  }
  
  // 従業員を作成
  static async create(employeeData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { 
        report_id, 
        employee_id, 
        name, 
        disability_type, 
        disability, 
        grade, 
        hire_date, 
        status, 
        monthly_status, 
        memo, 
        count 
      } = employeeData;
      
      // 従業員データの存在確認
      const checkQuery = `
        SELECT id FROM employee_monthly_status 
        WHERE report_id = $1 AND employee_id = $2
      `;
      const checkResult = await client.query(checkQuery, [report_id, employee_id]);
      
      if (checkResult.rows.length > 0) {
        throw new Error('同じ社員IDの従業員が既に存在します');
      }
      
      // 新規従業員を作成
      const insertQuery = `
        INSERT INTO employee_monthly_status (
          report_id, employee_id, name, disability_type, disability, 
          grade, hire_date, status, monthly_status, memo, count, 
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
          NOW(), NOW()
        )
        RETURNING *
      `;
      
      const monthlyStatusJson = monthly_status ? 
        JSON.stringify(monthly_status) : 
        JSON.stringify(Array(12).fill(1));
      
      const insertValues = [
        report_id,
        employee_id,
        name,
        disability_type || '',
        disability || '',
        grade || '',
        hire_date || new Date().toISOString().split('T')[0],
        status || '在籍',
        monthlyStatusJson,
        memo || '',
        count || (grade === '1級' || grade === '2級' ? 2 : 1)
      ];
      
      const result = await client.query(insertQuery, insertValues);
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('従業員作成エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // 従業員を削除
  static async deleteOne(conditions) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { report_id, id } = conditions;
      
      if (!report_id || !id) {
        throw new Error('report_idとidは必須です');
      }
      
      // 削除前に従業員データを取得
      const selectQuery = `
        SELECT * FROM employee_monthly_status 
        WHERE report_id = $1 AND id = $2
      `;
      const selectResult = await client.query(selectQuery, [report_id, id]);
      
      if (selectResult.rows.length === 0) {
        throw new Error('指定された従業員が見つかりません');
      }
      
      // 従業員を削除
      const deleteQuery = `
        DELETE FROM employee_monthly_status 
        WHERE report_id = $1 AND id = $2
        RETURNING *
      `;
      
      const result = await client.query(deleteQuery, [report_id, id]);
      await client.query('COMMIT');
      
      return result.rows.length > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('従業員削除エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // 従業員を更新
  static async update(id, updateData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 更新するフィールドを準備
      const fields = [];
      const values = [];
      let paramCounter = 1;
      
      Object.entries(updateData).forEach(([key, value]) => {
        // monthly_statusは特別な処理
        if (key === 'monthlyStatus' || key === 'monthly_status') {
          fields.push(`monthly_status = $${paramCounter}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCounter}`);
          values.push(value);
        }
        paramCounter++;
      });
      
      // updated_atフィールドを更新
      fields.push(`updated_at = NOW()`);
      
      // 更新対象のidを追加
      values.push(id);
      
      const updateQuery = `
        UPDATE employee_monthly_status
        SET ${fields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, values);
      await client.query('COMMIT');
      
      if (result.rows.length === 0) {
        throw new Error('指定された従業員が見つかりません');
      }
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('従業員更新エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // 特定の月次レポートの全従業員を取得
  static async findByReportId(reportId) {
    try {
      const query = `
        SELECT * FROM employee_monthly_status 
        WHERE report_id = $1
        ORDER BY employee_id
      `;
      
      const result = await pool.query(query, [reportId]);
      return result.rows;
    } catch (error) {
      console.error('従業員一覧取得エラー:', error);
      throw error;
    }
  }
  
  // 特定の年月の全従業員を取得
  static async findByYearMonth(year, month) {
    try {
      // まず指定された年月の月次レポートIDを取得
      const reportQuery = `
        SELECT id FROM monthly_reports
        WHERE fiscal_year = $1 AND month = $2
      `;
      
      const reportResult = await pool.query(reportQuery, [year, month]);
      
      if (reportResult.rows.length === 0) {
        // 該当する月次レポートがない場合は空配列を返す
        return [];
      }
      
      const reportId = reportResult.rows[0].id;
      
      // レポートIDを使用して従業員データを取得
      const query = `
        SELECT * FROM employee_monthly_status 
        WHERE report_id = $1
        ORDER BY employee_id
      `;
      
      const result = await pool.query(query, [reportId]);
      
      // 月次ステータスのJSONを配列に変換
      const employees = result.rows.map(emp => {
        if (emp.monthly_status && typeof emp.monthly_status === 'string') {
          try {
            emp.monthlyStatus = JSON.parse(emp.monthly_status);
          } catch (e) {
            emp.monthlyStatus = Array(12).fill(1);
          }
        } else {
          emp.monthlyStatus = Array(12).fill(1);
        }
        return emp;
      });
      
      return employees;
    } catch (error) {
      console.error(`${year}年${month}月の従業員一覧取得エラー:`, error);
      throw error;
    }
  }
  
  // 全従業員を取得
  static async findAll() {
    try {
      const query = `
        SELECT e.*, 
          d.disability_type, d.physical_verified, d.intellectual_verified, d.mental_verified,
          d.physical_degree_current, d.intellectual_degree_current, d.mental_degree_current
        FROM employees e
        LEFT JOIN disabilities d ON e.id = d.employee_id
        ORDER BY e.employee_id
      `;
      
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('従業員一覧取得エラー:', error);
      throw error;
    }
  }
  
  // 従業員を詳細情報付きで取得
  static async findById(id) {
    try {
      const query = `
        SELECT e.*, 
          d.disability_type, d.physical_verified, d.intellectual_verified, d.mental_verified,
          d.physical_degree_current, d.intellectual_degree_current, d.mental_degree_current,
          d.certificate_number, d.expiry_date
        FROM employees e
        LEFT JOIN disabilities d ON e.id = d.employee_id
        WHERE e.id = $1
      `;
      
      const { rows } = await pool.query(query, [id]);
      if (rows.length === 0) return null;
      
      // 月次データの取得
      const monthlyQuery = `
        SELECT year, month, scheduled_hours, actual_hours, exception_reason
        FROM monthly_work_hours
        WHERE employee_id = $1
        ORDER BY year, month
      `;
      
      const monthlyResult = await pool.query(monthlyQuery, [id]);
      rows[0].monthlyData = monthlyResult.rows;
      
      return rows[0];
    } catch (error) {
      console.error('従業員詳細取得エラー:', error);
      throw error;
    }
  }
}

module.exports = Employee;