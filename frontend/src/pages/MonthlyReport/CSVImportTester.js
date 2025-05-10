/**
 * CSVImportTester.js - 月次レポートCSVインポートのテストツール
 * 
 * このスクリプトは月次レポートのCSVインポート機能をテストし、
 * データベース状態の検証と問題の自動診断・修復を行います。
 * 
 * 使用方法:
 * 1. node frontend/src/pages/MonthlyReport/CSVImportTester.js [年度]
 * 2. オプション: --repair フラグを追加すると自動修復を実行
 * 
 * 作成: 2025年5月
 */

// 必要なモジュール
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseArgs } = require('util');
const readline = require('readline');

// 設定
const CONFIG = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5001/api',
  outputDir: path.join(__dirname, '../../../logs'),
  testDataDir: path.join(__dirname, '../../../test-data'),
  defaultYear: new Date().getFullYear(),
  timeout: 10000, // 10秒
  months: [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]
};

// コマンドライン引数の解析
const args = parseArgs({
  options: {
    year: {
      type: 'string',
      short: 'y'
    },
    repair: {
      type: 'boolean',
      short: 'r',
      default: false
    },
    verbose: {
      type: 'boolean',
      short: 'v',
      default: false
    },
    endpoint: {
      type: 'string',
      short: 'e',
      default: CONFIG.apiBaseUrl
    }
  }
});

// 引数から年度を取得
const fiscalYear = args.values.year ? parseInt(args.values.year) : CONFIG.defaultYear;
const REPAIR_MODE = args.values.repair;
const VERBOSE = args.values.verbose;
CONFIG.apiBaseUrl = args.values.endpoint;

// コンソール出力の色
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// ログファイルのパス
const logFilePath = path.join(CONFIG.outputDir, `csv_import_test_${fiscalYear}_${Date.now()}.log`);

// 出力ディレクトリの作成
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}
if (!fs.existsSync(CONFIG.testDataDir)) {
  fs.mkdirSync(CONFIG.testDataDir, { recursive: true });
}

// ログストリームの作成
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

/**
 * 整形されたログを出力し、ファイルにも書き込む
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  let prefix = '[INFO]';
  
  switch (level) {
    case 'error':
      color = colors.red;
      prefix = '[ERROR]';
      break;
    case 'warn':
      color = colors.yellow;
      prefix = '[WARN]';
      break;
    case 'success':
      color = colors.green;
      prefix = '[SUCCESS]';
      break;
    case 'debug':
      if (!VERBOSE) return; // デバッグログはverboseモードでのみ表示
      color = colors.cyan;
      prefix = '[DEBUG]';
      break;
  }
  
  const coloredMessage = `${color}${prefix}${colors.reset} ${message}`;
  const logMessage = `${timestamp} ${prefix} ${message}`;
  
  console.log(coloredMessage);
  logStream.write(logMessage + '\n');
}

/**
 * CSVテンプレートを生成する
 */
function generateCSVTemplate(year = fiscalYear) {
  // BOMを追加して文字化けを防止
  let csvContent = '\uFEFF';
  
  // 年度行を追加
  csvContent += `年度,${year}\n`;
  
  // 月の行
  csvContent += '月,4,5,6,7,8,9,10,11,12,1,2,3\n';
  
  // データ行
  const dataRows = [
    ['従業員数 (名)', ...Array(12).fill('100')],
    ['フルタイム従業員数 (名)', ...Array(12).fill('80')],
    ['パートタイム従業員数 (名)', ...Array(12).fill('20')],
    ['1級・2級の障がい者 (名)', ...Array(12).fill('2')],
    ['その他障がい者 (名)', ...Array(12).fill('3')],
    ['1級・2級の障がい者(パートタイム)(名)', ...Array(12).fill('0')],
    ['その他障がい者(パートタイム)(名)', ...Array(12).fill('1')],
    ['法定雇用率 (%)', ...Array(12).fill('2.3')]
  ];
  
  // データ行を追加
  dataRows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}

/**
 * テスト用CSVファイルを保存する
 */
function saveTestCSV(content, filename = `test_import_${fiscalYear}.csv`) {
  const filePath = path.join(CONFIG.testDataDir, filename);
  fs.writeFileSync(filePath, content);
  log(`テスト用CSVファイルを保存しました: ${filePath}`, 'success');
  return filePath;
}

/**
 * シミュレーションモードでCSVデータをAPIフォーマットに変換する
 */
