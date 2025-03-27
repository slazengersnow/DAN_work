// backend/controllers/monthlyReportController.js
const MonthlyReport = require('../models/MonthlyReport');

exports.getMonthlyData = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false, 
        message: '年と月を指定してください' 
      });
    }
    
    const data = await MonthlyReport.getMonthlyData(
      parseInt(year), 
      parseInt(month)
    );
    
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '月次データの取得中にエラーが発生しました' 
    });
  }
};

exports.getEmployeesByMonth = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false, 
        message: '年と月を指定してください' 
      });
    }
    
    const employees = await MonthlyReport.getEmployeesByMonth(
      parseInt(year), 
      parseInt(month)
    );
    
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '月次従業員データの取得中にエラーが発生しました' 
    });
  }
};

exports.getYearlyData = async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ 
        success: false, 
        message: '年を指定してください' 
      });
    }
    
    const data = await MonthlyReport.getYearlyData(parseInt(year));
    
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '年間データの取得中にエラーが発生しました' 
    });
  }
};

exports.confirmMonthlyData = async (req, res) => {
  try {
    const { year, month } = req.body;
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false, 
        message: '年と月を指定してください' 
      });
    }
    
    const data = await MonthlyReport.confirmMonthlyData(
      parseInt(year), 
      parseInt(month)
    );
    
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '月次データの確定中にエラーが発生しました' 
    });
  }
};