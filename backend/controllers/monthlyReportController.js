// controllers/monthlyReportController.js

const monthlyReportModel = require('../models/monthlyReportModel');

const monthlyReportController = {
  // 月次レポートの取得
  getMonthlyReport: async (req, res) => {
    const { year, month } = req.params;
    
    try {
      // バリデーション
      if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
        return res.status(400).json({ error: '有効な年月を指定してください' });
      }
      
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: '月は1から12の間で指定してください' });
      }
      
      const report = await monthlyReportModel.getMonthlyReport(yearNum, monthNum);
      res.status(200).json(report);
    } catch (error) {
      console.error('月次レポートの取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '月次レポートの取得に失敗しました' });
    }
  },

  // 月次レポートの保存
  saveMonthlyReport: async (req, res) => {
    const { year, month } = req.params;
    const reportData = req.body;
    
    try {
      // バリデーション
      if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
        return res.status(400).json({ error: '有効な年月を指定してください' });
      }
      
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: '月は1から12の間で指定してください' });
      }
      
      // 必須フィールドのバリデーション
      if (reportData.total_employees === undefined || reportData.disabled_employees === undefined) {
        return res.status(400).json({ error: '全従業員数と障害者数は必須です' });
      }
      
      // 常に確定状態にするよう修正
      const updatedReportData = {
        ...reportData,
        status: '確定'  // statusを常に「確定」に設定
      };
      
      const savedReport = await monthlyReportModel.saveMonthlyReport(yearNum, monthNum, updatedReportData);
      res.status(200).json(savedReport);
    } catch (error) {
      console.error('月次レポートの保存中にエラーが発生しました:', error);
      res.status(500).json({ error: '月次レポートの保存に失敗しました' });
    }
  },

  // 全ての月次レポートリストの取得
  getAllMonthlyReports: async (req, res) => {
    try {
      const reports = await monthlyReportModel.getAllMonthlyReports();
      res.status(200).json(reports);
    } catch (error) {
      console.error('月次レポートリストの取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '月次レポートリストの取得に失敗しました' });
    }
  },

  // 年間推移データの取得
  getYearlyTrend: async (req, res) => {
    const { year } = req.params;
    
    try {
      // バリデーション
      if (!year || isNaN(parseInt(year))) {
        return res.status(400).json({ error: '有効な年を指定してください' });
      }
      
      const yearNum = parseInt(year);
      const trendData = await monthlyReportModel.getYearlyTrend(yearNum);
      res.status(200).json(trendData);
    } catch (error) {
      console.error('年間推移データの取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '年間推移データの取得に失敗しました' });
    }
  },

  // 月次レポートの削除
  deleteMonthlyReport: async (req, res) => {
    const { year, month } = req.params;
    
    try {
      // バリデーション
      if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
        return res.status(400).json({ error: '有効な年月を指定してください' });
      }
      
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: '月は1から12の間で指定してください' });
      }
      
      const deletedReport = await monthlyReportModel.deleteMonthlyReport(yearNum, monthNum);
      
      if (!deletedReport) {
        return res.status(404).json({ error: '指定された月次レポートが見つかりません' });
      }
      
      res.status(200).json({ message: '月次レポートを削除しました', report: deletedReport });
    } catch (error) {
      console.error('月次レポートの削除中にエラーが発生しました:', error);
      res.status(500).json({ error: '月次レポートの削除に失敗しました' });
    }
  },
  
  // 現在の月次データを自動生成（実際の従業員データから）
  generateCurrentMonthReport: async (req, res) => {
    try {
      // 現在の年月を取得
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JavaScriptの月は0から始まるため+1
      
      // レポートを生成（従業員データから集計）
      const report = await monthlyReportModel.getMonthlyReport(year, month);
      
      // レポートを保存（常に確定状態で保存）
      const savedReport = await monthlyReportModel.saveMonthlyReport(year, month, {
        total_employees: report.report.total_employees,
        disabled_employees: report.report.disabled_employees,
        employment_rate: report.report.employment_rate,
        notes: `${year}年${month}月の自動生成レポート`,
        status: '確定'  // 自動生成レポートも常に確定状態に
      });
      
      res.status(200).json(savedReport);
    } catch (error) {
      console.error('月次レポートの自動生成中にエラーが発生しました:', error);
      res.status(500).json({ error: '月次レポートの自動生成に失敗しました' });
    }
  }
};

module.exports = monthlyReportController;