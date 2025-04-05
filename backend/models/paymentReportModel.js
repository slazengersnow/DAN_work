// models/paymentReportModel.js

const db = require('../config/db');

const paymentReportModel = {
  // 年度別納付金レポートの取得
  getPaymentReport: async (fiscalYear) => {
    try {
      // レポートデータを取得
      const reportResult = await db.query(
        'SELECT * FROM payment_reports WHERE fiscal_year = $1',
        [fiscalYear]
      );
      
      // 該当年度のレポートが存在しない場合
      if (reportResult.rows.length === 0) {
        return null;
      }
      
      const reportData = reportResult.rows[0];
      
      // 月別データを取得
      const monthlyDataResult = await db.query(`
        SELECT
          month,
          total_employees,
          disabled_employees,
          employment_rate
        FROM
          payment_monthly_data
        WHERE
          payment_report_id = $1
        ORDER BY
          month ASC
      `, [reportData.id]);
      
      return {
        ...reportData,
        monthly_data: monthlyDataResult.rows
      };
    } catch (error) {
      throw error;
    }
  },

  // 納付金レポートの作成または更新
  savePaymentReport: async (fiscalYear, reportData) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 既存のレポートを確認
      const existingReport = await client.query(
        'SELECT * FROM payment_reports WHERE fiscal_year = $1',
        [fiscalYear]
      );
      
      let reportId;
      
      // レポート基本情報の保存または更新
      if (existingReport.rows.length > 0) {
        // 既存レポートの更新
        const updateResult = await client.query(
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
            updated_at = NOW()
           WHERE fiscal_year = $16
           RETURNING id`,
          [
            reportData.company_name,
            reportData.company_address,
            reportData.representative_name,
            reportData.contact_person,
            reportData.phone_number,
            reportData.email,
            reportData.adjustment_amount,
            reportData.average_employee_count,
            reportData.legal_employment_count,
            reportData.actual_employment_count,
            reportData.shortage_count,
            reportData.payment_amount,
            reportData.status || '下書き',
            reportData.submitted_date,
            reportData.notes,
            fiscalYear
          ]
        );
        
        reportId = updateResult.rows[0].id;
        
        // 既存の月別データを削除
        await client.query(
          'DELETE FROM payment_monthly_data WHERE payment_report_id = $1',
          [reportId]
        );
      } else {
        // 新規レポートの作成
        const insertResult = await client.query(
          `INSERT INTO payment_reports (
            fiscal_year, company_name, company_address, representative_name,
            contact_person, phone_number, email, adjustment_amount,
            average_employee_count, legal_employment_count, actual_employment_count,
            shortage_count, payment_amount, status, submitted_date, notes,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()) 
          RETURNING id`,
          [
            fiscalYear,
            reportData.company_name,
            reportData.company_address,
            reportData.representative_name,
            reportData.contact_person,
            reportData.phone_number,
            reportData.email,
            reportData.adjustment_amount,
            reportData.average_employee_count,
            reportData.legal_employment_count,
            reportData.actual_employment_count,
            reportData.shortage_count,
            reportData.payment_amount,
            reportData.status || '下書き',
            reportData.submitted_date,
            reportData.notes
          ]
        );
        
        reportId = insertResult.rows[0].id;
      }
      
      // 月別データの保存
      if (reportData.monthly_data && reportData.monthly_data.length > 0) {
        for (const monthData of reportData.monthly_data) {
          await client.query(
            `INSERT INTO payment_monthly_data (
              payment_report_id, month, total_employees, disabled_employees, employment_rate
            ) VALUES ($1, $2, $3, $4, $5)`,
            [
              reportId,
              monthData.month,
              monthData.total_employees,
              monthData.disabled_employees,
              monthData.employment_rate
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // 更新されたレポートを取得して返す
      return await this.getPaymentReport(fiscalYear);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 納付金レポートの提出
  submitPaymentReport: async (fiscalYear) => {
    try {
      const result = await db.query(
        `UPDATE payment_reports SET
          status = '提出済',
          submitted_date = NOW(),
          updated_at = NOW()
         WHERE fiscal_year = $1
         RETURNING *`,
        [fiscalYear]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return await this.getPaymentReport(fiscalYear);
    } catch (error) {
      throw error;
    }
  },

  // 全ての納付金レポートリスト取得
  getAllPaymentReports: async () => {
    try {
      const result = await db.query(`
        SELECT
          id, fiscal_year, status, submitted_date, payment_amount,
          average_employee_count, actual_employment_count, shortage_count,
          created_at, updated_at
        FROM
          payment_reports
        ORDER BY
          fiscal_year DESC
      `);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // 納付金レポートの削除
  deletePaymentReport: async (fiscalYear) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // レポートIDを取得
      const reportResult = await client.query(
        'SELECT id FROM payment_reports WHERE fiscal_year = $1',
        [fiscalYear]
      );
      
      if (reportResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      const reportId = reportResult.rows[0].id;
      
      // 月別データを削除
      await client.query(
        'DELETE FROM payment_monthly_data WHERE payment_report_id = $1',
        [reportId]
      );
      
      // レポート本体を削除
      const result = await client.query(
        'DELETE FROM payment_reports WHERE id = $1 RETURNING *',
        [reportId]
      );
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 障害者雇用納付金額の計算（シミュレーション用）
  calculatePaymentAmount: async (employeeCount, disabledEmployeeCount) => {
    try {
      // 法定雇用障害者数の計算（小数点以下切り捨て）
      const legalEmploymentRate = 2.3; // 法定雇用率（%）
      const legalEmploymentCount = Math.floor(employeeCount * (legalEmploymentRate / 100));
      
      // 不足数の計算
      let shortageCount = legalEmploymentCount - disabledEmployeeCount;
      shortageCount = shortageCount > 0 ? shortageCount : 0;
      
      // 納付金額の計算（不足1人あたり月額5万円×12ヶ月）
      const monthlyPaymentPerPerson = 50000; // 月額（円）
      const paymentAmount = shortageCount * monthlyPaymentPerPerson * 12;
      
      return {
        average_employee_count: employeeCount,
        legal_employment_count: legalEmploymentCount,
        actual_employment_count: disabledEmployeeCount,
        shortage_count: shortageCount,
        payment_amount: paymentAmount
      };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = paymentReportModel;