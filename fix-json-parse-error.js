#!/usr/bin/env node
// fix-json-parse-error.js - JSONパースエラー修正のための診断および修正スクリプト

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const { execSync } = require('child_process');

// テスト設定
const SERVER_URL = 'http://localhost:5001';
const API_URL = `${SERVER_URL}/api`;

// コンソールメッセージヘルパー
const log = {
  info: (msg) => console.log(chalk.blue('ℹ ') + msg),
  success: (msg) => console.log(chalk.green('✓ ') + msg),
  warning: (msg) => console.log(chalk.yellow('⚠ ') + msg),
  error: (msg) => console.log(chalk.red('✗ ') + msg),
  title: (msg) => console.log(chalk.cyan.bold('\n=== ' + msg + ' ==='))
};

// 非同期で一時停止する関数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// サーバーヘルスチェック関数
async function checkServer() {
  log.title('サーバー接続確認');
  
  try {
    const response = await axios.get(`${API_URL}/health`, { 
      validateStatus: () => true,
      timeout: 5000 
    });
    if (response.status === 200) {
      log.success(`サーバー応答 (${response.status}): ${SERVER_URL}`);
      return true;
    } else {
      log.error(`サーバー異常応答 (${response.status}): ${SERVER_URL}`);
      return false;
    }
  } catch (error) {
    log.error(`サーバー接続エラー: ${error.message}`);
    return false;
  }
}

