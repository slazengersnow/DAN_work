#!/usr/bin/env node

/**
 * 月次詳細APIエンドポイント総合修正スクリプト
 * 
 * 機能：
 * 1. バックエンドのルーティング互換性を強化
 * 2. フロントエンドのCSVImportModal.tsxを修正版に差し替え
 * 3. PUTメソッドのサポートをバックエンドに追加
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// パス設定
const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const SERVER_JS_PATH = path.join(BACKEND_DIR, 'server.js');
const MONTHLY_ROUTES_PATH = path.join(BACKEND_DIR, 'routes', 'monthlyReportRoutes.js');
const CSV_IMPORT_PATH = path.join(FRONTEND_DIR, 'src', 'pages', 'MonthlyReport', 'CSVImportModal.tsx');
const CSV_IMPORT_ENHANCED_PATH = path.join(FRONTEND_DIR, 'src', 'pages', 'MonthlyReport', 'CSVImportModal.enhanced.tsx');

// バックアップディレクトリ
const BACKUP_DIR = path.join(ROOT_DIR, 'backup');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 結果を保存する変数
const results = {
  serverUpdated: false,
  routesUpdated: false,
  frontendUpdated: false,
  errors: []
};

/**
 * ファイルをバックアップする関数
 * @param {string} filePath - バックアップするファイルのパス
 * @returns {string} バックアップファイルのパス
 */