function simulateCSVConversion(csvContent) {
  // 行に分割
  const lines = csvContent.split('\n');
  
  // 年度行を解析
  const yearLine = lines.find(line => line.startsWith('年度,'));
  const year = yearLine ? parseInt(yearLine.split(',')[1]) : fiscalYear;
  
  // 月行を解析
  const monthLine = lines.find(line => line.startsWith('月,'));
  const months = monthLine 
    ? monthLine.split(',').slice(1).map(m => parseInt(m.trim())).filter(m => !isNaN(m))
    : CONFIG.months;
  
  // データを解析するための行マッピング
  const rowMapping = {};
  
  // 行のタイプを特定
  lines.forEach(line => {
    if (line.startsWith('従業員数')) {
      rowMapping['employees_count'] = line.split(',').slice(1);
    } else if (line.startsWith('フルタイム従業員数')) {
      rowMapping['fulltime_count'] = line.split(',').slice(1);
    } else if (line.startsWith('パートタイム従業員数')) {
      rowMapping['parttime_count'] = line.split(',').slice(1);
    } else if (line.startsWith('1級・2級の障がい者') && !line.includes('パートタイム')) {
      rowMapping['level1_2_count'] = line.split(',').slice(1);
    } else if (line.startsWith('その他障がい者') && !line.includes('パートタイム')) {
      rowMapping['other_disability_count'] = line.split(',').slice(1);
    } else if (line.includes('1級・2級') && line.includes('パートタイム')) {
      rowMapping['level1_2_parttime_count'] = line.split(',').slice(1);
    } else if (line.includes('その他') && line.includes('パートタイム')) {
      rowMapping['other_parttime_count'] = line.split(',').slice(1);
    } else if (line.includes('法定雇用率')) {
      rowMapping['legal_employment_rate'] = line.split(',').slice(1);
    }
  });
  
  // APIフォーマットに変換
  const apiData = [];
  
  for (let i = 0; i < months.length; i++) {
    // 値を安全に取得
    const getSafeValue = (key, index) => {
      if (!rowMapping[key] || index >= rowMapping[key].length) return 0;
      const value = rowMapping[key][index];
      if (value === undefined || value === null || value === '') return 0;
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };
    
    // 月データを作成
    const monthData = {
      fiscal_year: year,
      month: months[i],
      employees_count: getSafeValue('employees_count', i),
      fulltime_count: getSafeValue('fulltime_count', i),
      parttime_count: getSafeValue('parttime_count', i),
      level1_2_count: getSafeValue('level1_2_count', i),
      other_disability_count: getSafeValue('other_disability_count', i),
      level1_2_parttime_count: getSafeValue('level1_2_parttime_count', i),
      other_parttime_count: getSafeValue('other_parttime_count', i),
      legal_employment_rate: getSafeValue('legal_employment_rate', i)
    };
    
    // 障がい者合計を計算
    const totalDisability = 
      (monthData.level1_2_count * 2) + 
      monthData.other_disability_count + 
      (monthData.level1_2_parttime_count) + 
      (monthData.other_parttime_count * 0.5);
    
    monthData.total_disability_count = totalDisability;
    
    // 実雇用率を計算
    if (monthData.employees_count > 0) {
      monthData.employment_rate = (totalDisability / monthData.employees_count) * 100;
    } else {
      monthData.employment_rate = 0;
    }
    
    // 法定雇用者数を計算
    if (monthData.employees_count > 0 && monthData.legal_employment_rate > 0) {
      monthData.required_count = Math.ceil(monthData.employees_count * (monthData.legal_employment_rate / 100));
    } else {
      monthData.required_count = 0;
    }
    
    // 超過・未達を計算
    monthData.over_under_count = totalDisability - monthData.required_count;
    
    apiData.push(monthData);
  }
  
  return apiData;
}

/**
 * 月次レポートデータを取得する
 */
async function fetchMonthlyReport(year, month) {
  try {
    // 両方のエンドポイントを試す
    try {
      const response = await axios.get(
        `${CONFIG.apiBaseUrl}/monthly-reports/${year}/${month}`,
        { timeout: CONFIG.timeout }
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // 単数形エンドポイントを試す
        const response = await axios.get(
          `${CONFIG.apiBaseUrl}/monthly-report/${year}/${month}`,
          { timeout: CONFIG.timeout }
        );
        return response.data;
      }
      throw error;
    }
  } catch (error) {
    log(`${year}年度${month}月のデータ取得中にエラーが発生しました: ${error.message}`, 'error');
    return null;
  }
}

/**
 * 月次レポートデータを更新または作成する
 */
