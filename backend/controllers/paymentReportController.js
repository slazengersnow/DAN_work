// controllers/paymentReportController.js

const paymentReportModel = require('../models/paymentReportModel');
const settingsModel = require('../models/settingsModel');

const paymentReportController = {
  // 納付金レポートの取得
  getPaymentReport: async (req, res) => {
    const { fiscalYear } = req.params;
    
    try {
      // バリデーション
      if (!fiscalYear || isNaN(parseInt(fiscalYear))) {
        return res.status(400).json({ error: '有効な年度を指定してください' });
      }
      
      const yearNum = parseInt(fiscalYear);
      const report = await paymentReportModel.getPaymentReport(yearNum);
      
      if (!report) {
        return res.status(404).json({ error: '指定された年度の納付金レポートが見つかりません' });
      }
      
      // company_dataとmonthly_dataがJSONB型ではなく、JSONオブジェクトを格納するために必要なフィールドを追加
      const enhancedReport = {
        ...report,
        total_employees: report.average_employee_count || 0,
        disabled_employees: report.actual_employment_count || 0,
        employment_rate: report.average_employee_count && report.actual_employment_count 
          ? (report.actual_employment_count / report.average_employee_count * 100) 
          : 0
      };
      
      res.status(200).json(enhancedReport);
    } catch (error) {
      console.error('納付金レポートの取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '納付金レポートの取得に失敗しました' });
    }
  },

  // 納付金レポートの保存
  savePaymentReport: async (req, res) => {
    const { fiscalYear } = req.params;
    const reportData = req.body;
    
    try {
      // バリデーション
      if (!fiscalYear || isNaN(parseInt(fiscalYear))) {
        return res.status(400).json({ error: '有効な年度を指定してください' });
      }
      
      const yearNum = parseInt(fiscalYear);
      
      // マッピングロジックを追加して、フロントエンドからのデータを適切に変換
      let transformedData = { ...reportData };
      
      // company_dataがJSONオブジェクトまたは文字列の場合の処理
      if (reportData.company_data) {
        // 既にJSONオブジェクトの場合はそのまま使用
        if (typeof reportData.company_data === 'string') {
          try {
            const parsedData = JSON.parse(reportData.company_data);
            // company_data内のフィールドを抽出して直接フィールドに割り当て
            if (parsedData.companyName) transformedData.company_name = parsedData.companyName;
            if (parsedData.address) transformedData.company_address = parsedData.address;
            if (parsedData.representativeName) transformedData.representative_name = parsedData.representativeName;
          } catch (e) {
            console.error('company_dataのパースに失敗しました:', e);
          }
        } else if (typeof reportData.company_data === 'object') {
          // オブジェクトの場合は直接フィールドを抽出
          if (reportData.company_data.companyName) transformedData.company_name = reportData.company_data.companyName;
          if (reportData.company_data.address) transformedData.company_address = reportData.company_data.address;
          if (reportData.company_data.representativeName) transformedData.representative_name = reportData.company_data.representativeName;
        }
      }
      
      // monthly_dataからの平均値計算（必要に応じて）
      if (reportData.monthly_data) {
        let monthlyData;
        
        try {
          monthlyData = typeof reportData.monthly_data === 'string' 
            ? JSON.parse(reportData.monthly_data) 
            : reportData.monthly_data;
          
          if (monthlyData.totalRegularEmployees) {
            const totalEmployees = Object.values(monthlyData.totalRegularEmployees).reduce((sum, val) => sum + val, 0);
            transformedData.average_employee_count = Math.round(totalEmployees / 12 * 10) / 10;
          }
          
          if (monthlyData.disabledEmployees) {
            const totalDisabled = Object.values(monthlyData.disabledEmployees).reduce((sum, val) => sum + val, 0);
            transformedData.actual_employment_count = Math.round(totalDisabled / 12 * 10) / 10;
          }
          
          // 雇用率と不足数の計算
          if (transformedData.average_employee_count && transformedData.actual_employment_count) {
            const legalRate = reportData.legal_employment_rate || 2.3;
            const legalCount = Math.floor(transformedData.average_employee_count * legalRate / 100);
            transformedData.legal_employment_count = legalCount;
            transformedData.shortage_count = Math.max(0, legalCount - transformedData.actual_employment_count);
            
            // 納付金額の計算（不足1人あたり月額5万円×12ヶ月）
            transformedData.payment_amount = transformedData.shortage_count * 50000 * 12;
          }
        } catch (e) {
          console.error('monthly_dataのパースに失敗しました:', e);
        }
      }
      
      console.log('変換後のデータ:', transformedData);
      
      const savedReport = await paymentReportModel.savePaymentReport(yearNum, transformedData);
      res.status(200).json(savedReport);
    } catch (error) {
      console.error('納付金レポートの保存中にエラーが発生しました:', error);
      res.status(500).json({ error: '納付金レポートの保存に失敗しました' });
    }
  },

  // 納付金レポートの提出
  submitPaymentReport: async (req, res) => {
    const { fiscalYear } = req.params;
    
    try {
      // バリデーション
      if (!fiscalYear || isNaN(parseInt(fiscalYear))) {
        return res.status(400).json({ error: '有効な年度を指定してください' });
      }
      
      const yearNum = parseInt(fiscalYear);
      const submittedReport = await paymentReportModel.submitPaymentReport(yearNum);
      
      if (!submittedReport) {
        return res.status(404).json({ error: '指定された年度の納付金レポートが見つかりません' });
      }
      
      res.status(200).json(submittedReport);
    } catch (error) {
      console.error('納付金レポートの提出中にエラーが発生しました:', error);
      res.status(500).json({ error: '納付金レポートの提出に失敗しました' });
    }
  },

  // 全ての納付金レポートリストの取得
  getAllPaymentReports: async (req, res) => {
    try {
      const reports = await paymentReportModel.getAllPaymentReports();
      
      // フロントエンド用にフィールド名を調整
      const enhancedReports = reports.map(report => ({
        ...report,
        year: report.fiscal_year,
        total_employees: report.average_employee_count || 0,
        disabled_employees: report.actual_employment_count || 0,
        employment_rate: report.average_employee_count && report.actual_employment_count 
          ? (report.actual_employment_count / report.average_employee_count * 100) 
          : 0
      }));
      
      res.status(200).json(enhancedReports);
    } catch (error) {
      console.error('納付金レポートリストの取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '納付金レポートリストの取得に失敗しました' });
    }
  },

  // 納付金レポートの削除
  deletePaymentReport: async (req, res) => {
    const { fiscalYear } = req.params;
    
    try {
      // バリデーション
      if (!fiscalYear || isNaN(parseInt(fiscalYear))) {
        return res.status(400).json({ error: '有効な年度を指定してください' });
      }
      
      const yearNum = parseInt(fiscalYear);
      const deletedReport = await paymentReportModel.deletePaymentReport(yearNum);
      
      if (!deletedReport) {
        return res.status(404).json({ error: '指定された年度の納付金レポートが見つかりません' });
      }
      
      res.status(200).json({ message: '納付金レポートを削除しました', report: deletedReport });
    } catch (error) {
      console.error('納付金レポートの削除中にエラーが発生しました:', error);
      res.status(500).json({ error: '納付金レポートの削除に失敗しました' });
    }
  },

  // 納付金額計算（シミュレーション）
  calculatePaymentAmount: async (req, res) => {
    const { employeeCount, disabledEmployeeCount } = req.body;
    
    try {
      // バリデーション
      if (employeeCount === undefined || disabledEmployeeCount === undefined) {
        return res.status(400).json({ error: '従業員数と障害者数は必須です' });
      }
      
      if (isNaN(parseInt(employeeCount)) || isNaN(parseInt(disabledEmployeeCount))) {
        return res.status(400).json({ error: '従業員数と障害者数は数値である必要があります' });
      }
      
      const calculation = await paymentReportModel.calculatePaymentAmount(
        parseInt(employeeCount),
        parseInt(disabledEmployeeCount)
      );
      
      res.status(200).json(calculation);
    } catch (error) {
      console.error('納付金額計算中にエラーが発生しました:', error);
      res.status(500).json({ error: '納付金額の計算に失敗しました' });
    }
  },

  // 納付金計算（特定年度）
  calculatePayment: async (req, res) => {
    const { year } = req.params;
    
    try {
      // バリデーション
      if (!year || isNaN(parseInt(year))) {
        return res.status(400).json({ error: '有効な年度を指定してください' });
      }
      
      const yearNum = parseInt(year);
      
      // 計算結果を取得
      const calculationResult = await paymentReportModel.calculatePayment(yearNum);
      
      res.status(200).json(calculationResult);
    } catch (error) {
      console.error('納付金計算中にエラーが発生しました:', error);
      res.status(500).json({ error: '納付金計算に失敗しました' });
    }
  },

  // 納付金レポートを確定
  confirmPaymentReport: async (req, res) => {
    const { year } = req.params;
    
    try {
      // バリデーション
      if (!year || isNaN(parseInt(year))) {
        return res.status(400).json({ error: '有効な年度を指定してください' });
      }
      
      const yearNum = parseInt(year);
      const confirmedReport = await paymentReportModel.confirmPaymentReport(yearNum);
      
      if (!confirmedReport) {
        return res.status(404).json({ error: '指定された納付金レポートが見つかりません' });
      }
      
      res.status(200).json({ 
        message: '納付金レポートを確定しました', 
        report: confirmedReport 
      });
    } catch (error) {
      console.error('納付金レポート確定中にエラーが発生しました:', error);
      res.status(500).json({ error: '納付金レポート確定に失敗しました' });
    }
  },

  // 新規納付金レポートの作成（会社情報を自動入力）
  createNewPaymentReport: async (req, res) => {
    const { fiscalYear } = req.params;
    
    try {
      // バリデーション
      if (!fiscalYear || isNaN(parseInt(fiscalYear))) {
        return res.status(400).json({ error: '有効な年度を指定してください' });
      }
      
      const yearNum = parseInt(fiscalYear);
      
      // 既存のレポートがあるか確認
      const existingReport = await paymentReportModel.getPaymentReport(yearNum);
      
      if (existingReport) {
        return res.status(400).json({ error: 'この年度の納付金レポートは既に存在します' });
      }
      
      // 会社情報を取得 (本番環境では実際の settingsModel を使用)
      const settings = {
        company_name: '株式会社サンプル',
        company_address: '東京都千代田区千代田1-1-1',
        representative_name: '山田太郎',
        contact_person: '佐藤次郎',
        phone_number: '03-1234-5678',
        email: 'info@example.com',
        fiscal_year_start_month: 4
      };
      
      // 納付金レポートのベースを作成
      const newReport = {
        company_name: settings.company_name,
        company_address: settings.company_address,
        representative_name: settings.representative_name,
        contact_person: settings.contact_person,
        phone_number: settings.phone_number,
        email: settings.email,
        adjustment_amount: 0,
        average_employee_count: 520, // サンプルデータ
        legal_employment_count: 12,  // サンプルデータ
        actual_employment_count: 15, // サンプルデータ
        shortage_count: 0,
        payment_amount: 0,
        status: '作成中',
        submitted_date: null,
        notes: `${yearNum}年度 新規作成`
      };
      
      // レポートを保存
      const savedReport = await paymentReportModel.savePaymentReport(yearNum, newReport);
      res.status(201).json(savedReport);
    } catch (error) {
      console.error('納付金レポートの新規作成中にエラーが発生しました:', error);
      res.status(500).json({ error: '納付金レポートの新規作成に失敗しました' });
    }
  }
};

module.exports = paymentReportController;