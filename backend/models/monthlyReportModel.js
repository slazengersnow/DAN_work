// models/monthlyReportModel.js

const db = require('../config/db');
const calculationUtils = require('../utils/calculationUtils');

const monthlyReportModel = {
  // 特定の年月の月次報告を取得
  getMonthlyReport: async (year, month) => {
    try {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      const result = await db.query(
        'SELECT * FROM monthly_reports WHERE fiscal_year = $1 AND month = $2',
        [yearNum, monthNum]
      );
      
      if (result.rows.length === 0) {
        // データがない場合は自動生成
        const calculatedData = await monthlyReportModel.calculateMonthReport(yearNum, monthNum);
        
        return {
          success: true,
          report: calculatedData || {
            fiscal_year: yearNum,
            month: monthNum,
            total_employees: 0,
            disabled_employees: 0,
            employment_rate: 0,
            legal_employment_rate: 2.3,
            status: '未作成'
          }
        };
      }
      
      // データを整形して返却
      const report = result.rows[0];
      
      return {
        success: true,
        report: {
          id: report.id,
          fiscal_year: report.fiscal_year,
          month: report.month,
          total_employees: report.employees_count || 0,
          disabled_employees: report.total_disability_count || 0,
          employment_rate: report.employment_rate || 0,
          legal_employment_rate: report.legal_employment_rate || 2.3,
          status: report.status || '未確定',
          notes: report.notes || '',
          created_at: report.created_at,
          updated_at: report.updated_at
        }
      };
    } catch (error) {
      console.error('月次レポート取得エラー:', error);
      throw error;
    }
  },

  // 月次レポートの保存
  saveMonthlyReport: async (year, month, reportData) => {
    try {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      // 既存レコードの確認
      const checkQuery = 'SELECT * FROM monthly_reports WHERE fiscal_year = $1 AND month = $2';
      const checkResult = await db.query(checkQuery, [yearNum, monthNum]);
      
      // 変換と計算
      const employees_count = reportData.employees_count || reportData.total_employees || 0;
      const total_disability_count = reportData.total_disability_count || reportData.disabled_employees || 0;
      
      // 実雇用率の計算（従業員数が0の場合は0とする）
      const employment_rate = employees_count > 0 
        ? (total_disability_count / employees_count) * 100 
        : 0;
      
      // 法定雇用率（通常は2.3%）
      const legal_employment_rate = reportData.legal_employment_rate || 2.3;
      
      // 法定雇用障害者数の計算（小数点以下切り捨て）
      const required_count = Math.floor(employees_count * (legal_employment_rate / 100));
      
      // 不足数の計算
      const over_under_count = total_disability_count - required_count;
      
      if (checkResult.rows.length > 0) {
        // 既存レコードの更新
        const updateQuery = `
          UPDATE monthly_reports SET
            employees_count = $1,
            fulltime_count = $2,
            parttime_count = $3,
            level1_2_count = $4,
            other_disability_count = $5,
            level1_2_parttime_count = $6,
            other_parttime_count = $7,
            total_disability_count = $8,
            employment_rate = $9,
            legal_employment_rate = $10,
            required_count = $11,
            over_under_count = $12,
            status = $13,
            notes = $14,
            updated_at = CURRENT_TIMESTAMP
          WHERE fiscal_year = $15 AND month = $16
          RETURNING *
        `;
        
        const values = [
          employees_count,
          reportData.fulltime_count || 0,
          reportData.parttime_count || 0,
          reportData.level1_2_count || 0,
          reportData.other_disability_count || 0,
          reportData.level1_2_parttime_count || 0,
          reportData.other_parttime_count || 0,
          total_disability_count,
          employment_rate,
          legal_employment_rate,
          required_count,
          over_under_count,
          reportData.status || '確定',
          reportData.notes || '',
          yearNum,
          monthNum
        ];
        
        const result = await db.query(updateQuery, values);
        
        return {
          success: true,
          report: {
            id: result.rows[0].id,
            fiscal_year: yearNum,
            month: monthNum,
            total_employees: employees_count,
            disabled_employees: total_disability_count,
            employment_rate: employment_rate,
            legal_employment_rate: legal_employment_rate,
            status: reportData.status || '確定',
            notes: reportData.notes || '',
            updated_at: result.rows[0].updated_at
          }
        };
      } else {
        // 新規レコードの作成
        const insertQuery = `
          INSERT INTO monthly_reports (
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
            status,
            notes,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING *
        `;
        
        const values = [
          yearNum,
          monthNum,
          employees_count,
          reportData.fulltime_count || 0,
          reportData.parttime_count || 0,
          reportData.level1_2_count || 0,
          reportData.other_disability_count || 0,
          reportData.level1_2_parttime_count || 0,
          reportData.other_parttime_count || 0,
          total_disability_count,
          employment_rate,
          legal_employment_rate,
          required_count,
          over_under_count,
          reportData.status || '確定',
          reportData.notes || ''
        ];
        
        const result = await db.query(insertQuery, values);
        
        return {
          success: true,
          report: {
            id: result.rows[0].id,
            fiscal_year: yearNum,
            month: monthNum,
            total_employees: employees_count,
            disabled_employees: total_disability_count,
            employment_rate: employment_rate,
            legal_employment_rate: legal_employment_rate,
            status: reportData.status || '確定',
            notes: reportData.notes || '',
            created_at: result.rows[0].created_at,
            updated_at: result.rows[0].updated_at
          }
        };
      }
    } catch (error) {
      console.error('月次レポート保存エラー:', error);
      throw error;
    }
  },

  // 全ての月次レポートリストの取得
  getAllMonthlyReports: async () => {
    try {
      const result = await db.query(
        'SELECT * FROM monthly_reports ORDER BY fiscal_year DESC, month DESC'
      );
      
      // データを整形して返却
      const reports = result.rows.map(report => ({
        id: report.id,
        fiscal_year: report.fiscal_year,
        month: report.month,
        total_employees: report.employees_count || 0,
        disabled_employees: report.total_disability_count || 0,
        employment_rate: report.employment_rate || 0,
        legal_employment_rate: report.legal_employment_rate || 2.3,
        status: report.status || '未確定',
        created_at: report.created_at,
        updated_at: report.updated_at
      }));
      
      return reports;
    } catch (error) {
      console.error('月次レポートリスト取得エラー:', error);
      throw error;
    }
  },

  // 年間推移データの取得
  getYearlyTrend: async (year) => {
    try {
      const yearNum = parseInt(year);
      
      const result = await db.query(
        'SELECT * FROM monthly_reports WHERE fiscal_year = $1 ORDER BY month',
        [yearNum]
      );
      
      // 各月のデータを整形
      const months = [];
      
      // 1月から12月までのデータを作成（存在しない月はデフォルト値）
      for (let i = 1; i <= 12; i++) {
        const monthData = result.rows.find(row => row.month === i);
        
        if (monthData) {
          months.push({
            month: i,
            employees_count: monthData.employees_count || 0,
            total_disability_count: monthData.total_disability_count || 0,
            employment_rate: monthData.employment_rate || 0,
            legal_employment_rate: monthData.legal_employment_rate || 2.3,
            status: monthData.status || '未確定'
          });
        } else {
          months.push({
            month: i,
            employees_count: 0,
            total_disability_count: 0,
            employment_rate: 0,
            legal_employment_rate: 2.3,
            status: '未作成'
          });
        }
      }
      
      return {
        year: yearNum,
        months,
        success: true
      };
    } catch (error) {
      console.error('年間推移データ取得エラー:', error);
      throw error;
    }
  },

  // 月次レポートの削除
  deleteMonthlyReport: async (year, month) => {
    try {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      const result = await db.query(
        'DELETE FROM monthly_reports WHERE fiscal_year = $1 AND month = $2 RETURNING *',
        [yearNum, monthNum]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: '指定された月次レポートは存在しません'
        };
      }
      
      return {
        success: true,
        message: '月次レポートを削除しました',
        report: {
          id: result.rows[0].id,
          fiscal_year: result.rows[0].fiscal_year,
          month: result.rows[0].month
        }
      };
    } catch (error) {
      console.error('月次レポート削除エラー:', error);
      throw error;
    }
  },

  // 月次データを計算（従業員情報から）
  calculateMonthReport: async (year, month) => {
    try {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      // 従業員データを取得
      const employeeQuery = `
        SELECT 
          COUNT(*) as total_employees,
          SUM(CASE WHEN disability_type IS NOT NULL THEN count ELSE 0 END) as disabled_employees
        FROM employees
        WHERE 
          (status = '在籍中' OR 
          (resignation_date IS NOT NULL AND 
           (EXTRACT(YEAR FROM resignation_date) > $1 OR 
            (EXTRACT(YEAR FROM resignation_date) = $1 AND EXTRACT(MONTH FROM resignation_date) >= $2))))
          AND fiscal_year = $1
        GROUP BY 1
      `;
      
      const result = await db.query(employeeQuery, [yearNum, monthNum]);
      
      if (result.rows.length === 0) {
        // 従業員データがない場合はデフォルト値を返す
        return {
          fiscal_year: yearNum,
          month: monthNum,
          total_employees: 0,
          disabled_employees: 0,
          employment_rate: 0,
          legal_employment_rate: 2.3,
          status: '未作成'
        };
      }
      
      const data = result.rows[0];
      const total_employees = parseInt(data.total_employees) || 0;
      const disabled_employees = parseFloat(data.disabled_employees) || 0;
      
      // 実雇用率の計算
      const employment_rate = total_employees > 0 
        ? (disabled_employees / total_employees) * 100 
        : 0;
      
      // 法定雇用率（通常は2.3%）
      const legal_employment_rate = 2.3;
      
      return {
        fiscal_year: yearNum,
        month: monthNum,
        total_employees: total_employees,
        disabled_employees: disabled_employees,
        employment_rate: employment_rate,
        legal_employment_rate: legal_employment_rate,
        status: '未作成'
      };
    } catch (error) {
      console.error('月次データ計算エラー:', error);
      throw error;
    }
  }
};

module.exports = monthlyReportModel;