async function updateMonthlyReport(data) {
  try {
    if (!data || !data.fiscal_year || !data.month) {
      throw new Error('無効なデータフォーマット');
    }
    
    const { fiscal_year, month } = data;
    
    // 既存データの確認
    const existingData = await fetchMonthlyReport(fiscal_year, month);
    
    if (existingData && existingData.success) {
      // データが存在する場合は更新
      try {
        const response = await axios.put(
          `${CONFIG.apiBaseUrl}/monthly-reports/${fiscal_year}/${month}`,
          data,
          { timeout: CONFIG.timeout }
        );
        log(`${fiscal_year}年度${month}月のデータを更新しました`, 'success');
        return { success: true, action: 'update', data: response.data };
      } catch (error) {
        // 単数形エンドポイントを試す
        if (error.response && error.response.status === 404) {
          const response = await axios.put(
            `${CONFIG.apiBaseUrl}/monthly-report/${fiscal_year}/${month}`,
            data,
            { timeout: CONFIG.timeout }
          );
          log(`${fiscal_year}年度${month}月のデータを更新しました (単数形エンドポイント)`, 'success');
          return { success: true, action: 'update', data: response.data };
        }
        throw error;
      }
    } else {
      // データが存在しない場合は作成
      try {
        // 複数のエンドポイントを試す
        try {
          const response = await axios.post(
            `${CONFIG.apiBaseUrl}/monthly-reports`,
            data,
            { timeout: CONFIG.timeout }
          );
          log(`${fiscal_year}年度${month}月のデータを作成しました`, 'success');
          return { success: true, action: 'create', data: response.data };
        } catch (firstError) {
          // 別のエンドポイントを試す
          try {
            const response = await axios.post(
              `${CONFIG.apiBaseUrl}/monthly-reports/${fiscal_year}/${month}`,
              data,
              { timeout: CONFIG.timeout }
            );
            log(`${fiscal_year}年度${month}月のデータを作成しました (パスパラメータ形式)`, 'success');
            return { success: true, action: 'create', data: response.data };
          } catch (secondError) {
            // 単数形エンドポイントも試す
            const response = await axios.post(
              `${CONFIG.apiBaseUrl}/monthly-report/${fiscal_year}/${month}`,
              data,
              { timeout: CONFIG.timeout }
            );
            log(`${fiscal_year}年度${month}月のデータを作成しました (単数形エンドポイント)`, 'success');
            return { success: true, action: 'create', data: response.data };
          }
        }
      } catch (error) {
        log(`${fiscal_year}年度${month}月のデータ作成中にエラーが発生しました: ${error.message}`, 'error');
        return { success: false, error };
      }
    }
  } catch (error) {
    log(`月次レポート更新中にエラーが発生しました: ${error.message}`, 'error');
    return { success: false, error };
  }
}

/**
 * データベース接続をテストする
 */
async function testDatabaseConnection() {
  try {
    // ヘルスチェックエンドポイントを呼び出す
    const response = await axios.get(`${CONFIG.apiBaseUrl}/health`, { timeout: CONFIG.timeout });
    
    if (response.data && response.data.success) {
      log('データベース接続テスト: 成功', 'success');
      return true;
    } else {
      log('データベース接続テスト: 失敗 (成功レスポンスがない)', 'error');
      return false;
    }
  } catch (error) {
    log(`データベース接続テスト: 失敗 (${error.message})`, 'error');
    return false;
  }
}

/**
 * APIエンドポイントをテストする
 */
async function testAPIEndpoints() {
  const testResults = {
    singular: { get: false, put: false, post: false },
    plural: { get: false, put: false, post: false }
  };
  
  // GETリクエストをテスト
  try {
    await axios.get(`${CONFIG.apiBaseUrl}/monthly-reports/${fiscalYear}/4`, { timeout: CONFIG.timeout });
    testResults.plural.get = true;
    log('GET /monthly-reports/ エンドポイントテスト: 成功', 'success');
  } catch (error) {
    log(`GET /monthly-reports/ エンドポイントテスト: 失敗 (${error.message})`, 'error');
  }
  
  try {
    await axios.get(`${CONFIG.apiBaseUrl}/monthly-report/${fiscalYear}/4`, { timeout: CONFIG.timeout });
    testResults.singular.get = true;
    log('GET /monthly-report/ エンドポイントテスト: 成功', 'success');
  } catch (error) {
    log(`GET /monthly-report/ エンドポイントテスト: 失敗 (${error.message})`, 'error');
  }
  
  // TODO: PUT, POSTテスト（実際のデータ変更が必要なため、オプションで有効化）
  
  return testResults;
}

/**
 * CSVインポートバグの検証と修正
 */