function backupFile(filePath) {
  try {
    const fileName = path.basename(filePath);
    const backupPath = path.join(BACKUP_DIR, `${fileName}.bak.${Date.now()}`);
    fs.copyFileSync(filePath, backupPath);
    console.log(`[バックアップ] ${filePath} -> ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`[エラー] バックアップ作成失敗: ${filePath}`, error);
    results.errors.push(`バックアップ失敗: ${error.message}`);
    return null;
  }
}

/**
 * バックエンドサーバーにPUTメソッドサポートを追加
 */
function updateServerFile() {
  try {
    // ファイルの存在確認
    if (!fs.existsSync(SERVER_JS_PATH)) {
      console.error(`[エラー] サーバーファイルが見つかりません: ${SERVER_JS_PATH}`);
      results.errors.push('サーバーファイルが見つかりません');
      return false;
    }

    // ファイルのバックアップ
    backupFile(SERVER_JS_PATH);
    
    // ファイル内容の読み込み
    let serverContent = fs.readFileSync(SERVER_JS_PATH, 'utf8');
    
    // 修正1: monthly-report エイリアスルートの追加
    const monthlyReportAliasMarker = 'app.use(\'/api/monthly-reports\', monthlyReportRoutes);';
    const aliasRoute = `app.use('/api/monthly-reports', monthlyReportRoutes);\n// 月次レポートのエイリアスルート - APIの互換性のため\napp.use('/api/monthly-report', monthlyReportRoutes);`;
    
    // 既に修正が適用されているか確認
    if (serverContent.includes('/api/monthly-report')) {
      console.log('[スキップ] monthly-reportエイリアスルートは既に存在します');
    } else {
      // 置換を実行
      serverContent = serverContent.replace(
        monthlyReportAliasMarker, 
        aliasRoute
      );
      
      // 変更があったか確認
      if (serverContent.includes('/api/monthly-report')) {
        console.log('[成功] monthly-reportエイリアスルートを追加しました');
        results.serverUpdated = true;
      } else {
        console.warn('[警告] monthly-reportエイリアスルートの追加に失敗した可能性があります');
      }
    }
    
    // ファイルの保存
    fs.writeFileSync(SERVER_JS_PATH, serverContent, 'utf8');
    console.log(`[成功] サーバーファイルを更新しました: ${SERVER_JS_PATH}`);
    return true;
  } catch (error) {
    console.error('[エラー] サーバーファイルの更新に失敗しました:', error);
    results.errors.push(`サーバーファイル更新失敗: ${error.message}`);
    return false;
  }
}

/**
 * ルート定義にPUTメソッドを追加
 */
function updateRoutesFile() {
  try {
    // ファイルの存在確認
    if (!fs.existsSync(MONTHLY_ROUTES_PATH)) {
      console.error(`[エラー] ルートファイルが見つかりません: ${MONTHLY_ROUTES_PATH}`);
      results.errors.push('ルートファイルが見つかりません');
      return false;
    }

    // ファイルのバックアップ
    backupFile(MONTHLY_ROUTES_PATH);
    
    // ファイル内容の読み込み
    let routesContent = fs.readFileSync(MONTHLY_ROUTES_PATH, 'utf8');
    
    // 修正: PUTメソッドのサポートを追加
    const postRouteMarker = 'router.post(\'/:year/:month\', monthlyReportController.saveMonthlyReport);';
    const putRoute = 'router.post(\'/:year/:month\', monthlyReportController.saveMonthlyReport);\n\n// 月次レポート更新（PUT）\nrouter.put(\'/:year/:month\', monthlyReportController.saveMonthlyReport);';
    
    // 既に修正が適用されているか確認
    if (routesContent.includes('router.put(\'/:year/:month\'')) {
      console.log('[スキップ] PUTメソッドは既に定義されています');
    } else {
      // 置換を実行
      routesContent = routesContent.replace(
        postRouteMarker, 
        putRoute
      );
      
      // 変更があったか確認
      if (routesContent.includes('router.put(\'/:year/:month\'')) {
        console.log('[成功] PUTメソッドのルートを追加しました');
        results.routesUpdated = true;
      } else {
        console.warn('[警告] PUTメソッドの追加に失敗した可能性があります');
      }
    }
    
    // ファイルの保存
    fs.writeFileSync(MONTHLY_ROUTES_PATH, routesContent, 'utf8');
    console.log(`[成功] ルートファイルを更新しました: ${MONTHLY_ROUTES_PATH}`);
    return true;
  } catch (error) {
    console.error('[エラー] ルートファイルの更新に失敗しました:', error);
    results.errors.push(`ルートファイル更新失敗: ${error.message}`);
    return false;
  }
}

/**
 * CSVImportModal.tsxを強化バージョンに置き換え
 */
function updateCSVImportModal() {
  try {
    // 元のファイルの存在確認
    if (!fs.existsSync(CSV_IMPORT_PATH)) {
      console.error(`[エラー] CSVImportModal.tsxが見つかりません: ${CSV_IMPORT_PATH}`);
      results.errors.push('CSVImportModal.tsxが見つかりません');
      return false;
    }
    
    // 強化バージョンの存在確認
    if (!fs.existsSync(CSV_IMPORT_ENHANCED_PATH)) {
      console.error(`[エラー] 強化版CSVImportModalが見つかりません: ${CSV_IMPORT_ENHANCED_PATH}`);
      results.errors.push('強化版CSVImportModalが見つかりません');
      return false;
    }

    // 元のファイルをバックアップ
    backupFile(CSV_IMPORT_PATH);
    
    // 強化バージョンを元のファイルにコピー
    fs.copyFileSync(CSV_IMPORT_ENHANCED_PATH, CSV_IMPORT_PATH);
    console.log(`[成功] CSVImportModal.tsxを強化バージョンに置き換えました`);
    results.frontendUpdated = true;
    return true;
  } catch (error) {
    console.error('[エラー] CSVImportModal.tsxの更新に失敗しました:', error);
    results.errors.push(`CSVImportModal更新失敗: ${error.message}`);
    return false;
  }
}

/**
 * コマンドを実行する関数
 * @param {string} command - 実行するコマンド
 * @returns {Promise<string>} コマンドの実行結果
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[エラー] コマンド実行中にエラーが発生しました: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.warn(`[警告] コマンドの標準エラー出力: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

/**
 * バックエンドサーバーを再起動する関数
 */
async function restartBackendServer() {
  try {
    // サーバー再起動スクリプトの実行
    if (fs.existsSync(path.join(ROOT_DIR, 'restart.sh'))) {
      console.log('[実行] バックエンドサーバーを再起動しています...');
      const output = await executeCommand(`bash ${path.join(ROOT_DIR, 'restart.sh')}`);
      console.log(`[成功] サーバー再起動: ${output}`);
      return true;
    } else {
      console.log('[スキップ] restart.shが見つからないため、バックエンドの再起動はスキップします');
      return false;
    }
  } catch (error) {
    console.error('[エラー] バックエンドの再起動に失敗しました:', error);
    results.errors.push(`バックエンド再起動失敗: ${error.message}`);
    return false;
  }
}

/**
 * メイン関数
 */
async function main() {
  console.log('====================================================');
  console.log('= 月次詳細APIエンドポイント総合修正スクリプト開始 =');
  console.log('====================================================');
  
  try {
    // 1. バックエンドサーバーを更新
    updateServerFile();
    
    // 2. ルートファイルを更新
    updateRoutesFile();
    
    // 3. CSVImportModalを更新
    updateCSVImportModal();
    
    // 4. サーバーを再起動（オプション）
    if (results.serverUpdated || results.routesUpdated) {
      const shouldRestart = process.argv.includes('--restart');
      if (shouldRestart) {
        await restartBackendServer();
      } else {
        console.log('[情報] サーバーの再起動はスキップします。再起動するには --restart オプションを指定してください');
      }
    }
    
    // 結果の表示
    console.log('\n====================================================');
    console.log('= 修正結果サマリー =');
    console.log('====================================================');
    console.log(`- サーバーファイル更新: ${results.serverUpdated ? '成功' : '未変更'}`);
    console.log(`- ルートファイル更新: ${results.routesUpdated ? '成功' : '未変更'}`);
    console.log(`- フロントエンド更新: ${results.frontendUpdated ? '成功' : '未変更'}`);
    
    if (results.errors.length > 0) {
      console.log('\n[警告] 以下のエラーが発生しました:');
      results.errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
    }
    
    console.log('\n====================================================');
    console.log('= 次のステップ =');
    console.log('====================================================');
    console.log('1. バックエンドサーバーを再起動してください:');
    console.log('   cd backend && npm run dev');
    console.log('2. フロントエンドアプリを再起動してください:');
    console.log('   cd frontend && npm start');
    console.log('3. ブラウザで月次詳細画面を開き、CSVインポート機能をテストしてください');
    console.log('====================================================');
    
    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error('[エラー] 予期しないエラーが発生しました:', error);
    return {
      success: false,
      error: error.message,
      ...results
    };
  }
}

// スクリプトを実行
main().then(result => {
  if (result.success) {
    console.log('[成功] 修正スクリプトが完了しました');
  } else {
    console.error('[失敗] 修正スクリプトでエラーが発生しました');
    process.exit(1);
  }
});