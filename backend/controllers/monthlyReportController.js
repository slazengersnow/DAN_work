// backend/controllers/monthlyReportController.js
const { pool } = require('../config/db');
const MonthlyReport = require('../models/MonthlyReport');

// 月次レポート一覧を取得
exports.getMonthlyReports = async (req, res) => {
  try {
    // MongooseのsortメソッドからPostgreSQL向けのfind()に変更
    const reportsObj = await MonthlyReport.find();
    const reports = reportsObj.sort({ fiscal_year: -1, month: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('月次レポート一覧取得エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};

// 特定の年月の月次レポートを取得
exports.getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    console.log(`リクエストパラメータ:`, { year, month });
    
    // バリデーション
    if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
      return res.status(400).json({ success: false, message: '有効な年月を指定してください' });
    }
    
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ success: false, message: '月は1から12の間で指定してください' });
    }
    
    // 条件付きfindOneメソッドを使用
    const report = await MonthlyReport.findOne({ 
      fiscal_year: yearNum, 
      month: monthNum 
    });
    
    if (!report) {
      return res.status(404).json({ success: false, message: '指定された月次レポートが見つかりません' });
    }
    
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('月次レポートの取得中にエラーが発生しました:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};

// 月次レポートを保存・更新
exports.saveMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    const reportData = req.body;
    
    // バリデーション
    if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
      return res.status(400).json({ success: false, message: '有効な年月を指定してください' });
    }
    
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ success: false, message: '月は1から12の間で指定してください' });
    }
    
    // 必須フィールドのバリデーション
    if (reportData.employees_count === undefined) {
      return res.status(400).json({ success: false, message: '全従業員数は必須です' });
    }
    
    // 常に確定状態にするよう修正
    const updatedReportData = {
      ...reportData,
      status: '確定'  // statusを常に「確定」に設定
    };
    
    // 既存レポートの確認
    const existingReport = await MonthlyReport.findOne({
      fiscal_year: yearNum,
      month: monthNum
    });
    
    let report;
    
    if (existingReport) {
      // 既存レポートを更新
      report = await MonthlyReport.findOneAndUpdate(
        { fiscal_year: yearNum, month: monthNum },
        updatedReportData,
        { new: true }
      );
    } else {
      // 新規レポート作成
      report = await MonthlyReport.create({
        fiscal_year: yearNum,
        month: monthNum,
        ...updatedReportData
      });
    }
    
    res.json({
      success: true,
      message: existingReport ? '月次レポートが更新されました' : '月次レポートが作成されました',
      data: report
    });
  } catch (error) {
    console.error('月次レポートの保存中にエラーが発生しました:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};

// 全ての月次レポートリストの取得
exports.getAllMonthlyReports = async (req, res) => {
  try {
    // 拡張されたfindメソッドを使用
    const reportsObj = await MonthlyReport.find();
    const reports = reportsObj.sort({ fiscal_year: -1, month: -1 });
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('月次レポートリストの取得中にエラーが発生しました:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};

// 年間推移データの取得
exports.getYearlyTrend = async (req, res) => {
  try {
    const { year } = req.params;
    
    // バリデーション
    if (!year || isNaN(parseInt(year))) {
      return res.status(400).json({ success: false, message: '有効な年を指定してください' });
    }
    
    const yearNum = parseInt(year);
    
    // 年間データ取得 - 条件付きのfindを使用
    const reportsObj = await MonthlyReport.find({ fiscal_year: yearNum });
    const reports = reportsObj.sort({ month: 1 });
    
    // 1〜12ヶ月分のデータを作成
    const trendData = {
      year: yearNum,
      months: [],
      success: true
    };
    
    for (let i = 1; i <= 12; i++) {
      const monthReport = reports.find(r => r.month === i);
      
      if (monthReport) {
        trendData.months.push({
          month: i,
          employees_count: monthReport.employees_count,
          total_disability_count: monthReport.total_disability_count,
          employment_rate: monthReport.employment_rate,
          legal_employment_rate: monthReport.legal_employment_rate,
          status: monthReport.status
        });
      } else {
        // データがない場合は空のオブジェクト
        trendData.months.push({
          month: i,
          employees_count: 0,
          total_disability_count: 0,
          employment_rate: 0,
          legal_employment_rate: 2.3,
          status: '未作成'
        });
      }
    }
    
    res.json(trendData);
  } catch (error) {
    console.error('年間推移データの取得中にエラーが発生しました:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};

// 月次レポートの削除
exports.deleteMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // バリデーション
    if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
      return res.status(400).json({ success: false, message: '有効な年月を指定してください' });
    }
    
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ success: false, message: '月は1から12の間で指定してください' });
    }
    
    // PostgreSQL用のクエリに変更
    const query = `
      DELETE FROM monthly_reports 
      WHERE fiscal_year = $1 AND month = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [yearNum, monthNum]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '指定された月次レポートが見つかりません' });
    }
    
    const deletedReport = result.rows[0];
    
    res.json({
      success: true,
      message: '月次レポートを削除しました',
      data: deletedReport
    });
  } catch (error) {
    console.error('月次レポートの削除中にエラーが発生しました:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};

// 現在の月次データを自動生成
exports.generateCurrentMonthReport = async (req, res) => {
  try {
    // 現在の年月を取得
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScriptの月は0から始まるため+1
    
    // 従業員データを取得して計算
    const employeeData = await MonthlyReport.getEmployeesByMonth(year, month);
    
    // 合計値の計算
    const employees_count = employeeData.length;
    const fulltime_count = employeeData.filter(e => e.employment_type === '正社員').length;
    const parttime_count = employeeData.filter(e => e.employment_type !== '正社員').length;
    
    // 障害者カウント
    let level1_2_count = 0;
    let other_disability_count = 0;
    let level1_2_parttime_count = 0;
    let other_parttime_count = 0;
    
    employeeData.forEach(employee => {
      if (!employee.disability_type || employee.status !== '在籍中') return;
      
      const isLevel1or2 = employee.grade === '1級' || employee.grade === '2級';
      const isFulltime = employee.employment_type === '正社員';
      
      if (isLevel1or2) {
        if (isFulltime) level1_2_count++;
        else level1_2_parttime_count++;
      } else {
        if (isFulltime) other_disability_count++;
        else other_parttime_count++;
      }
    });
    
    // 障害者数の計算
    const totalDisabilityCount = 
      (level1_2_count * 2) + 
      other_disability_count + 
      level1_2_parttime_count + 
      (other_parttime_count * 0.5);
    
    // 法定雇用率（デフォルト値）
    const legal_employment_rate = 2.3;
    
    // 実雇用率の計算
    const employment_rate = employees_count > 0 
      ? (totalDisabilityCount / employees_count) * 100
      : 0;
    
    // 法定雇用数の計算
    const required_count = Math.ceil((employees_count * legal_employment_rate) / 100);
    
    // 過不足数の計算
    const over_under_count = totalDisabilityCount - required_count;
    
    // 既存レポートの確認
    const existingReport = await MonthlyReport.findOne({
      fiscal_year: year,
      month: month
    });
    
    let report;
    
    if (existingReport) {
      // 既存レポートを更新
      report = await MonthlyReport.findOneAndUpdate(
        { fiscal_year: year, month: month },
        {
          employees_count,
          fulltime_count,
          parttime_count,
          level1_2_count,
          other_disability_count,
          level1_2_parttime_count,
          other_parttime_count,
          total_disability_count: totalDisabilityCount,
          employment_rate,
          legal_employment_rate,
          required_count,
          over_under_count,
          status: '確定',
          notes: `${year}年${month}月の自動生成レポート`
        },
        { new: true }
      );
    } else {
      // 新規レポート作成
      report = await MonthlyReport.create({
        fiscal_year: year,
        month: month,
        employees_count,
        fulltime_count,
        parttime_count,
        level1_2_count,
        other_disability_count,
        level1_2_parttime_count,
        other_parttime_count,
        total_disability_count: totalDisabilityCount,
        employment_rate,
        legal_employment_rate,
        required_count,
        over_under_count,
        status: '確定',
        notes: `${year}年${month}月の自動生成レポート`
      });
    }
    
    res.json({
      success: true,
      message: '月次レポートを自動生成しました',
      data: report
    });
  } catch (error) {
    console.error('月次レポートの自動生成中にエラーが発生しました:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};

// 新規月次レポートを作成
exports.createMonthlyReport = async (req, res) => {
  try {
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
      legal_employment_rate 
    } = req.body;
    
    // 必須フィールドの検証
    if (!fiscal_year || !month) {
      return res.status(400).json({ success: false, message: '年度と月は必須です' });
    }
    
    // 既存レポートの確認
    const existingReport = await MonthlyReport.findOne({ 
      fiscal_year: fiscal_year, 
      month: Number(month) 
    });
    
    if (existingReport) {
      return res.status(400).json({ success: false, message: '指定された年月のレポートは既に存在します' });
    }
    
    // 計算項目の処理
    const totalDisabilityCount = 
      (level1_2_count || 0) * 2 + 
      (other_disability_count || 0) + 
      (level1_2_parttime_count || 0) + 
      (other_parttime_count || 0) * 0.5;
    
    const employmentRate = employees_count > 0 
      ? (totalDisabilityCount / employees_count) * 100 
      : 0;
    
    const requiredCount = Math.floor((employees_count * (legal_employment_rate || 2.3)) / 100);
    const overUnderCount = totalDisabilityCount - requiredCount;
    
    // 新規レポート作成
    const newReport = await MonthlyReport.create({
      fiscal_year,
      month: Number(month),
      employees_count: employees_count || 0,
      fulltime_count: fulltime_count || 0,
      parttime_count: parttime_count || 0,
      level1_2_count: level1_2_count || 0,
      other_disability_count: other_disability_count || 0,
      level1_2_parttime_count: level1_2_parttime_count || 0,
      other_parttime_count: other_parttime_count || 0,
      total_disability_count: totalDisabilityCount,
      employment_rate: employmentRate,
      legal_employment_rate: legal_employment_rate || 2.3,
      required_count: requiredCount,
      over_under_count: overUnderCount,
      status: '未確定'
    });
    
    res.status(201).json({ 
      success: true, 
      message: '月次レポートを作成しました',
      data: newReport 
    });
  } catch (error) {
    console.error('月次レポート作成エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};

// 月次レポートを更新
exports.updateMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    const updateData = req.body;
    
    // 既存レポートの確認
    const existingReport = await MonthlyReport.findOne({
      fiscal_year: parseInt(year),
      month: parseInt(month)
    });
    
    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: '指定された月次レポートが見つかりません'
      });
    }
    
    // レポートの更新
    const updatedReport = await MonthlyReport.findOneAndUpdate(
      { fiscal_year: parseInt(year), month: parseInt(month) },
      updateData,
      { new: true }
    );
    
    res.json({
      success: true,
      message: '月次レポートが更新されました',
      data: updatedReport
    });
  } catch (error) {
    console.error('月次レポート更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
};

// 月次レポートサマリーを更新
exports.updateMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.params;
    const updateData = req.body;
    
    // 既存のレポートを確認
    const existingReport = await MonthlyReport.findOne({
      fiscal_year: parseInt(year),
      month: parseInt(month)
    });
    
    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: '指定された月次レポートが見つかりません'
      });
    }
    
    // 計算項目の処理
    const employees_count = updateData.employees_count || existingReport.employees_count;
    const level1_2_count = updateData.level1_2_count || existingReport.level1_2_count;
    const other_disability_count = updateData.other_disability_count || existingReport.other_disability_count;
    const level1_2_parttime_count = updateData.level1_2_parttime_count || existingReport.level1_2_parttime_count;
    const other_parttime_count = updateData.other_parttime_count || existingReport.other_parttime_count;
    const legal_employment_rate = updateData.legal_employment_rate || existingReport.legal_employment_rate;
    
    const totalDisabilityCount = 
      (level1_2_count || 0) * 2 + 
      (other_disability_count || 0) + 
      (level1_2_parttime_count || 0) + 
      (other_parttime_count || 0) * 0.5;
    
    const employmentRate = employees_count > 0 
      ? (totalDisabilityCount / employees_count) * 100 
      : 0;
    
    const requiredCount = Math.floor((employees_count * legal_employment_rate) / 100);
    const overUnderCount = totalDisabilityCount - requiredCount;
    
    // 更新データに計算項目を追加
    const updatedSummary = {
      ...updateData,
      total_disability_count: totalDisabilityCount,
      employment_rate: employmentRate,
      required_count: requiredCount,
      over_under_count: overUnderCount
    };
    
    // レポートを更新
    const updatedReport = await MonthlyReport.findOneAndUpdate(
      { fiscal_year: parseInt(year), month: parseInt(month) },
      updatedSummary,
      { new: true }
    );
    
    res.json({
      success: true,
      message: '月次レポートサマリーが更新されました',
      data: updatedReport
    });
  } catch (error) {
    console.error('月次レポートサマリー更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
};

// 月次レポートを確定
exports.confirmMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // 既存のレポートを確認
    const existingReport = await MonthlyReport.findOne({
      fiscal_year: parseInt(year),
      month: parseInt(month)
    });
    
    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: '指定された月次レポートが見つかりません'
      });
    }
    
    // レポートを確定状態に更新
    const confirmedReport = await MonthlyReport.findOneAndUpdate(
      { fiscal_year: parseInt(year), month: parseInt(month) },
      { status: '確定' },
      { new: true }
    );
    
    res.json({
      success: true,
      message: '月次レポートが確定されました',
      data: confirmedReport
    });
  } catch (error) {
    console.error('月次レポート確定エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
};

// 従業員詳細を更新
exports.updateEmployeeDetail = async (req, res) => {
  try {
    const { year, month, id } = req.params;
    const updateData = req.body;
    
    // パラメータをPostgreSQLに合わせて処理
    await MonthlyReport.updateEmployeeDetail(
      parseInt(year),
      parseInt(month),
      id,
      updateData
    );
    
    // 更新後のレポートを取得
    const updatedReport = await MonthlyReport.findOne({
      fiscal_year: parseInt(year),
      month: parseInt(month)
    });
    
    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: '指定された月次レポートが見つかりません'
      });
    }
    
    res.json({
      success: true,
      message: '従業員詳細が更新されました',
      data: updatedReport
    });
  } catch (error) {
    console.error('従業員詳細更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
};

// 従業員詳細を新規作成
exports.createEmployeeDetail = async (req, res) => {
  try {
    const { year, month } = req.params;
    const employeeData = req.body;
    
    // 必須フィールドの検証
    if (!employeeData.employee_id) {
      return res.status(400).json({
        success: false,
        message: '従業員IDは必須です'
      });
    }
    
    // パラメータをPostgreSQLに合わせて処理
    const createdDetail = await MonthlyReport.createEmployeeDetail(
      parseInt(year),
      parseInt(month),
      employeeData
    );
    
    // 更新後のレポートを取得
    const updatedReport = await MonthlyReport.findOne({
      fiscal_year: parseInt(year),
      month: parseInt(month)
    });
    
    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: '指定された月次レポートが見つかりません'
      });
    }
    
    res.status(201).json({
      success: true,
      message: '従業員詳細が作成されました',
      data: updatedReport
    });
  } catch (error) {
    console.error('従業員詳細作成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
};