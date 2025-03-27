// backend/models/MonthlyReport.js
const pool = require('../config/database');
const calculationUtils = require('../utils/calculationUtils');

class MonthlyReport {
  static async getMonthlyData(year, month) {
    try {
      // 月次合計データを取得
      const monthlyQuery = `
        SELECT * FROM monthly_totals 
        WHERE year = $1 AND month = $2
      `;
      
      const { rows } = await pool.query(monthlyQuery, [year, month]);
      
      // 存在しない場合は計算して作成
      if (rows.length === 0) {
        return this.calculateMonthlyData(year, month);
      }
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async getEmployeesByMonth(year, month) {
    try {
      const query = `
        SELECT e.id, e.employee_id, e.name, d.disability_type, 
          CASE
            WHEN d.physical_verified THEN d.physical_degree_current
            WHEN d.intellectual_verified THEN d.intellectual_degree_current
            WHEN d.mental_verified THEN d.mental_degree_current
            ELSE NULL
          END as grade,
          e.hire_date, e.status, e.count
        FROM employees e
        LEFT JOIN disabilities d ON e.id = d.employee_id
        WHERE (e.status = '在籍中' OR 
              (e.resignation_date IS NOT NULL AND 
               (EXTRACT(YEAR FROM e.resignation_date) > $1 OR 
                (EXTRACT(YEAR FROM e.resignation_date) = $1 AND 
                 EXTRACT(MONTH FROM e.resignation_date) >= $2))))
        ORDER BY e.id
      `;
      
      const { rows } = await pool.query(query, [year, month]);
      
      // 各従業員の月次勤務データを取得
      for (const employee of rows) {
        const monthlyWorkQuery = `
          SELECT scheduled_hours, actual_hours, exception_reason
          FROM monthly_work_hours
          WHERE employee_id = $1 AND year = $2 AND month = $3
        `;
        
        const monthlyWork = await pool.query(monthlyWorkQuery, [employee.id, year, month]);
        if (monthlyWork.rows.length > 0) {
          employee.monthlyWork = monthlyWork.rows[0];
        } else {
          employee.monthlyWork = {
            scheduled_hours: 160,
            actual_hours: 160,
            exception_reason: ''
          };
        }
      }
      
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  static async calculateMonthlyData(year, month) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 該当月の従業員データを取得
      const employeeData = await this.getEmployeesByMonth(year, month);
      
      // 合計値の計算
      const totalEmployees = employeeData.length;
      const fullTimeEmployees = employeeData.filter(e => e.status === '在籍中').length;
      const partTimeEmployees = 0; // 現在のモデルではパートタイム従業員は考慮していない
      
      // 障害者雇用数とカウント
      let disabledEmployees = 0;
      employeeData.forEach(e => {
        if (e.disability_type && e.status === '在籍中') {
          disabledEmployees += parseFloat(e.count);
        }
      });
      
      // 法定雇用率（設定から取得）
      const settingsQuery = `SELECT legal_rate FROM company_settings LIMIT 1`;
      const settingsResult = await client.query(settingsQuery);
      const legalRate = settingsResult.rows.length > 0 
        ? parseFloat(settingsResult.rows[0].legal_rate) 
        : 2.3;
      
      // 法定雇用数の計算
      const legalCount = Math.ceil(totalEmployees * (legalRate / 100));
      
      // 実雇用率の計算
      const actualRate = totalEmployees > 0 
        ? (disabledEmployees / totalEmployees) * 100 
        : 0;
      
      // 不足数の計算
      const shortage = disabledEmployees - legalCount;
      
      // 月次合計データの保存/更新
      const upsertQuery = `
        INSERT INTO monthly_totals
        (year, month, total_employees, full_time_employees, part_time_employees,
         disabled_employees, actual_rate, legal_rate, legal_count, shortage, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (year, month) 
        DO UPDATE SET
          total_employees = $3,
          full_time_employees = $4,
          part_time_employees = $5,
          disabled_employees = $6,
          actual_rate = $7,
          legal_rate = $8,
          legal_count = $9,
          shortage = $10,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const values = [
        year,
        month,
        totalEmployees,
        fullTimeEmployees,
        partTimeEmployees,
        disabledEmployees.toFixed(2),
        actualRate.toFixed(2),
        legalRate.toFixed(1),
        legalCount.toFixed(2),
        shortage.toFixed(2),
        '未確定'
      ];
      
      const result = await client.query(upsertQuery, values);
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async getYearlyData(year) {
    try {
      // 年間の月次データを取得
      const query = `
        SELECT * FROM monthly_totals
        WHERE year = $1
        ORDER BY month
      `;
      
      const { rows } = await pool.query(query, [year]);
      
      // 足りない月のデータを計算して追加
      const allMonths = [];
      
      for (let month = 1; month <= 12; month++) {
        const existingData = rows.find(row => row.month === month);
        
        if (existingData) {
          allMonths.push(existingData);
        } else {
          // 現在の日付を超える月はスキップ
          const currentDate = new Date();
          if (year > currentDate.getFullYear() || 
              (year === currentDate.getFullYear() && month > currentDate.getMonth() + 1)) {
            continue;
          }
          
          // データがない月は計算して追加
          const calculatedData = await this.calculateMonthlyData(year, month);
          allMonths.push(calculatedData);
        }
      }
      
      return allMonths;
    } catch (error) {
      throw error;
    }
  }
  
  static async confirmMonthlyData(year, month) {
    try {
      // ステータスを「確定済」に更新
      const query = `
        UPDATE monthly_totals
        SET status = '確定済', updated_at = CURRENT_TIMESTAMP
        WHERE year = $1 AND month = $2
        RETURNING *
      `;
      
      const { rows } = await pool.query(query, [year, month]);
      
      if (rows.length === 0) {
        // 存在しない場合は計算して作成してから確定
        const newData = await this.calculateMonthlyData(year, month);
        
        const confirmQuery = `
          UPDATE monthly_totals
          SET status = '確定済', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;
        
        const result = await pool.query(confirmQuery, [newData.id]);
        return result.rows[0];
      }
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MonthlyReport;