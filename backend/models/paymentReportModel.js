// models/paymentReportModel.js

const db = require('../config/db');
const pool = db.pool;  // プールへの直接アクセスを追加

const paymentReportModel = {
  // 納付金レポートの取得
  getPaymentReport: async (year) => {
    try {
      const result = await db.query(
        'SELECT * FROM payment_reports WHERE fiscal_year = $1',
        [year]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('納付金レポート取得エラー:', error);
      throw error;
    }
  },

  // 全ての納付金レポートリストの取得
  getAllPaymentReports: async () => {
    try {
      const result = await db.query(
        'SELECT * FROM payment_reports ORDER BY fiscal_year DESC'
      );
      
      return result.rows;
    } catch (error) {
      console.error('納付金レポートリスト取得エラー:', error);
      throw error;
    }
  },

  // 納付金レポートの保存
  savePaymentReport: async (year, reportData) => {
    try {
      // 既存のレポートがあるか確認
      const existingReport = await paymentReportModel.getPaymentReport(year);
      
      if (existingReport) {
        // 既存のレポートを更新
        const result = await db.query(
          `UPDATE payment_reports SET 
           company_name = $1,
           company_address = $2,
           representative_name = $3,
           contact_person = $4,
           phone_number = $5,
           email = $6,
           adjustment_amount = $7,
           average_employee_count = $8,
           legal_employment_count = $9,
           actual_employment_count = $10,
           shortage_count = $11,
           payment_amount = $12,
           status = $13,
           submitted_date = $14,
           notes = $15,
           updated_at = CURRENT_TIMESTAMP
           WHERE fiscal_year = $16 RETURNING *`,
          [
            reportData.company_name || null,
            reportData.company_address || null,
            reportData.representative_name || null,
            reportData.contact_person || null,
            reportData.phone_number || null,
            reportData.email || null,
            reportData.adjustment_amount || 0,
            reportData.average_employee_count || reportData.total_employees || 0,
            reportData.legal_employment_count || 0,
            reportData.actual_employment_count || reportData.disabled_employees || 0,
            reportData.shortage_count || 0,
            reportData.payment_amount || 0,
            reportData.status || '作成中',
            reportData.submitted_date || null,
            reportData.notes || '',
            year
          ]
        );
        
        return result.rows[0];
      } else {
        // 新規レポートを作成
        const result = await db.query(
          `INSERT INTO payment_reports 
           (fiscal_year, company_name, company_address, representative_name,
            contact_person, phone_number, email, adjustment_amount,
            average_employee_count, legal_employment_count, actual_employment_count,
            shortage_count, payment_amount, status, submitted_date, notes,
            created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
           RETURNING *`,
          [
            year,
            reportData.company_name || null,
            reportData.company_address || null,
            reportData.representative_name || null,
            reportData.contact_person || null,
            reportData.phone_number || null,
            reportData.email || null,
            reportData.adjustment_amount || 0,
            reportData.average_employee_count || reportData.total_employees || 0,
            reportData.legal_employment_count || 0,
            reportData.actual_employment_count || reportData.disabled_employees || 0,
            reportData.shortage_count || 0,
            reportData.payment_amount || 0,
            reportData.status || '作成中',
            reportData.submitted_date || null,
            reportData.notes || ''
          ]
        );
        
        return result.rows[0];
      }
    } catch (error) {
      console.error('納付金レポート保存エラー:', error);
      throw error;
    }
  },

  // 納付金レポートの提出
  submitPaymentReport: async (year) => {
    try {
      const result = await db.query(
        `UPDATE payment_reports SET 
         status = '提出済み',
         submitted_date = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
         WHERE fiscal_year = $1 RETURNING *`,
        [year]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('納付金レポート提出エラー:', error);
      throw error;
    }
  },

  // 納付金レポートの削除
  deletePaymentReport: async (year) => {
    try {
      const result = await db.query(
        'DELETE FROM payment_reports WHERE fiscal_year = $1 RETURNING *',
        [year]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('納付金レポート削除エラー:', error);
      throw error;
    }
  },

  // 納付金レポートを確定
  confirmPaymentReport: async (year) => {
    try {
      const result = await db.query(
        `UPDATE payment_reports SET 
         status = '確定済み',
         updated_at = CURRENT_TIMESTAMP
         WHERE fiscal_year = $1 RETURNING *`,
        [year]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('納付金レポート確定エラー:', error);
      throw error;
    }
  },

  // 納付金額計算（シミュレーション用）
  calculatePaymentAmount: async (employeeCount, disabledEmployeeCount) => {
    try {
      // 法定雇用率（通常は2.3%）
      const legalRate = 2.3;
      
      // 法定雇用障害者数の計算（小数点以下切り捨て）
      const legalEmploymentCount = Math.floor(employeeCount * (legalRate / 100));
      
      // 不足数の計算
      let shortageCount = Math.max(0, legalEmploymentCount - disabledEmployeeCount);
      
      // 納付金額の計算（1人あたり月額5万円×12ヶ月）
      const paymentAmount = shortageCount * 50000 * 12;
      
      return {
        employeeCount,
        disabledEmployeeCount,
        legalRate,
        legalEmploymentCount,
        shortageCount,
        paymentAmount
      };
    } catch (error) {
      console.error('納付金計算エラー:', error);
      throw error;
    }
  },

  // 納付金額の計算（特定年度）
  calculatePayment: async (year) => {
    try {
      // 実際のデータを取得して計算（テスト中はダミーデータを返す）
      return {
        year: parseInt(year),
        avg_total_employees: 520,
        avg_disabled_employees: 15,
        actual_employment_rate: 2.88,
        legal_employment_rate: 2.3,
        legal_employment_count: 11.96,
        shortage_count: 0,
        payment_unit: 50000,
        payment_amount: 0
      };
    } catch (error) {
      console.error('納付金計算エラー:', error);
      throw error;
    }
  }
};

module.exports = paymentReportModel;