// 404エラーレスポンスチェック
async function check404Response() {
  log.title('404 エラーレスポンス確認');
  
  try {
    const response = await axios.get(`${API_URL}/non-existent-endpoint`, {
      validateStatus: () => true,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // レスポンスタイプ確認
    const contentType = response.headers['content-type'] || '';
    const isJson = contentType.includes('application/json');
    const status = response.status;
    
    if (isJson && status === 404) {
      log.success(`404エラーはJSON形式で返されました (${contentType})`);
      log.success(`データ: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } else if (!isJson && status === 404) {
      log.error(`404エラーがHTML形式で返されました (${contentType})`);
      if (typeof response.data === 'string') {
        log.error(`応答プレビュー: ${response.data.substring(0, 100)}...`);
      }
      return false;
    } else {
      log.warning(`予期しないレスポンス: ステータス ${status}, タイプ ${contentType}`);
      return false;
    }
  } catch (error) {
    log.error(`404テスト中のエラー: ${error.message}`);
    return false;
  }
}

// サーバー修正関数
async function fixServer() {
  log.title('サーバー設定の自動修正');
  
  try {
    // errorHandler.jsの修正
    const errorHandlerPath = path.join(__dirname, 'backend', 'utils', 'errorHandler.js');
    if (fs.existsSync(errorHandlerPath)) {
      let content = fs.readFileSync(errorHandlerPath, 'utf8');
      
      // 404ハンドラーを修正
      let modified = false;
      
      // 適切な404ハンドラーを追加（既存の実装を保持）
      const customCode = `
// APIルート用の404ハンドラー
const apiNotFoundHandler = (req, res) => {
  console.warn(\`存在しないAPIルート: \${req.method} \${req.originalUrl}\`);
  res.status(404);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: false,
    message: 'APIルートが見つかりません',
    path: req.originalUrl
  });
};

// フォールバック用404ハンドラー
const notFoundHandler = (req, res) => {
  console.warn(\`存在しないルート: \${req.method} \${req.originalUrl}\`);
  res.status(404);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: false,
    message: 'リソースが見つかりません',
    path: req.originalUrl
  });
};`;
      
      // 既存のコードのエラーハンドラーの実装を自動修正
      if (!content.includes('res.setHeader(\'Content-Type\', \'application/json\')')) {
        // コンストラクタの後に追加
        content = content.replace(/class ErrorHandler {[^]*?}/, 
          (match) => match + '\n' + customCode
        );
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(errorHandlerPath, content, 'utf8');
        log.success(`errorHandler.js を修正しました`);
      } else {
        log.info(`errorHandler.js は既に最適化されています`);
      }
    } else {
      log.warning(`errorHandler.js が見つかりません: ${errorHandlerPath}`);
    }
    
    // server.jsの修正
    const serverPath = path.join(__dirname, 'backend', 'server.js');
    if (fs.existsSync(serverPath)) {
      let content = fs.readFileSync(serverPath, 'utf8');
      
      // 404ハンドラーの追加
      let modified = false;
      
      // 適切なミドルウェア呼び出しを追加
      const needsToAdd = !content.includes('app.use((req, res) => {') && 
                         !content.includes('app.use(\'*\', (req, res) => {');
      
      if (needsToAdd) {
        const customCode = `
// すべてのリクエストで、常にJSONレスポンスを返す最終ハンドラー
app.use((req, res, next) => {
  console.warn(\`存在しないルート: \${req.method} \${req.originalUrl}\`);
  res.status(404);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: false,
    message: 'リソースが見つかりません',
    path: req.originalUrl
  });
});`;
        
        // バックエンド起動コードの直前に追加
        if (content.includes('const startServer = async () => {')) {
          content = content.replace(
            /const startServer = async \(\) => {/,
            customCode + '\n\n// データベースへの接続とサーバー起動\nconst startServer = async () => {'
          );
          modified = true;
        } else {
          // 警告: 標準的なパターンが見つからなかった
          log.warning(`server.js に 404ハンドラーを追加できませんでした`);
        }
      }
      
      if (modified) {
        fs.writeFileSync(serverPath, content, 'utf8');
        log.success(`server.js を修正しました`);
      } else {
        log.info(`server.js は既に最適化されています`);
      }
    } else {
      log.warning(`server.js が見つかりません: ${serverPath}`);
    }
    
    return true;
  } catch (error) {
    log.error(`サーバー修正中のエラー: ${error.message}`);
    return false;
  }
}

// フロントエンド修正関数
async function fixFrontend() {
  log.title('フロントエンド設定の自動修正');
  
  try {
    // package.jsonのproxy設定確認
    const frontendPackageJsonPath = path.join(__dirname, 'frontend', 'package.json');
    if (fs.existsSync(frontendPackageJsonPath)) {
      let content = fs.readFileSync(frontendPackageJsonPath, 'utf8');
      let packageJson = JSON.parse(content);
      
      // proxy設定の確認と追加
      if (!packageJson.proxy || packageJson.proxy !== 'http://localhost:5001') {
        packageJson.proxy = 'http://localhost:5001';
        fs.writeFileSync(frontendPackageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
        log.success(`frontend/package.json に proxy設定を追加しました`);
      } else {
        log.info(`frontend/package.json の proxy設定は正しいです`);
      }
    } else {
      log.warning(`frontend/package.json が見つかりません: ${frontendPackageJsonPath}`);
    }
    
    // APIクライアントの修正
    const apiClientPath = path.join(__dirname, 'frontend', 'src', 'api', 'client.ts');
    if (fs.existsSync(apiClientPath)) {
      let content = fs.readFileSync(apiClientPath, 'utf8');
      
      // API_BASE_URLを修正
      const hasCorrectBaseUrl = content.includes("process.env.NODE_ENV === 'development'") &&
                               content.includes("? '/api'") &&
                               content.includes("'Accept': 'application/json'");
      
      if (!hasCorrectBaseUrl) {
        // 開発環境でプロキシを使用するように修正
        content = content.replace(
          /const API_BASE_URL = [^;]*;/,
          `const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001/api');`
        );
        
        // Content-Typeヘッダーにaccept追加
        content = content.replace(
          /'Content-Type': 'application\/json'/,
          `'Content-Type': 'application/json',
    'Accept': 'application/json'`
        );
        
        fs.writeFileSync(apiClientPath, content, 'utf8');
        log.success(`client.ts APIクライアント設定を修正しました`);
      } else {
        log.info(`client.ts APIクライアント設定は正しいです`);
      }
    } else {
      log.warning(`client.ts APIクライアントが見つかりません: ${apiClientPath}`);
    }
    
    return true;
  } catch (error) {
    log.error(`フロントエンド修正中のエラー: ${error.message}`);
    return false;
  }
}

// メイン処理
async function main() {
  console.log(chalk.bold.cyan('\n================================================'));
  console.log(chalk.bold.cyan('  JSON Parse Error 自動修正ツール'));
  console.log(chalk.bold.cyan('================================================\n'));
  
  // サーバー接続確認
  const serverOnline = await checkServer();
  
  if (serverOnline) {
    // 404エラーレスポンス確認
    const json404Works = await check404Response();
    
    if (!json404Works) {
      log.warning('404エラーがJSON形式で返されていません。自動修正を行います...');
      
      // サーバー設定修正
      await fixServer();
      
      // サーバー再起動の指示
      log.warning('\nサーバーの再起動が必要です。以下のコマンドを実行してください:');
      log.info('cd backend && npm start');
    }
  } else {
    log.warning('サーバーが応答していないため、設定のみ修正します...');
  }
  
  // フロントエンド設定修正
  await fixFrontend();
  
  console.log(chalk.bold.cyan('\n================================================'));
  console.log(chalk.bold.cyan('  修正完了'));
  console.log(chalk.bold.cyan('================================================'));
  
  log.info('\n以下の手順でシステムを再起動してください:');
  log.info('1. バックエンドサーバーを再起動: cd backend && npm start');
  log.info('2. フロントエンドサーバーを再起動: cd frontend && npm start');
  log.info('3. 診断スクリプトで確認: node diagnostics.js');
  
  console.log('\n');
}

// スクリプト実行
main().catch(error => {
  console.error('スクリプト実行エラー:', error);
  process.exit(1);
});