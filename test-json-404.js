// test-json-404.js - Specific test for JSON 404 handling

const axios = require('axios');
const chalk = require('chalk');

// サーバーURLとポート
const SERVER_URL = 'http://localhost:5001';
const API_BASE = `${SERVER_URL}/api`;

async function testNonExistentRoute() {
  console.log(chalk.cyan('==== 存在しないルートのJSON 404テスト ===='));
  
  try {
    // 存在しないAPIルートにリクエスト
    console.log(`${API_BASE}/non-existent-path へGETリクエスト送信中...`);
    const response = await axios.get(`${API_BASE}/non-existent-path`, {
      validateStatus: () => true, // すべてのステータスコードを許可
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`ステータスコード: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    // レスポンスがJSONかHTML（404）かを判断
    const isJsonResponse = response.headers['content-type'] && 
                          response.headers['content-type'].includes('application/json');
    
    if (isJsonResponse) {
      console.log(chalk.green('✓ JSONレスポンスを受信 (成功)'));
      console.log('レスポンスデータ:', JSON.stringify(response.data, null, 2));
    } else {
      console.log(chalk.red('✗ 非JSONレスポンスを受信 (HTML 404?)'));
      // レスポンスの先頭部分を表示
      const preview = response.data.substring ? 
        response.data.substring(0, 200) : 
        JSON.stringify(response.data).substring(0, 200);
      console.log('レスポンスプレビュー:', preview);
    }
  } catch (error) {
    console.error(chalk.red('✗ リクエストエラー:'), error.message);
    
    if (error.response) {
      console.log(`ステータスコード: ${error.response.status}`);
      console.log(`Content-Type: ${error.response.headers['content-type']}`);
    }
  }
}

// 実行
testNonExistentRoute();