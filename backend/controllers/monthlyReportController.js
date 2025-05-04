// controllers/monthlyReportController.js

// PostgreSQLデータベース接続
const { pool } = require('../config/db');

// 月次レポート一覧を取得
exports.getMonthlyReports = async (req, res) => {
  try {
    // PostgreSQLでのクエリ
    const query = `
      SELECT * FROM monthly_reports
      ORDER BY fiscal_year DESC, month DESC
    `;
    const result = await pool.query(query);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('月次レポート一覧取得エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};

// 特定の年月の月次レポートを取得（従業員データを含める）
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
    
    // 月次レポートの取得
    const reportQuery = `
      SELECT * FROM monthly_reports
      WHERE fiscal_year = $1 AND month = $2
    `;
    const reportResult = await pool.query(reportQuery, [yearNum, monthNum]);
    const report = reportResult.rows[0];
    
    // 従業員データを取得 - fiscal_yearとmonthで直接フィルタリング
    let employees = [];
    
    try {
      const employeeQuery = `
        SELECT * FROM employee_monthly_status
        WHERE fiscal_year = $1 AND month = $2
        ORDER BY employee_id
      `;
      const employeeResult = await pool.query(employeeQuery, [yearNum, monthNum]);
      employees = employeeResult.rows || [];
      
      // データがない場合は代わりに従業員テーブルから取得
      if (employees.length === 0) {
        const fallbackQuery = `
          SELECT 
            id, 
            employee_id, 
            name, 
            NULL as disability_type, 
            NULL as disability, 
            NULL as grade, 
            hire_date, 
            status, 
            NULL as monthly_status, 
            notes as memo, 
            count 
          FROM employees 
          WHERE fiscal_year = $1 OR fiscal_year IS NULL
          ORDER BY employee_id
        `;
        
        const fallbackResult = await pool.query(fallbackQuery, [yearNum]);
        employees = fallbackResult.rows;
      }
      
      // 月次ステータスのJSONを配列に変換
      employees = employees.map(emp => {
        if (emp.monthly_status && typeof emp.monthly_status === 'string') {
          try {
            emp.monthlyStatus = JSON.parse(emp.monthly_status);
          } catch (e) {
            emp.monthlyStatus = Array(12).fill(1);
          }
        } else {
          emp.monthlyStatus = Array(12).fill(1);
        }
        return emp;
      });
    } catch (empError) {
      console.error('従業員データ取得エラー:', empError);
      // エラーが発生した場合でも処理を続行
      console.log('エラーが発生しましたが、処理を継続します。空の従業員リストを使用します。');
    }
    
    if (!report) {
      // レポートが見つからない場合は新しいレポートを作成
      try {
        const newReportQuery = `
          INSERT INTO monthly_reports (
            fiscal_year, month, employees_count, fulltime_count, parttime_count,
            level1_2_count, other_disability_count, level1_2_parttime_count,
            other_parttime_count, legal_employment_rate, status
          )
          VALUES ($1, $2, 0, 0, 0, 0, 0, 0, 0, 2.3, '未確定')
          RETURNING *
        `;
        const newReportResult = await pool.query(newReportQuery, [yearNum, monthNum]);
        const newReport = newReportResult.rows[0];
        
        return res.json({ 
          success: true, 
          data: {
            summary: newReport,
            employees: employees, // 既存の従業員データを使用
            detail: null
          }
        });
      } catch (createError) {
        console.error('新規レポート作成エラー:', createError);
        return res.status(404).json({ 
          success: false, 
          message: '指定された月次レポートが見つかりません' 
        });
      }
    }
    
    // 成功レスポンス
    res.json({ 
      success: true, 
      data: {
        summary: report,
        employees: employees,
        detail: null
      }
    });
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
    const checkQuery = `
      SELECT * FROM monthly_reports 
      WHERE fiscal_year = $1 AND month = $2
    `;
    const checkResult = await pool.query(checkQuery, [yearNum, monthNum]);
    
    let report;
    
    if (checkResult.rows.length > 0) {
      // 既存レポートを更新
      const updateFields = Object.keys(updatedReportData)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');
      const updateValues = [yearNum, monthNum, ...Object.values(updatedReportData)];
      
      const updateQuery = `
        UPDATE monthly_reports
        SET ${updateFields}
        WHERE fiscal_year = $1 AND month = $2
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, updateValues);
      report = updateResult.rows[0];
    } else {
      // 新規レポート作成
      const columns = ['fiscal_year', 'month', ...Object.keys(updatedReportData)].join(', ');
      const placeholders = Array.from({ length: Object.keys(updatedReportData).length + 2 }, (_, i) => `$${i + 1}`).join(', ');
      const insertValues = [yearNum, monthNum, ...Object.values(updatedReportData)];
      
      const insertQuery = `
        INSERT INTO monthly_reports (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, insertValues);
      report = insertResult.rows[0];
    }
    
    res.json({
      success: true,
      message: checkResult.rows.length > 0 ? '月次レポートが更新されました' : '月次レポートが作成されました',
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
    const query = `
      SELECT * FROM monthly_reports
      ORDER BY fiscal_year DESC, month DESC
    `;
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
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
    
    // 年間データ取得
    const query = `
      SELECT * FROM monthly_reports
      WHERE fiscal_year = $1
      ORDER BY month ASC
    `;
    const result = await pool.query(query, [yearNum]);
    const reports = result.rows;
    
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
    
    // PostgreSQL用のクエリ
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
    
    // 従業員データを取得 - fiscal_yearでフィルタリング
    const employeeQuery = `
      SELECT * FROM employees
      WHERE fiscal_year = $1 AND status = '在籍'
    `;
    const employeeResult = await pool.query(employeeQuery, [year]);
    const employeeData = employeeResult.rows;
    
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
      if (!employee.disability_type || employee.status !== '在籍') return;
      
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
    const checkQuery = `
      SELECT * FROM monthly_reports 
      WHERE fiscal_year = $1 AND month = $2
    `;
    const checkResult = await pool.query(checkQuery, [year, month]);
    
    let report;
    
    const reportData = {
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
    };
    
    if (checkResult.rows.length > 0) {
      // 既存レポートを更新
      const updateFields = Object.keys(reportData)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');
      const updateValues = [year, month, ...Object.values(reportData)];
      
      const updateQuery = `
        UPDATE monthly_reports
        SET ${updateFields}
        WHERE fiscal_year = $1 AND month = $2
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, updateValues);
      report = updateResult.rows[0];
    } else {
      // 新規レポート作成
      const columns = ['fiscal_year', 'month', ...Object.keys(reportData)].join(', ');
      const placeholders = Array.from({ length: Object.keys(reportData).length + 2 }, (_, i) => `$${i + 1}`).join(', ');
      const insertValues = [year, month, ...Object.values(reportData)];
      
      const insertQuery = `
        INSERT INTO monthly_reports (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, insertValues);
      report = insertResult.rows[0];
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
    const checkQuery = `
      SELECT * FROM monthly_reports 
      WHERE fiscal_year = $1 AND month = $2
    `;
    const checkResult = await pool.query(checkQuery, [fiscal_year, parseInt(month)]);
    
    if (checkResult.rows.length > 0) {
      // 既存の場合は更新
      const updateFields = Object.keys(req.body)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');
      const updateValues = [fiscal_year, parseInt(month), ...Object.values(req.body)];
      
      const updateQuery = `
        UPDATE monthly_reports
        SET ${updateFields}
        WHERE fiscal_year = $1 AND month = $2
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, updateValues);
      
      return res.json({
        success: true,
        message: '既存の月次レポートを更新しました',
        data: updateResult.rows[0]
      });
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
    const insertData = {
      fiscal_year,
      month: parseInt(month),
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
    };
    
    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(insertData);
    
    const insertQuery = `
      INSERT INTO monthly_reports (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, values);
    
    res.status(201).json({ 
      success: true, 
      message: '月次レポートを作成しました',
      data: insertResult.rows[0]
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
    const checkQuery = `
      SELECT * FROM monthly_reports 
      WHERE fiscal_year = $1 AND month = $2
    `;
    const checkResult = await pool.query(checkQuery, [parseInt(year), parseInt(month)]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '指定された月次レポートが見つかりません'
      });
    }
    
    // 更新フィールドの準備
    const updateFields = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');
    const updateValues = [parseInt(year), parseInt(month), ...Object.values(updateData)];
    
    const updateQuery = `
      UPDATE monthly_reports
      SET ${updateFields}
      WHERE fiscal_year = $1 AND month = $2
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, updateValues);
    
    res.json({
      success: true,
      message: '月次レポートが更新されました',
      data: updateResult.rows[0]
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
    const checkQuery = `
      SELECT * FROM monthly_reports 
      WHERE fiscal_year = $1 AND month = $2
    `;
    const checkResult = await pool.query(checkQuery, [parseInt(year), parseInt(month)]);
    
    if (checkResult.rows.length === 0) {
      // レポートが存在しない場合は新規作成
      const insertData = {
        fiscal_year: parseInt(year),
        month: parseInt(month),
        ...updateData,
        status: '未確定'
      };
      
      const columns = Object.keys(insertData).join(', ');
      const placeholders = Object.keys(insertData).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(insertData);
      
      const insertQuery = `
        INSERT INTO monthly_reports (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, values);
      
      return res.json({
        success: true,
        message: '月次レポートを新規作成しました',
        data: insertResult.rows[0]
      });
    }
    
    const report = checkResult.rows[0];
    
    // 計算項目の処理
    const employees_count = updateData.employees_count || report.employees_count;
    const level1_2_count = updateData.level1_2_count || report.level1_2_count;
    const other_disability_count = updateData.other_disability_count || report.other_disability_count;
    const level1_2_parttime_count = updateData.level1_2_parttime_count || report.level1_2_parttime_count;
    const other_parttime_count = updateData.other_parttime_count || report.other_parttime_count;
    const legal_employment_rate = updateData.legal_employment_rate || report.legal_employment_rate;
    
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
    
    // 更新フィールドの準備
    const updateFields = Object.keys(updatedSummary)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');
    const updateValues = [parseInt(year), parseInt(month), ...Object.values(updatedSummary)];
    
    const updateQuery = `
      UPDATE monthly_reports
      SET ${updateFields}
      WHERE fiscal_year = $1 AND month = $2
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, updateValues);
    
    res.json({
      success: true,
      message: '月次レポートサマリーが更新されました',
      data: updateResult.rows[0]
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
    const checkQuery = `
      SELECT * FROM monthly_reports 
      WHERE fiscal_year = $1 AND month = $2
    `;
    const checkResult = await pool.query(checkQuery, [parseInt(year), parseInt(month)]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '指定された月次レポートが見つかりません'
      });
    }
    
    // レポートを確定状態に更新
    const updateQuery = `
      UPDATE monthly_reports
      SET status = '確定'
      WHERE fiscal_year = $1 AND month = $2
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [parseInt(year), parseInt(month)]);
    
    res.json({
      success: true,
      message: '月次レポートが確定されました',
      data: updateResult.rows[0]
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
    
    // 従業員の存在確認
    const employeeQuery = `
      SELECT * FROM employees
      WHERE id = $1 AND fiscal_year = $2
    `;
    const employeeResult = await pool.query(employeeQuery, [id, parseInt(year)]);
    
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '指定された従業員が見つかりません'
      });
    }
    
    // 更新フィールドの準備
    const updateFields = Object.keys(updateData)
      .map((key, index) => `${key} = ${index + 2}`)
      .join(', ');
    const updateValues = [id, ...Object.values(updateData)];
    
    const updateQuery = `
      UPDATE employees
      SET ${updateFields}
      WHERE id = $1
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, updateValues);
    
    // 月次レポートの取得
    const reportQuery = `
      SELECT * FROM monthly_reports
      WHERE fiscal_year = $1 AND month = $2
    `;
    const reportResult = await pool.query(reportQuery, [parseInt(year), parseInt(month)]);
    
    res.json({
      success: true,
      message: '従業員詳細が更新されました',
      data: {
        report: reportResult.rows[0] || null,
        employee: updateResult.rows[0]
      }
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
    
    console.log('従業員詳細作成リクエスト:', { year, month, body: employeeData });
    
    // 必須フィールドの検証
    if (!employeeData.name) {
      return res.status(400).json({
        success: false,
        message: '従業員名は必須です'
      });
    }
    
    if (!employeeData.employee_id) {
      return res.status(400).json({
        success: false,
        message: '社員IDは必須です'
      });
    }
    
    // 従業員IDの重複チェック
    const checkQuery = `
      SELECT * FROM employees
      WHERE employee_id = $1 AND fiscal_year = $2
    `;
    const checkResult = await pool.query(checkQuery, [employeeData.employee_id, parseInt(year)]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: '指定された社員IDは既に登録されています'
      });
    }
    
    // 月次ステータスの処理
    const monthlyStatus = Array.isArray(employeeData.monthlyStatus) 
      ? JSON.stringify(employeeData.monthlyStatus) 
      : JSON.stringify(Array(12).fill(''));
    
    // 新規従業員データの作成
    const insertData = {
      ...employeeData,
      monthly_status: monthlyStatus,
      fiscal_year: parseInt(year)
    };
    
    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map((_, i) => `${i + 1}`).join(', ');
    const values = Object.values(insertData);
    
    const insertQuery = `
      INSERT INTO employees (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, values);
    
    res.status(201).json({
      success: true,
      message: '従業員データを作成しました',
      data: insertResult.rows[0]
    });
  } catch (error) {
    console.error('従業員詳細作成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 従業員詳細を削除
exports.deleteEmployeeDetail = async (req, res) => {
  try {
    const { year, month, id } = req.params;
    
    // 従業員の存在確認
    const employeeQuery = `
      SELECT * FROM employees
      WHERE id = $1 AND fiscal_year = $2
    `;
    const employeeResult = await pool.query(employeeQuery, [id, parseInt(year)]);
    
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '指定された従業員データが見つかりません'
      });
    }
    
    // 従業員データの削除
    const deleteQuery = `
      DELETE FROM employees
      WHERE id = $1
      RETURNING *
    `;
    await pool.query(deleteQuery, [id]);
    
    res.json({
      success: true,
      message: '従業員データが削除されました'
    });
  } catch (error) {
    console.error('従業員データ削除エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
};

// CSVインポート
exports.importEmployeesFromCSV = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // ファイルのチェック
    if (!req.files || !req.files.csv) {
      return res.status(400).json({
        success: false,
        message: 'CSVファイルがアップロードされていません'
      });
    }
    
    const csvFile = req.files.csv;
    
    // CSVパース処理（例示的なコード）
    const csvData = csvFile.data.toString('utf8');
    const parsedData = csvData.split('\n').slice(1).map(line => {
      const values = line.split(',');
      return {
        employee_id: values[0],
        name: values[1],
        disability_type: values[2] || '',
        disability: values[3] || '',
        grade: values[4] || '',
        hire_date: values[5] || new Date().toISOString().split('T')[0],
        status: values[6] || '在籍',
        fiscal_year: parseInt(year)
      };
    }).filter(item => item.employee_id && item.name); // 空行をフィルタリング
    
    // 従業員データの一括登録
    let createdCount = 0;
    for (const employeeData of parsedData) {
      try {
        const columns = Object.keys(employeeData).join(', ');
        const placeholders = Object.keys(employeeData).map((_, i) => `${i + 1}`).join(', ');
        const values = Object.values(employeeData);
        
        const insertQuery = `
          INSERT INTO employees (${columns})
          VALUES (${placeholders})
          ON CONFLICT (employee_id, fiscal_year) DO NOTHING
        `;
        
        const result = await pool.query(insertQuery, values);
        if (result.rowCount > 0) {
          createdCount++;
        }
      } catch (err) {
        console.error('CSV行の処理エラー:', err);
        // エラーがあっても続行
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${createdCount}件の従業員データをインポートしました`,
      data: { imported_count: createdCount }
    });
  } catch (error) {
    console.error('CSVインポートエラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
};

// システム設定を取得
exports.getSettings = async (req, res) => {
  try {
    // システム設定の取得
    const settingsQuery = `
      SELECT * FROM company_settings
      LIMIT 1
    `;
    
    const settingsResult = await pool.query(settingsQuery);
    
    let settings;
    
    if (settingsResult.rows.length > 0) {
      settings = settingsResult.rows[0];
    } else {
      // デフォルト設定
      settings = {
        company: {
          name: '株式会社サンプル',
          address: '東京都千代田区1-1-1',
          phone: '03-1234-5678'
        },
        reporting: {
          legal_employment_rate: 2.3,
          fiscal_year_start_month: 4
        },
        ui: {
          theme: 'light',
          language: 'ja'
        }
      };
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('設定取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
};