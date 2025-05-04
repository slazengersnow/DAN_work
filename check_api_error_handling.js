// check_api_error_handling.js - Comprehensive error handling test

const axios = require('axios');
const chalk = require('chalk');

// テスト設定
const SERVER_URL = 'http://localhost:5001';
const API_URL = `${SERVER_URL}/api`;
const FRONTEND_URL = 'http://localhost:3001';

// ヘッダーなしのHTMLレスポンス確認用
const fetchUrl = async (url) => {
  try {
    const response = await axios.get(url, {
      validateStatus: () => true,
      headers: {
        'Accept': 'application/json'
      }
    });
    return {
      status: response.status,
      contentType: response.headers['content-type'] || 'no content type',
      data: response.data,
      isJson: typeof response.data === 'object'
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return {
      error: error.message,
      isJson: false
    };
  }
};

// テスト実行
const runTests = async () => {
  console.log(chalk.cyan.bold('=============================================='));
  console.log(chalk.cyan.bold('障害者雇用管理システム - API エラーハンドリングテスト'));
  console.log(chalk.cyan.bold('=============================================='));
  
  // バックエンド直接テスト
  console.log(chalk.yellow('\n[1] バックエンドサーバー 404 テスト:'));
  
  // 存在しないAPIエンドポイント
  console.log(chalk.blue('\n1.1. 存在しないAPIパス'));
  const apiResult = await fetchUrl(`${API_URL}/non-existent-path`);
  console.log(`ステータス: ${apiResult.status}`);
  console.log(`Content-Type: ${apiResult.contentType}`);
  console.log(`JSON応答: ${apiResult.isJson ? chalk.green('はい') : chalk.red('いいえ')}`);
  if (apiResult.isJson) {
    console.log('データ:', JSON.stringify(apiResult.data, null, 2));
  } else {
    console.log('データプレビュー:', typeof apiResult.data === 'string' ? 
      apiResult.data.substring(0, 100) + '...' : 
      apiResult.data);
  }
  
  // 存在しないルートパス
  console.log(chalk.blue('\n1.2. 存在しないルートパス'));
  const rootResult = await fetchUrl(`${SERVER_URL}/non-existent-path`);
  console.log(`ステータス: ${rootResult.status}`);
  console.log(`Content-Type: ${rootResult.contentType}`);
  console.log(`JSON応答: ${rootResult.isJson ? chalk.green('はい') : chalk.red('いいえ')}`);
  if (rootResult.isJson) {
    console.log('データ:', JSON.stringify(rootResult.data, null, 2));
  } else {
    console.log('データプレビュー:', typeof rootResult.data === 'string' ? 
      rootResult.data.substring(0, 100) + '...' : 
      rootResult.data);
  }

  // 結果表示
  console.log(chalk.cyan.bold('\n=============================================='));
  console.log(chalk.yellow.bold('テスト結果:'));
  
  // API 404テスト
  if (apiResult.isJson && apiResult.status === 404) {
    console.log(chalk.green('✓ API 404テスト: 成功 - JSONレスポンスが返されました'));
  } else {
    console.log(chalk.red('✗ API 404テスト: 失敗 - JSON以外のレスポンスが返されました'));
  }
  
  // ルート 404テスト
  if (rootResult.isJson && rootResult.status === 404) {
    console.log(chalk.green('✓ ルート 404テスト: 成功 - JSONレスポンスが返されました'));
  } else {
    console.log(chalk.red('✗ ルート 404テスト: 失敗 - JSON以外のレスポンスが返されました'));
  }
  
  // 残りの問題
  if (!apiResult.isJson || !rootResult.isJson) {
    console.log(chalk.yellow('\n残りの問題:'));
    if (!apiResult.isJson) {
      console.log('- API 404レスポンスがまだHTMLを返しています。サーバーを再起動してください。');
    }
    if (!rootResult.isJson) {
      console.log('- ルート 404レスポンスがまだHTMLを返しています。サーバーを再起動してください。');
    }
    
    console.log(chalk.cyan('\n推奨対応:'));
    console.log('1. バックエンドサーバーを再起動してください。');
    console.log('2. エラーが続く場合は、server.js に正しく404ハンドラーが設定されているか確認してください。');
    console.log('3. 最後の手段として、Expressの代わりにNode.jsの`http`モジュールで404ハンドラーをオーバーライドすることを検討してください。');
  }
};

// テスト実行
runTests();