async function verifyAndRepairCSVImport() {
  log('CSVインポートの検証と修正を開始します', 'info');
  
  // 1. データベース接続をテスト
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    log('データベース接続に失敗したため、検証を中止します', 'error');
    return false;
  }
  
  // 2. APIエンドポイントをテスト
  const apiResults = await testAPIEndpoints();
  
  // リクエスト形式の決定（結果に基づいて最適なエンドポイントを選択）
  const endpointPreference = {
    get: apiResults.plural.get ? 'plural' : apiResults.singular.get ? 'singular' : null,
    put: apiResults.plural.put ? 'plural' : apiResults.singular.put ? 'singular' : null,
    post: apiResults.plural.post ? 'plural' : apiResults.singular.post ? 'singular' : null
  };
  
  log(`エンドポイント選択設定: ${JSON.stringify(endpointPreference)}`, 'debug');
  
  if (!endpointPreference.get) {
    log('有効なGETエンドポイントが見つからないため、検証を中止します', 'error');
    return false;
  }
  
  // 3. テスト用CSVファイルを生成
  const csvContent = generateCSVTemplate(fiscalYear);
  const csvPath = saveTestCSV(csvContent);
  
  // 4. CSVデータをAPIフォーマットに変換（シミュレーション）
  const apiData = simulateCSVConversion(csvContent);
  log(`APIフォーマットに変換されたデータ: ${apiData.length}件`, 'info');
  
  // 詳細ログ出力
  if (VERBOSE) {
    log(`変換データの例: ${JSON.stringify(apiData[0], null, 2)}`, 'debug');
  }
  
  // 5. データベース状態を検証
  const verificationResults = {
    totalMonths: apiData.length,
    existingMonths: 0,
    missingMonths: 0,
    invalidMonths: 0,
    details: []
  };
  
  // 各月のデータを検証
  for (const monthData of apiData) {
    const { fiscal_year, month } = monthData;
    const existingData = await fetchMonthlyReport(fiscal_year, month);
    
    if (existingData && existingData.success) {
      verificationResults.existingMonths++;
      
      // データの整合性を確認
      const isValid = validateMonthlyReportData(existingData.data);
      
      if (!isValid) {
        verificationResults.invalidMonths++;
        verificationResults.details.push({
          year: fiscal_year,
          month,
          status: 'invalid',
          data: existingData.data
        });
      } else {
        verificationResults.details.push({
          year: fiscal_year,
          month,
          status: 'valid'
        });
      }
    } else {
      verificationResults.missingMonths++;
      verificationResults.details.push({
        year: fiscal_year,
        month,
        status: 'missing'
      });
    }
  }
  
  // 検証結果をログに出力
  log('データベース状態の検証結果:', 'info');
  log(`- 合計: ${verificationResults.totalMonths}ヶ月`, 'info');
  log(`- 既存: ${verificationResults.existingMonths}ヶ月`, 'info');
  log(`- 不足: ${verificationResults.missingMonths}ヶ月`, 'info');
  log(`- 不正: ${verificationResults.invalidMonths}ヶ月`, 'info');
  
  // 6. 修復モードの場合、問題を修正
  if (REPAIR_MODE) {
    log('修復モードが有効です。問題のあるデータを修復します。', 'info');
    
    const repairResults = {
      attempted: 0,
      succeeded: 0,
      failed: 0,
      details: []
    };
    
    // 検証結果に基づいて修復を実行
    for (const detail of verificationResults.details) {
      if (detail.status === 'missing' || detail.status === 'invalid') {
        repairResults.attempted++;
        
        // 対応するAPIデータを見つける
        const dataToRepair = apiData.find(
          data => data.fiscal_year === detail.year && data.month === detail.month
        );
        
        if (!dataToRepair) {
          repairResults.failed++;
          log(`${detail.year}年度${detail.month}月の修復データが見つかりません`, 'error');
          continue;
        }
        
        // データを更新または作成
        const result = await updateMonthlyReport(dataToRepair);
        
        if (result.success) {
          repairResults.succeeded++;
          repairResults.details.push({
            year: detail.year,
            month: detail.month,
            action: result.action,
            success: true
          });
        } else {
          repairResults.failed++;
          repairResults.details.push({
            year: detail.year,
            month: detail.month,
            action: 'failed',
            success: false,
            error: result.error?.message
          });
        }
      }
    }
    
    // 修復結果をログに出力
    log('データ修復の結果:', 'info');
    log(`- 試行: ${repairResults.attempted}件`, 'info');
    log(`- 成功: ${repairResults.succeeded}件`, 'success');
    log(`- 失敗: ${repairResults.failed}件`, 'info');
    
    // 詳細ログ出力
    if (VERBOSE) {
      repairResults.details.forEach(detail => {
        const status = detail.success ? 'success' : 'error';
        log(`${detail.year}年度${detail.month}月: ${detail.action} (${detail.success ? '成功' : '失敗'})`, status);
      });
    }
    
    // 修復完了後に再検証
    log('修復後のデータベース状態を再検証します...', 'info');
    const reVerificationResults = {
      totalMonths: apiData.length,
      existingMonths: 0,
      missingMonths: 0,
      invalidMonths: 0
    };
    
    // 各月のデータを再検証
    for (const monthData of apiData) {
      const { fiscal_year, month } = monthData;
      const existingData = await fetchMonthlyReport(fiscal_year, month);
      
      if (existingData && existingData.success) {
        reVerificationResults.existingMonths++;
        
        // データの整合性を確認
        const isValid = validateMonthlyReportData(existingData.data);
        
        if (!isValid) {
          reVerificationResults.invalidMonths++;
        }
      } else {
        reVerificationResults.missingMonths++;
      }
    }
    
    // 再検証結果をログに出力
    log('修復後のデータベース状態:', 'info');
    log(`- 合計: ${reVerificationResults.totalMonths}ヶ月`, 'info');
    log(`- 既存: ${reVerificationResults.existingMonths}ヶ月`, 'info');
    log(`- 不足: ${reVerificationResults.missingMonths}ヶ月`, 'info');
    log(`- 不正: ${reVerificationResults.invalidMonths}ヶ月`, 'info');
    
    // 修復成功の判定
    const repairSuccessful = 
      reVerificationResults.existingMonths === reVerificationResults.totalMonths &&
      reVerificationResults.invalidMonths === 0;
    
    if (repairSuccessful) {
      log('すべてのデータが正常に修復されました！', 'success');
    } else {
      log('一部のデータが修復されませんでした。手動での確認が必要です。', 'warn');
    }
    
    return repairSuccessful;
  }
  
  return true;
}

