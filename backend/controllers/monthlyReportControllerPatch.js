/**
 * 月次レポートコントローラーのパッチ - notes カラム対応
 * このファイルを monthlyReportController.js に適用することで、
 * データベースに notes カラムがなくても正常に動作するようになります
 */

// PostgreSQLデータベース接続
const { pool } = require('../config/db');

// データベースのカラム存在チェック関数
const checkColumnExists = async (tableName, columnName) => {
  try {
    const query = `
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      ) as column_exists;
    `;
    const result = await pool.query(query, [tableName, columnName]);
    return result.rows[0].column_exists;
  } catch (error) {
    console.error(`カラム存在チェックエラー (${tableName}.${columnName}):`, error);
    return false;
  }
};

// -----------------------------------
// 修正対象1: 月次レポート自動生成
// -----------------------------------
exports.generateCurrentMonthReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // バリデーション
    if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
      return res.status(400).json({ success: false, message: '有効な年月を指定してください' });
    }
    
    // 従業員データの取得
    let employeeQuery = `
      SELECT COUNT(*) as total_count,
             SUM(CASE WHEN employment_type = '正社員' THEN 1 ELSE 0 END) as fulltime_count,
             SUM(CASE WHEN employment_type IN ('短時間労働者', '特定短時間労働者') THEN 1 ELSE 0 END) as parttime_count,
             SUM(CASE 
                   WHEN employment_type = '正社員' AND disability_type IS NOT NULL AND 
                        (disability_grade IN ('1級', '2級', 'A') OR 
                         (disability_type = '精神障害' AND disability_grade IN ('3級'))) 
                   THEN 1 ELSE 0 
                 END) as level1_2_count,
             SUM(CASE 
                   WHEN employment_type = '正社員' AND disability_type IS NOT NULL AND 
                        NOT (disability_grade IN ('1級', '2級', 'A') OR 
                             (disability_type = '精神障害' AND disability_grade IN ('3級')))
                   THEN 1 ELSE 0 
                 END) as other_disability_count,
             SUM(CASE 
                   WHEN employment_type IN ('短時間労働者', '特定短時間労働者') AND 
                        disability_type IS NOT NULL AND 
                        (disability_grade IN ('1級', '2級', 'A') OR 
                         (disability_type = '精神障害' AND disability_grade IN ('3級')))
                   THEN 1 ELSE 0 
                 END) as level1_2_parttime_count,
             SUM(CASE 
                   WHEN employment_type IN ('短時間労働者', '特定短時間労働者') AND 
                        disability_type IS NOT NULL AND 
                        NOT (disability_grade IN ('1級', '2級', 'A') OR 
                             (disability_type = '精神障害' AND disability_grade IN ('3級')))
                   THEN 1 ELSE 0 
                 END) as other_parttime_count
      FROM employees
      WHERE status = '在籍'
    `;
    
    if (year) {
      employeeQuery += ` AND fiscal_year = ${parseInt(year)}`;
    }
    
    const employeeResult = await pool.query(employeeQuery);
    const employeeData = employeeResult.rows[0];
    
    const employees_count = parseInt(employeeData.total_count) || 0;
    const fulltime_count = parseInt(employeeData.fulltime_count) || 0;
    const parttime_count = parseInt(employeeData.parttime_count) || 0;
    const level1_2_count = parseInt(employeeData.level1_2_count) || 0;
    const other_disability_count = parseInt(employeeData.other_disability_count) || 0;
    const level1_2_parttime_count = parseInt(employeeData.level1_2_parttime_count) || 0;
    const other_parttime_count = parseInt(employeeData.other_parttime_count) || 0;
    
    // 合計障害者カウント数の計算
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
    
    // notes カラムの存在チェック
    const hasNotesColumn = await checkColumnExists('monthly_reports', 'notes');
    
    // レポートデータの作成（notes カラム対応）
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
      status: '確定'
    };
    
    // notes カラムが存在する場合のみ追加
    if (hasNotesColumn) {
      reportData.notes = `${year}年${month}月の自動生成レポート`;
    }
    
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

// -----------------------------------
// 修正対象2: 月次レポート保存・更新
// -----------------------------------
exports.saveMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    let reportData = req.body;
    
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
    
    // notes カラムの存在チェック
    const hasNotesColumn = await checkColumnExists('monthly_reports', 'notes');
    
    // notes カラムが存在しない場合は、データから削除
    if (!hasNotesColumn && 'notes' in reportData) {
      delete reportData.notes;
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

// ----------------------------------------------
// 修正対象3: 新規月次レポート作成
// ----------------------------------------------
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
      legal_employment_rate,
      notes
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
    
    // notes カラムの存在チェック
    const hasNotesColumn = await checkColumnExists('monthly_reports', 'notes');
    
    // データのコピーを作成し、notes カラムがない場合は削除
    let requestData = { ...req.body };
    if (!hasNotesColumn && 'notes' in requestData) {
      delete requestData.notes;
    }
    
    if (checkResult.rows.length > 0) {
      // 既存の場合は更新
      const updateFields = Object.keys(requestData)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');
      const updateValues = [fiscal_year, parseInt(month), ...Object.values(requestData)];
      
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
    
    // notes カラムが存在する場合のみ追加
    if (hasNotesColumn && notes) {
      insertData.notes = notes;
    }
    
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
    console.error('月次レポートの作成中にエラーが発生しました:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
};