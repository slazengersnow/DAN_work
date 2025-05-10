/**
 * 月次詳細APIルートの明示的修正スクリプト
 * 
 * 機能：
 * 1. サーバーのルート定義ファイルを修正して、明示的に /api/monthly-report エンドポイントを追加
 * 2. PUTメソッドをサポートするバックエンドコードを確認・修正
 */

const fs = require('fs');
const path = require('path');

// パス設定
const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const SERVER_JS_PATH = path.join(BACKEND_DIR, 'server.js');
const ROUTES_DIR = path.join(BACKEND_DIR, 'routes');
const MONTHLY_ROUTES_PATH = path.join(ROUTES_DIR, 'monthlyReportRoutes.js');

// バックアップディレクトリ
const BACKUP_DIR = path.join(ROOT_DIR, 'backup');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 結果を保存する変数
const results = {
  serverUpdated: false,
  routesUpdated: false,
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
 * サーバーファイルに明示的なルーティングを追加
 * @returns {boolean} 成功したかどうか
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
    
    // 修正1: 明示的な単数形ルートの追加
    const routePattern = "app.use('/api/monthly-reports', monthlyReportRoutes);";
    const replacementRoutes = "app.use('/api/monthly-reports', monthlyReportRoutes);\n// 月次レポートの互換性ルート - 単数形も対応\napp.use('/api/monthly-report', monthlyReportRoutes);";
    
    // 既に修正が適用されているか確認
    if (serverContent.includes("/api/monthly-report', monthlyReportRoutes")) {
      console.log('[スキップ] 単数形のルートは既に追加されています');
    } else {
      // 置換を実行
      serverContent = serverContent.replace(routePattern, replacementRoutes);
      
      // 変更があったか確認
      if (serverContent.includes("/api/monthly-report', monthlyReportRoutes")) {
        console.log('[成功] 単数形のルートを追加しました');
        results.serverUpdated = true;
      } else {
        console.warn('[警告] 単数形のルート追加に失敗した可能性があります');
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
 * ルート定義ファイルにPUTメソッドのサポートが含まれているか確認
 * @returns {boolean} 成功したかどうか
 */
function checkAndUpdateRoutesFile() {
  try {
    // ファイルの存在確認
    if (!fs.existsSync(MONTHLY_ROUTES_PATH)) {
      console.error(`[エラー] ルートファイルが見つかりません: ${MONTHLY_ROUTES_PATH}`);
      results.errors.push('ルートファイルが見つかりません');
      return false;
    }

    // ファイル内容の読み込み
    let routesContent = fs.readFileSync(MONTHLY_ROUTES_PATH, 'utf8');
    
    // PUTルートの確認
    const hasPutRoute = routesContent.includes("router.put('/:year/:month',");
    
    if (hasPutRoute) {
      console.log('[確認] PUTメソッドのルートが正しく定義されています');
      return true;
    }
    
    // PUTルートがない場合は追加
    console.log('[修正] PUTメソッドのルートを追加します');
    
    // ファイルのバックアップ
    backupFile(MONTHLY_ROUTES_PATH);
    
    // POSTルートの後にPUTルートを追加
    const postRoutePattern = "router.post('/:year/:month', monthlyReportController.saveMonthlyReport);";
    const updatedRoutes = "router.post('/:year/:month', monthlyReportController.saveMonthlyReport);\n\n// 月次レポート更新（PUT）\nrouter.put('/:year/:month', monthlyReportController.saveMonthlyReport);";
    
    // 置換を実行
    routesContent = routesContent.replace(postRoutePattern, updatedRoutes);
    
    // 変更があったか確認
    if (routesContent.includes("router.put('/:year/:month',")) {
      console.log('[成功] PUTメソッドのルートを追加しました');
      results.routesUpdated = true;
    } else {
      console.warn('[警告] PUTメソッドのルート追加に失敗した可能性があります');
      results.errors.push('PUTメソッドのルート追加に失敗しました');
      return false;
    }
    
    // ファイルの保存
    fs.writeFileSync(MONTHLY_ROUTES_PATH, routesContent, 'utf8');
    console.log(`[成功] ルートファイルを更新しました: ${MONTHLY_ROUTES_PATH}`);
    return true;
  } catch (error) {
    console.error('[エラー] ルートファイルの確認/更新に失敗しました:', error);
    results.errors.push(`ルートファイル更新失敗: ${error.message}`);
    return false;
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('====================================================');
  console.log('= 月次詳細APIルートの明示的修正スクリプト開始 =');
  console.log('====================================================');
  
  try {
    // 1. サーバーファイルを更新
    updateServerFile();
    
    // 2. ルートファイルを確認・更新
    checkAndUpdateRoutesFile();
    
    // 結果の表示
    console.log('\n====================================================');
    console.log('= 修正結果サマリー =');
    console.log('====================================================');
    console.log(`- サーバーファイル更新: ${results.serverUpdated ? '成功' : '未変更'}`);
    console.log(`- ルートファイル更新: ${results.routesUpdated ? '成功' : '未変更'}`);
    
    if (results.errors.length > 0) {
      console.log('\n[警告] 以下のエラーが発生しました:');
      results.errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
    }
    
    console.log('\n====================================================');
    console.log('= 次のステップ =');
    console.log('====================================================');
    console.log('1. バックエンドサーバーを再起動してください:');
    console.log('   cd backend && npm run dev');
    console.log('2. 再起動後、以下のコマンドでAPIエンドポイントをテストできます:');
    console.log('   curl http://localhost:5001/api/monthly-reports/2024/4');
    console.log('   curl http://localhost:5001/api/monthly-report/2024/4');
    console.log('====================================================');
    
    return {
      success: true,
      serverUpdated: results.serverUpdated,
      routesUpdated: results.routesUpdated,
      errors: results.errors
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
    
    if (!result.serverUpdated && !result.routesUpdated) {
      console.log('[情報] 必要な修正は既に適用されています。追加の変更は必要ありません。');
    }
  } else {
    console.error('[失敗] 修正スクリプトでエラーが発生しました');
    process.exit(1);
  }
});