/**
 * 月次レポートデータの妥当性を検証する
 */
function validateMonthlyReportData(data) {
  if (!data) return false;
  
  // 必須フィールドの存在確認
  const requiredFields = [
    'fiscal_year', 'month', 'employees_count', 'fulltime_count', 'parttime_count',
    'level1_2_count', 'other_disability_count', 'level1_2_parttime_count', 'other_parttime_count'
  ];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      log(`データ検証エラー: ${field} フィールドがありません`, 'debug');
      return false;
    }
  }
  
  // 数値フィールドの型確認
  const numericFields = [
    'employees_count', 'fulltime_count', 'parttime_count',
    'level1_2_count', 'other_disability_count', 'level1_2_parttime_count', 'other_parttime_count',
    'total_disability_count', 'employment_rate', 'legal_employment_rate', 'required_count', 'over_under_count'
  ];
  
  for (const field of numericFields) {
    if (data[field] !== undefined && isNaN(parseFloat(data[field]))) {
      log(`データ検証エラー: ${field} が数値ではありません`, 'debug');
      return false;
    }
  }
  
  // 整合性チェック
  if (data.fulltime_count + data.parttime_count !== data.employees_count) {
    log(`データ整合性エラー: fulltime_count + parttime_count != employees_count (${data.fulltime_count} + ${data.parttime_count} != ${data.employees_count})`, 'debug');
    return false;
  }
  
  return true;
}

/**
 * メイン処理
 */
async function main() {
  log(`月次レポートCSVインポートテストを開始します (年度: ${fiscalYear})`, 'info');
  log(`修復モード: ${REPAIR_MODE ? '有効' : '無効'}`, 'info');
  log(`APIエンドポイント: ${CONFIG.apiBaseUrl}`, 'info');
  
  try {
    const successful = await verifyAndRepairCSVImport();
    
    if (successful) {
      log('テストが完了しました。ログファイル: ' + logFilePath, 'success');
    } else {
      log('テスト中にエラーが発生しました。ログファイル: ' + logFilePath, 'error');
      process.exit(1);
    }
  } catch (error) {
    log(`予期しないエラーが発生しました: ${error.message}`, 'error');
    console.error(error);
    log('エラースタック: ' + error.stack, 'error');
    process.exit(1);
  }
}

// プログラム実行
main().catch(error => {
  console.error('プログラム実行中に致命的なエラーが発生しました:', error);
  process.exit(1);
}).finally(() => {
  // ログストリームを閉じる
  logStream.end();
});