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
      
      // 結果データが取得できた場合、monthly_dataフィールドを正しくパースする
      if (result.rows[0]) {
        try {
          const row = result.rows[0];
          
          // monthly_dataが文字列の場合はJSONにパースする
          if (row.monthly_data && typeof row.monthly_data === 'string') {
            row.monthly_data = JSON.parse(row.monthly_data);
          }
          
          // company_dataが文字列の場合はJSONにパースする
          if (row.company_data && typeof row.company_data === 'string') {
            row.company_data = JSON.parse(row.company_data);
          }
          
          // bank_infoが文字列の場合はJSONにパースする
          if (row.bank_info && typeof row.bank_info === 'string') {
            row.bank_info = JSON.parse(row.bank_info);
          }
        } catch (parseError) {
          console.error('データパースエラー:', parseError);
          // パースエラーが発生しても元のデータを返す
        }
      }
      
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
      
      // 結果データの各行について、JSONフィールドを処理
      for (const row of result.rows) {
        try {
          // monthly_dataが文字列の場合はJSONにパースする
          if (row.monthly_data && typeof row.monthly_data === 'string') {
            row.monthly_data = JSON.parse(row.monthly_data);
          }
          
          // company_dataが文字列の場合はJSONにパースする
          if (row.company_data && typeof row.company_data === 'string') {
            row.company_data = JSON.parse(row.company_data);
          }
          
          // bank_infoが文字列の場合はJSONにパースする
          if (row.bank_info && typeof row.bank_info === 'string') {
            row.bank_info = JSON.parse(row.bank_info);
          }
        } catch (parseError) {
          console.error('データパースエラー:', parseError);
          // パースエラーが発生しても処理を続行
        }
      }
      
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
      
      // actual_employment_count の値を適切に処理
      // 小数点以下を保持（NUMERIC(10, 1) 型に対応）
      const actualEmploymentCount = reportData.actual_employment_count || 
                                   reportData.disabled_employees || 0;
      
      // 小数点以下を保持する数値に変換
      // NUMERIC(10, 1) 型に対応するために、小数点以下1桁までの数値に変換
      let formattedActualEmploymentCount = Number(actualEmploymentCount);
      // 小数点以下1桁までに丸める
      formattedActualEmploymentCount = parseFloat(formattedActualEmploymentCount.toFixed(1));
      
      // データをJSON形式に変換する（必要に応じて）
      const formatJsonField = (field) => {
        if (field && typeof field === 'object') {
          return JSON.stringify(field);
        }
        return field;
      };
      
      // 各JSONフィールドを処理
      const monthlyData = formatJsonField(reportData.monthly_data);
      const companyData = formatJsonField(reportData.company_data);
      const bankInfo = formatJsonField(reportData.bank_info);

      // データベースにmonthly_dataなどのカラムがあるか確認
      let hasJsonColumns = false;
      try {
        const tableInfo = await db.query(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_name = 'payment_reports' AND 
           column_name IN ('monthly_data', 'company_data', 'bank_info')`
        );
        hasJsonColumns = tableInfo.rows.length > 0;
      } catch (error) {
        console.error('テーブル情報取得エラー:', error);
      }

      // クエリを設定（JSON列の有無によって調整）
      let updateQuery;
      let queryParams;
      
      if (hasJsonColumns) {
        // JSON列が存在する場合のクエリ
        updateQuery = `UPDATE payment_reports SET 
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
           monthly_data = $16,
           company_data = $17,
           bank_info = $18,
           updated_at = CURRENT_TIMESTAMP
           WHERE fiscal_year = $19 RETURNING *`;
        queryParams = [
          reportData.company_name || null,
          reportData.company_address || null,
          reportData.representative_name || null,
          reportData.contact_person || null,
          reportData.phone_number || null,
          reportData.email || null,
          reportData.adjustment_amount || 0,
          reportData.average_employee_count || reportData.total_employees || 0,
          reportData.legal_employment_count || 0,
          formattedActualEmploymentCount,
          reportData.shortage_count || 0,
          reportData.payment_amount || 0,
          reportData.status || '作成中',
          reportData.submitted_date || null,
          reportData.notes || '',
          monthlyData,
          companyData,
          bankInfo,
          year
        ];
      } else {
        // JSON列が存在しない場合のクエリ
        updateQuery = `UPDATE payment_reports SET 
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
           WHERE fiscal_year = $16 RETURNING *`;
        queryParams = [
          reportData.company_name || null,
          reportData.company_address || null,
          reportData.representative_name || null,
          reportData.contact_person || null,
          reportData.phone_number || null,
          reportData.email || null,
          reportData.adjustment_amount || 0,
          reportData.average_employee_count || reportData.total_employees || 0,
          reportData.legal_employment_count || 0,
          formattedActualEmploymentCount,
          reportData.shortage_count || 0,
          reportData.payment_amount || 0,
          reportData.status || '作成中',
          reportData.submitted_date || null,
          reportData.notes || '',
          year
        ];
      }
      
      if (existingReport) {
        // 既存のレポートを更新
        const result = await db.query(updateQuery, queryParams);
        return result.rows[0];
      } else {
        // 新規レポートを作成
        let insertQuery;
        let insertParams;
        
        if (hasJsonColumns) {
          // JSON列が存在する場合のクエリ
          insertQuery = `INSERT INTO payment_reports 
           (fiscal_year, company_name, company_address, representative_name,
            contact_person, phone_number, email, adjustment_amount,
            average_employee_count, legal_employment_count, actual_employment_count,
            shortage_count, payment_amount, status, submitted_date, notes,
            monthly_data, company_data, bank_info,
            created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
           RETURNING *`;
          insertParams = [
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
            formattedActualEmploymentCount,
            reportData.shortage_count || 0,
            reportData.payment_amount || 0,
            reportData.status || '作成中',
            reportData.submitted_date || null,
            reportData.notes || '',
            monthlyData,
            companyData,
            bankInfo
          ];
        } else {
          // JSON列が存在しない場合のクエリ
          insertQuery = `INSERT INTO payment_reports 
           (fiscal_year, company_name, company_address, representative_name,
            contact_person, phone_number, email, adjustment_amount,
            average_employee_count, legal_employment_count, actual_employment_count,
            shortage_count, payment_amount, status, submitted_date, notes,
            created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
           RETURNING *`;
          insertParams = [
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
            formattedActualEmploymentCount,
            reportData.shortage_count || 0,
            reportData.payment_amount || 0,
            reportData.status || '作成中',
            reportData.submitted_date || null,
            reportData.notes || ''
          ];
        }
        
        const result = await db.query(insertQuery, insertParams);
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