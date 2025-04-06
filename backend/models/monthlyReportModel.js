// models/monthlyReportModel.js

const db = require('../config/db');

const monthlyReportModel = {
  // 月次レポートの取得
  getMonthlyReport: async (year, month) => {
    try {
      // 指定年月の従業員数と障害者数を取得
      const employeeStatsResult = await db.query(`
        SELECT
          COUNT(*) as total_employees,
          COUNT(CASE WHEN d.id IS NOT NULL THEN 1 END) as disabled_employees,
          ROUND(COUNT(CASE WHEN d.id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as disability_rate
        FROM
          employees e
        LEFT JOIN
          disabilities d ON e.id = d.employee_id
        WHERE
          e.hire_date <= $1
          AND (e.resignation_date IS NULL OR e.resignation_date > $1)
      `, [`${year}-${month}-01`]);
      
      // 月次雇用データが既に存在するか確認
      const existingReport = await db.query(
        'SELECT * FROM monthly_reports WHERE year = $1 AND month = $2',
        [year, month]
      );
      
      let reportData = null;
      
      if (existingReport.rows.length > 0) {
        // 既存のレポートデータを返す
        reportData = existingReport.rows[0];
      } else {
        // 雇用率の計算
        const stats = employeeStatsResult.rows[0];
        
        // 新規レポートデータを保存
        const newReport = await db.query(
          `INSERT INTO monthly_reports (
            year, month, total_employees, disabled_employees, employment_rate,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
          [year, month, stats.total_employees, stats.disabled_employees, stats.disability_rate]
        );
        
        reportData = newReport.rows[0];
      }
      
      // 部門別の詳細データを取得
      const departmentData = await db.query(`
        SELECT
          'All' as department, /* 実際のカラム構造に合わせて修正 */
          COUNT(*) as total,
          COUNT(CASE WHEN d.id IS NOT NULL THEN 1 END) as disabled,
          ROUND(COUNT(CASE WHEN d.id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as rate
        FROM
          employees e
        LEFT JOIN
          disabilities d ON e.id = d.employee_id
        WHERE
          e.hire_date <= $1
          AND (e.resignation_date IS NULL OR e.resignation_date > $1)
        /* GROUP BY句は実際のカラム構造に合わせて修正 */
      `, [`${year}-${month}-01`]);
      
      // 障害種別ごとのデータを取得
      const disabilityTypeData = await db.query(`
        SELECT
          d.disability_type,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / NULLIF((
            SELECT COUNT(*) FROM disabilities
            JOIN employees e ON disabilities.employee_id = e.id
            WHERE
              e.hire_date <= $1
              AND (e.resignation_date IS NULL OR e.resignation_date > $1)
          ), 0), 2) as percentage
        FROM
          disabilities d
        JOIN
          employees e ON d.employee_id = e.id
        WHERE
          e.hire_date <= $1
          AND (e.resignation_date IS NULL OR e.resignation_date > $1)
        GROUP BY
          d.disability_type
        ORDER BY
          count DESC
      `, [`${year}-${month}-01`]);
      
      // 障害等級ごとのデータを取得（仮定に基づく修正例）
      const disabilityGradeData = await db.query(`
        SELECT
          COALESCE(d.physical_degree_current, d.intellectual_degree_current, d.mental_degree_current) as disability_grade,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / NULLIF((
            SELECT COUNT(*) FROM disabilities
            JOIN employees e ON disabilities.employee_id = e.id
            WHERE
              e.hire_date <= $1
              AND (e.resignation_date IS NULL OR e.resignation_date > $1)
          ), 0), 2) as percentage
        FROM
          disabilities d
        JOIN
          employees e ON d.employee_id = e.id
        WHERE
          e.hire_date <= $1
          AND (e.resignation_date IS NULL OR e.resignation_date > $1)
          AND (d.physical_degree_current IS NOT NULL OR d.intellectual_degree_current IS NOT NULL OR d.mental_degree_current IS NOT NULL)
        GROUP BY
          disability_grade
        ORDER BY
          disability_grade
      `, [`${year}-${month}-01`]);
      
      // 最終的なレポートデータを構築
      return {
        report: reportData,
        departments: departmentData.rows,
        disabilityTypes: disabilityTypeData.rows,
        disabilityGrades: disabilityGradeData.rows
      };
    } catch (error) {
      throw error;
    }
  },

  // 月次レポートの保存・更新
  saveMonthlyReport: async (year, month, reportData) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 既存のレポートを確認
      const existingReport = await client.query(
        'SELECT * FROM monthly_reports WHERE year = $1 AND month = $2',
        [year, month]
      );
      
      let reportId;
      
      if (existingReport.rows.length > 0) {
        // 既存レポートを更新
        const updateResult = await client.query(
          `UPDATE monthly_reports SET
            total_employees = $1,
            disabled_employees = $2,
            employment_rate = $3,
            notes = $4,
            updated_at = NOW()
           WHERE year = $5 AND month = $6
           RETURNING id`,
          [
            reportData.total_employees,
            reportData.disabled_employees,
            reportData.employment_rate,
            reportData.notes,
            year,
            month
          ]
        );
        
        reportId = updateResult.rows[0].id;
      } else {
        // 新規レポートを作成
        const insertResult = await client.query(
          `INSERT INTO monthly_reports (
            year, month, total_employees, disabled_employees, employment_rate,
            notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
          RETURNING id`,
          [
            year,
            month,
            reportData.total_employees,
            reportData.disabled_employees,
            reportData.employment_rate,
            reportData.notes
          ]
        );
        
        reportId = insertResult.rows[0].id;
      }
      
      await client.query('COMMIT');
      
      // 更新されたレポートを取得して返す
      return await monthlyReportModel.getMonthlyReport(year, month);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 全ての月次レポートリスト取得
  getAllMonthlyReports: async () => {
    try {
      const result = await db.query(`
        SELECT
          year, month, total_employees, disabled_employees, employment_rate, 
          created_at, updated_at
        FROM
          monthly_reports
        ORDER BY
          year DESC, month DESC
      `);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // 年間推移データの取得
  getYearlyTrend: async (year) => {
    try {
      const result = await db.query(`
        SELECT
          month,
          total_employees,
          disabled_employees,
          employment_rate
        FROM
          monthly_reports
        WHERE
          year = $1
        ORDER BY
          month ASC
      `, [year]);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // 月次レポートの削除
  deleteMonthlyReport: async (year, month) => {
    try {
      const result = await db.query(
        'DELETE FROM monthly_reports WHERE year = $1 AND month = $2 RETURNING *',
        [year, month]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = monthlyReportModel;