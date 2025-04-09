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
      
      res.status(200).json(report);
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
      
      // 必須フィールドのバリデーション
      if (!reportData.company_name) {
        return res.status(400).json({ error: '会社名は必須です' });
      }
      
      const savedReport = await paymentReportModel.savePaymentReport(yearNum, reportData);
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
      res.status(200).json(reports);
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

  // 納付金計算
  calculatePayment: async (req, res) => {
    const { year } = req.params;
    
    try {
      // バリデーション
      if (!year || isNaN(parseInt(year))) {
        return res.status(400).json({ error: '有効な年度を指定してください' });
      }
      
      const yearNum = parseInt(year);
      
      // 月次レポートから年間データを集計して納付金を計算
      const calculationResult = await paymentReportModel.calculatePaymentAmount(yearNum);
      
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
      
      // 会社情報を取得
      const settings = await settingsModel.getSettings();
      
      // 納付金レポートのベースを作成
      const newReport = {
        company_name: settings.company_name,
        company_address: settings.company_address,
        representative_name: settings.representative_name,
        contact_person: settings.contact_person,
        phone_number: settings.phone_number,
        email: settings.email,
        adjustment_amount: 0,
        average_employee_count: 0,
        legal_employment_count: 0,
        actual_employment_count: 0,
        shortage_count: 0,
        payment_amount: 0,
        status: '下書き',
        submitted_date: null,
        notes: `${yearNum}年度 新規作成`,
        monthly_data: []
      };
      
      // 月別データの準備
      // 会計年度の開始月を取得（デフォルトは4月）
      const fiscalYearStartMonth = settings.fiscal_year_start_month || 4;
      
      // 会計年度の各月を準備
      for (let i = 0; i < 12; i++) {
        const month = (fiscalYearStartMonth + i - 1) % 12 + 1;
        const year = month < fiscalYearStartMonth ? yearNum : yearNum - 1;
        
        // この月のデータを追加
        newReport.monthly_data.push({
          month,
          total_employees: 0,
          disabled_employees: 0,
          employment_rate: 0
        });
      }
      
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