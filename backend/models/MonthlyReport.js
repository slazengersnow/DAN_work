// backend/models/MonthlyReport.js

const { pool } = require('../config/db');
const calculationUtils = require('../utils/calculationUtils');

class MonthlyReport {
  // 月次レポート一覧を取得（条件付き検索と並べ替え機能追加）
  static async find(conditions = {}) {
    try {
      let query = 'SELECT * FROM monthly_reports';
      const whereClauses = [];
      const values = [];
      
      // 検索条件の処理
      if (conditions.fiscal_year) {
        whereClauses.push(`fiscal_year = $${values.length + 1}`);
        values.push(conditions.fiscal_year);
      }
      
      if (conditions.month) {
        whereClauses.push(`month = $${values.length + 1}`);
        values.push(conditions.month);
      }
      
      if (conditions.status) {
        whereClauses.push(`status = $${values.length + 1}`);
        values.push(conditions.status);
      }
      
      // WHERE句の追加
      if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
      }
      
      // デフォルトの並べ替え
      query += ' ORDER BY fiscal_year DESC, month DESC';
      
      const result = await pool.query(query, values);
      
      // MongoDB互換のsortメソッドを持つオブジェクトを返す
      return {
        rows: result.rows,
        sort: function(sortOptions) {
          const [field, direction] = Object.entries(sortOptions)[0];
          const sortedRows = [...result.rows].sort((a, b) => {
            if (direction === 1 || direction === 'asc') {
              return a[field] > b[field] ? 1 : -1;
            } else {
              return a[field] < b[field] ? 1 : -1;
            }
          });
          return sortedRows;
        }
      };
    } catch (error) {
      console.error('月次レポート一覧取得エラー:', error);
      throw error;
    }
  }

  // 特定の年月の月次レポートを取得（PostgreSQL最適化）
  static async findOne(conditions) {
    try {
      // 検索条件の構築
      let query = 'SELECT * FROM monthly_reports';
      const whereClauses = [];
      const values = [];
      
      if (conditions.fiscal_year) {
        whereClauses.push(`fiscal_year = $${values.length + 1}`);
        values.push(conditions.fiscal_year);
      }
      
      if (conditions.month) {
        whereClauses.push(`month = $${values.length + 1}`);
        values.push(conditions.month);
      }
      
      if (conditions.id) {
        whereClauses.push(`id = $${values.length + 1}`);
        values.push(conditions.id);
      }
      
      // WHERE句の追加
      if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
      }
      
      // 1件だけ取得
      query += ' LIMIT 1';
      
      // サマリー情報の取得
      const summaryResult = await pool.query(query, values);
      
      if (summaryResult.rows.length === 0) {
        return null;
      }
      
      const summary = summaryResult.rows[0];
      
      // 従業員情報の取得
      const employeesQuery = `
        SELECT * FROM employee_monthly_status 
        WHERE fiscal_year = $1 AND month = $2
      `;
      const employeesResult = await pool.query(employeesQuery, [
        conditions.fiscal_year || summary.fiscal_year,
        conditions.month || summary.month
      ]);
      
      // 結果をまとめて返却
      return {
        ...summary,
        employees: employeesResult.rows || []
      };
    } catch (error) {
      console.error('月次レポート取得エラー:', error);
      throw error;
    }
  }

  // データベースからレポートを探し、なければnullを返す
  static async findOneAndUpdate(conditions, updateData, options = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { fiscal_year, month } = conditions;
      
      // 既存レコードの確認
      const checkQuery = `
        SELECT * FROM monthly_reports 
        WHERE fiscal_year = $1 AND month = $2
      `;
      const checkResult = await client.query(checkQuery, [fiscal_year, month]);
      
      let result;
      
      if (checkResult.rows.length > 0) {
        // 既存レコードの更新
        const fields = [];
        const values = [];
        let paramCounter = 1;
        
        Object.entries(updateData).forEach(([key, value]) => {
          fields.push(`${key} = $${paramCounter}`);
          values.push(value);
          paramCounter++;
        });
        
        // updated_atフィールドを更新
        fields.push(`updated_at = NOW()`);
        
        // WHERE句のパラメータを追加
        values.push(fiscal_year);
        values.push(month);
        
        const updateQuery = `
          UPDATE monthly_reports
          SET ${fields.join(', ')}
          WHERE fiscal_year = $${paramCounter} AND month = $${paramCounter + 1}
          RETURNING *
        `;
        
        result = await client.query(updateQuery, values);
      } else if (options.upsert) {
        // 新規レコード作成（upsertオプションが有効な場合）
        const keys = Object.keys(updateData);
        const placeholders = keys.map((_, i) => `$${i + 1}`);
        const values = Object.values(updateData);
        
        // fiscal_yearとmonthを追加
        if (!keys.includes('fiscal_year')) {
          keys.push('fiscal_year');
          placeholders.push(`$${keys.length}`);
          values.push(fiscal_year);
        }
        
        if (!keys.includes('month')) {
          keys.push('month');
          placeholders.push(`$${keys.length}`);
          values.push(month);
        }
        
        // created_atとupdated_atを追加
        keys.push('created_at', 'updated_at');
        placeholders.push('NOW()', 'NOW()');
        
        const insertQuery = `
          INSERT INTO monthly_reports (${keys.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        result = await client.query(insertQuery, values);
      } else {
        // upsertオプションがない場合はnullを返す
        await client.query('COMMIT');
        return null;
      }
      
      await client.query('COMMIT');
      
      return options.new ? result.rows[0] : checkResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('月次レポート更新/作成エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // レコードの削除
  static async findOneAndDelete(conditions) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { fiscal_year, month } = conditions;
      
      // 削除対象レコードの取得
      const selectQuery = `
        SELECT * FROM monthly_reports 
        WHERE fiscal_year = $1 AND month = $2
      `;
      const selectResult = await client.query(selectQuery, [fiscal_year, month]);
      
      if (selectResult.rows.length === 0) {
        await client.query('COMMIT');
        return null;
      }
      
      // レコード削除
      const deleteQuery = `
        DELETE FROM monthly_reports 
        WHERE fiscal_year = $1 AND month = $2
        RETURNING *
      `;
      
      await client.query(deleteQuery, [fiscal_year, month]);
      await client.query('COMMIT');
      
      return selectResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('月次レポート削除エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 新規月次レポートを作成
  static async create(data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        fiscal_year,
        month,
        employees_count,
        fulltime_count,
        parttime_count,
        level1_2_count,
        other_disability_count,
        level1_2_parttime_count,
        other_parttime_count,
        total_disability_count,
        employment_rate,
        legal_employment_rate,
        required_count,
        over_under_count,
        status
      } = data;
      
      // 既存レコードの確認
      const checkQuery = `
        SELECT id FROM monthly_reports 
        WHERE fiscal_year = $1 AND month = $2
      `;
      const checkResult = await client.query(checkQuery, [fiscal_year, month]);
      
      if (checkResult.rows.length > 0) {
        throw new Error('指定された年月のレポートは既に存在します');
      }
      
      // 新規レコード挿入
      const insertQuery = `
        INSERT INTO monthly_reports (
          fiscal_year, month, employees_count, fulltime_count, parttime_count,
          level1_2_count, other_disability_count, level1_2_parttime_count,
          other_parttime_count, total_disability_count, employment_rate,
          legal_employment_rate, required_count, over_under_count, status,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [
        fiscal_year,
        month,
        employees_count || 0,
        fulltime_count || 0,
        parttime_count || 0,
        level1_2_count || 0,
        other_disability_count || 0,
        level1_2_parttime_count || 0,
        other_parttime_count || 0,
        total_disability_count || 0,
        employment_rate || 0,
        legal_employment_rate || 2.3,
        required_count || 0,
        over_under_count || 0,
        status || '未確定'
      ];
      
      const result = await client.query(insertQuery, values);
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('月次レポート作成エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 月次レポートを更新
  static async update(conditions, updateData) {
    return this.findOneAndUpdate(conditions, updateData, { new: true });
  }

  // 従業員データの取得
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
      console.error('従業員データ取得エラー:', error);
      throw error;
    }
  }

  // 月次レポートの計算（従業員データから）
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
          disabledEmployees += parseFloat(e.count || 0);
        }
      });
      
      // 障害者タイプ別のカウント
      let level1_2_count = 0;
      let other_disability_count = 0;
      let level1_2_parttime_count = 0;
      let other_parttime_count = 0;
      
      employeeData.forEach(e => {
        if (e.status === '在籍中') {
          if (e.grade === '1級' || e.grade === '2級') {
            if (e.employment_type === '正社員') {
              level1_2_count += 1;
            } else {
              level1_2_parttime_count += 1;
            }
          } else if (e.disability_type) {
            if (e.employment_type === '正社員') {
              other_disability_count += 1;
            } else {
              other_parttime_count += 1;
            }
          }
        }
      });
      
      // 法定雇用率（設定から取得）
      const settingsQuery = `SELECT legal_rate FROM company_settings LIMIT 1`;
      const settingsResult = await client.query(settingsQuery);
      const legalRate = settingsResult.rows.length > 0 
        ? parseFloat(settingsResult.rows[0].legal_rate) 
        : 2.3;
      
      // 計算ユーティリティを使用して計算
      const data = {
        employees_count: totalEmployees,
        fulltime_count: fullTimeEmployees,
        parttime_count: partTimeEmployees,
        level1_2_count,
        other_disability_count,
        level1_2_parttime_count,
        other_parttime_count
      };
      
      // employment_rate の計算
      const employmentRate = calculationUtils.calculateLegalEmploymentRate(data);
      
      // 必要人数と過不足数の計算
      const requiredCount = Math.ceil((totalEmployees * legalRate) / 100);
      const overUnderCount = disabledEmployees - requiredCount;
      
      // 月次レポートデータの作成または更新
      const reportData = {
        fiscal_year: year,
        month: month,
        employees_count: totalEmployees,
        fulltime_count: fullTimeEmployees,
        parttime_count: partTimeEmployees,
        level1_2_count,
        other_disability_count,
        level1_2_parttime_count,
        other_parttime_count,
        total_disability_count: disabledEmployees,
        employment_rate: employmentRate,
        legal_employment_rate: legalRate,
        required_count: requiredCount,
        over_under_count: overUnderCount,
        status: '未確定'
      };
      
      // 既存レポートの更新または新規作成
      const result = await this.findOneAndUpdate(
        { fiscal_year: year, month: month },
        reportData,
        { new: true, upsert: true }
      );
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('月次データ計算エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 月次レポートを確定状態に更新
  static async confirmMonthlyReport(year, month) {
    try {
      const result = await this.findOneAndUpdate(
        { fiscal_year: year, month: month },
        { status: '確定済' },
        { new: true }
      );
      
      if (!result) {
        // レポートが存在しない場合は計算して作成
        const newReport = await this.calculateMonthlyData(year, month);
        return await this.findOneAndUpdate(
          { fiscal_year: year, month: month },
          { status: '確定済' },
          { new: true }
        );
      }
      
      return result;
    } catch (error) {
      console.error('月次レポート確定エラー:', error);
      throw error;
    }
  }

  // 従業員詳細を更新
  static async updateEmployeeDetail(year, month, employeeId, data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 従業員詳細データの更新
      const updateQuery = `
        UPDATE employee_monthly_status
        SET 
          disability_type = $1,
          grade = $2,
          count = $3,
          memo = $4,
          updated_at = NOW()
        WHERE fiscal_year = $5 AND month = $6 AND employee_id = $7
        RETURNING *
      `;
      
      const values = [
        data.disability_type || null,
        data.grade || null,
        data.count || 0,
        data.memo || '',
        year,
        month,
        employeeId
      ];
      
      const result = await client.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        // 存在しない場合は新規作成
        const insertQuery = `
          INSERT INTO employee_monthly_status (
            fiscal_year, month, employee_id, disability_type, grade, count, memo, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `;
        
        const insertResult = await client.query(insertQuery, values);
        
        await client.query('COMMIT');
        return insertResult.rows[0];
      }
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('従業員詳細更新エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 従業員詳細を新規作成
  static async createEmployeeDetail(year, month, data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 従業員IDが必須
      if (!data.employee_id) {
        throw new Error('従業員IDは必須です');
      }
      
      // 既存レコードの確認
      const checkQuery = `
        SELECT id FROM employee_monthly_status 
        WHERE fiscal_year = $1 AND month = $2 AND employee_id = $3
      `;
      const checkResult = await client.query(checkQuery, [year, month, data.employee_id]);
      
      if (checkResult.rows.length > 0) {
        throw new Error('指定された従業員の詳細は既に存在します');
      }
      
      // 新規レコード挿入
      const insertQuery = `
        INSERT INTO employee_monthly_status (
          fiscal_year, month, employee_id, name, disability_type, grade, 
          count, memo, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [
        year,
        month,
        data.employee_id,
        data.name || '',
        data.disability_type || null,
        data.grade || null,
        data.count || 0,
        data.memo || '',
        data.status || '在籍中'
      ];
      
      const result = await client.query(insertQuery, values);
      
      // 月次レポートの再計算
      await this.calculateMonthlyData(year, month);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('従業員詳細作成エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 年間データを取得
  static async getYearlyData(year) {
    try {
      // 年間の月次データを取得
      const query = `
        SELECT * FROM monthly_reports
        WHERE fiscal_year = $1
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
          
          try {
            // データがない月は計算して追加
            const calculatedData = await this.calculateMonthlyData(year, month);
            allMonths.push(calculatedData);
          } catch (error) {
            console.error(`${year}年${month}月のデータ計算中にエラー:`, error);
            // エラーが発生した場合は空のデータを追加
            allMonths.push({
              fiscal_year: year,
              month: month,
              employees_count: 0,
              fulltime_count: 0,
              parttime_count: 0,
              level1_2_count: 0,
              other_disability_count: 0,
              level1_2_parttime_count: 0,
              other_parttime_count: 0,
              total_disability_count: 0,
              employment_rate: 0,
              legal_employment_rate: 2.3,
              required_count: 0,
              over_under_count: 0,
              status: '未作成'
            });
          }
        }
      }
      
      return allMonths;
    } catch (error) {
      console.error('年間データ取得エラー:', error);
      throw error;
    }
  }

  // 計算ユーティリティを使用した関数
  static calculateEmploymentRate(data) {
    return calculationUtils.calculateLegalEmploymentRate(data);
  }

  static calculateShortage(data, legalRate) {
    return calculationUtils.calculateShortage(data, legalRate);
  }
}

module.exports = MonthlyReport;