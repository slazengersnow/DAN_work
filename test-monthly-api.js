/**
 * 月次レポートAPI接続テストスクリプト
 * 
 * このスクリプトは月次レポートAPIのエンドポイントをテストし、
 * singular形式('/api/monthly-report/')とplural形式('/api/monthly-reports/')の
 * 両方が正しく動作することを確認します。
 */

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

// テスト設定
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_YEAR = new Date().getFullYear();
const TEST_MONTH = new Date().getMonth() + 1;

// データベース接続設定
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'disability_system',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// テスト結果の記録
const testResults = {
  database: { success: false, message: '' },
  notesColumn: { exists: false, message: '' },
  endpoints: {
    singular: { get: false, put: false },
    plural: { get: false, put: false }
  }
};

/**
 * データベース接続テスト
 */
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ データベース接続: 成功');
    testResults.database = { success: true, message: '接続成功' };
    
    // notesカラムの存在確認
    const notesCheckQuery = `
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'monthly_reports' AND column_name = 'notes'
      ) as column_exists;
    `;
    const result = await client.query(notesCheckQuery);
    const notesExists = result.rows[0].column_exists;
    
    if (notesExists) {
      console.log('✅ notesカラム確認: 存在します');
      testResults.notesColumn = { exists: true, message: '存在します' };
    } else {
      console.log('❌ notesカラム確認: 存在しません');
      testResults.notesColumn = { exists: false, message: '存在しません' };
    }
    
    client.release();
  } catch (error) {
    console.error('❌ データベース接続: 失敗', error.message);
    testResults.database = { success: false, message: error.message };
  }
}

/**
 * 月次レポートAPIのGETリクエストテスト
 * @param {string} endpoint - テストするエンドポイント ('monthly-report' または 'monthly-reports')
 */
async function testGetMonthlyReport(endpoint) {
  const url = `${API_BASE_URL}/${endpoint}/${TEST_YEAR}/${TEST_MONTH}`;
  
  try {
    const response = await axios.get(url);
    console.log(`✅ GET ${endpoint}: 成功 (ステータス: ${response.status})`);
    
    if (endpoint === 'monthly-report') {
      testResults.endpoints.singular.get = true;
    } else {
      testResults.endpoints.plural.get = true;
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ GET ${endpoint}: 失敗`, error.response?.status || error.message);
    
    if (endpoint === 'monthly-report') {
      testResults.endpoints.singular.get = false;
    } else {
      testResults.endpoints.plural.get = false;
    }
    
    return null;
  }
}

/**
 * 月次レポートAPIのPUTリクエストテスト
 * @param {string} endpoint - テストするエンドポイント ('monthly-report' または 'monthly-reports')
 * @param {object} data - 更新するデータ
 */
async function testPutMonthlyReport(endpoint, data) {
  if (!data) {
    console.log(`⚠️ PUT ${endpoint}: テストデータがないためスキップします`);
    return;
  }
  
  const url = `${API_BASE_URL}/${endpoint}/${TEST_YEAR}/${TEST_MONTH}`;
  const testData = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  try {
    const response = await axios.put(url, testData);
    console.log(`✅ PUT ${endpoint}: 成功 (ステータス: ${response.status})`);
    
    if (endpoint === 'monthly-report') {
      testResults.endpoints.singular.put = true;
    } else {
      testResults.endpoints.plural.put = true;
    }
  } catch (error) {
    console.error(`❌ PUT ${endpoint}: 失敗`, error.response?.status || error.message);
    
    if (endpoint === 'monthly-report') {
      testResults.endpoints.singular.put = false;
    } else {
      testResults.endpoints.plural.put = false;
    }
  }
}

/**
 * 月次レポートAPIのPOSTリクエストテストを準備します
 * @param {object} data - 使用するデータ
 */
async function prepareTestData() {
  // POST用にシンプルなテストデータを作成
  return {
    year: TEST_YEAR,
    month: TEST_MONTH,
    employeeCount: 10,
    disabledEmployeeCount: 2,
    notes: `このデータはAPIテスト用です - ${new Date().toISOString()}`,
    employeeData: []
  };
}

/**
 * 全てのテストを実行
 */
async function runAllTests() {
  console.log('🔍 月次レポートAPI接続テストを開始します...');
  console.log(`🕒 テスト日時: ${new Date().toLocaleString()}`);
  console.log('------------------------------------');
  
  // データベース接続テスト
  await testDatabaseConnection();
  
  // GETリクエストテスト
  const singularData = await testGetMonthlyReport('monthly-report');
  const pluralData = await testGetMonthlyReport('monthly-reports');
  
  // PUTリクエストテスト
  const testData = await prepareTestData();
  await testPutMonthlyReport('monthly-report', testData);
  await testPutMonthlyReport('monthly-reports', testData);
  
  // テスト結果のサマリーを表示
  console.log('\n------------------------------------');
  console.log('📊 テスト結果サマリー:');
  console.log('------------------------------------');
  console.log(`データベース接続: ${testResults.database.success ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`notesカラム: ${testResults.notesColumn.exists ? '✅ 存在します' : '❌ 存在しません'}`);
  console.log('エンドポイントテスト:');
  console.log(`  - GET /monthly-report/: ${testResults.endpoints.singular.get ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`  - PUT /monthly-report/: ${testResults.endpoints.singular.put ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`  - GET /monthly-reports/: ${testResults.endpoints.plural.get ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`  - PUT /monthly-reports/: ${testResults.endpoints.plural.put ? '✅ 成功' : '❌ 失敗'}`);
  
  // 互換性診断
  const compatibilityStatus = 
    (testResults.endpoints.singular.get || testResults.endpoints.plural.get) &&
    (testResults.endpoints.singular.put || testResults.endpoints.plural.put);
  
  console.log('------------------------------------');
  console.log(`🔄 API互換性: ${compatibilityStatus ? '✅ OKです' : '❌ 問題があります'}`);
  
  if (!testResults.notesColumn.exists) {
    console.log('⚠️ 注意: notesカラムが存在しません。migrations/20250507_add_notes_column.sqlを実行してください。');
  }
  
  if (!compatibilityStatus) {
    console.log('⚠️ 注意: 一部のAPIエンドポイントが正しく動作していません。修正が必要です。');
  }
  
  // データベース接続を閉じる
  await pool.end();
}

// すべてのテストを実行
runAllTests().catch(error => {
  console.error('🔥 テスト実行中にエラーが発生しました:', error);
  pool.end();
});