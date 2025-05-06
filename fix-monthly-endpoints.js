/**
 * 月次詳細のAPIエンドポイント修正スクリプト
 * - サーバーのルートとCSVImportModal.tsxのエンドポイントを合わせる
 */

const fs = require('fs');
const path = require('path');

// ファイルパス
const serverFilePath = path.join(__dirname, 'backend', 'server.js');
const csvImportFilePath = path.join(__dirname, 'frontend', 'src', 'pages', 'MonthlyReport', 'CSVImportModal.tsx');

// バックアップディレクトリ
const backupDir = path.join(__dirname, 'backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// バックアップを作成
function createBackup(filePath) {
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupDir, `${fileName}.bak.${Date.now()}`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`バックアップを作成しました: ${backupPath}`);
  return backupPath;
}

// 問題の解決方法1: サーバーにエイリアスルートを追加
function addAliasRoutes() {
  console.log('サーバーにエイリアスルートを追加します...');
  
  try {
    let serverContent = fs.readFileSync(serverFilePath, 'utf8');
    
    // まずバックアップを作成
    createBackup(serverFilePath);
    
    // 既に追加されているか確認
    if (serverContent.includes('app.use(\'/api/monthly-report\', monthlyReportRoutes)')) {
      console.log('エイリアスルートは既に追加されています。');
      return false;
    }
    
    // マウントポイントを探す
    const mountPoint = 'app.use(\'/api/monthly-reports\', monthlyReportRoutes);';
    
    // エイリアスルートを追加
    const aliasRoute = `app.use('/api/monthly-reports', monthlyReportRoutes);\n// 月次レポートのエイリアスルート - APIの互換性のため\napp.use('/api/monthly-report', monthlyReportRoutes);`;
    
    // 置換
    serverContent = serverContent.replace(mountPoint, aliasRoute);
    
    // 保存
    fs.writeFileSync(serverFilePath, serverContent);
    console.log('サーバーにエイリアスルートを追加しました。');
    return true;
  } catch (error) {
    console.error('サーバーファイルの修正でエラーが発生しました:', error);
    return false;
  }
}

// 問題の解決方法2: CSVImportModal.tsxのエンドポイントを修正
function fixCSVImportEndpoints() {
  console.log('CSVImportModalのエンドポイントを修正します...');
  
  try {
    let csvImportContent = fs.readFileSync(csvImportFilePath, 'utf8');
    
    // まずバックアップを作成
    createBackup(csvImportFilePath);
    
    // エンドポイントの修正が必要かチェック
    if (csvImportContent.includes('/monthly-report/') && !csvImportContent.includes('/monthly-reports/')) {
      console.log('CSVImportModalのエンドポイントは既に修正されています。');
      return false;
    }
    
    // エンドポイントの修正
    csvImportContent = csvImportContent.replace(
      /\${API_BASE_URL}\/monthly-report\//g, 
      '${API_BASE_URL}/monthly-reports/'
    );
    
    // 保存
    fs.writeFileSync(csvImportFilePath, csvImportContent);
    console.log('CSVImportModalのエンドポイントを修正しました。');
    return true;
  } catch (error) {
    console.error('CSVImportModalファイルの修正でエラーが発生しました:', error);
    return false;
  }
}

// 問題の解決方法3: ダイレクトに動作するエンドポイントハンドラを追加
function addDirectEndpointHandlers() {
  console.log('サーバーにダイレクトなエンドポイントハンドラを追加します...');
  
  try {
    let serverContent = fs.readFileSync(serverFilePath, 'utf8');
    
    // まずバックアップを作成（既に作成済みの場合は不要）
    if (!fs.existsSync(path.join(backupDir, `${path.basename(serverFilePath)}.bak`))) {
      createBackup(serverFilePath);
    }
    
    // 既に追加されているか確認
    if (serverContent.includes('app.get(\'/api/monthly-report/:year/:month\',')) {
      console.log('ダイレクトなエンドポイントハンドラは既に追加されています。');
      return false;
    }
    
    // 挿入ポイントを探す - テストエンドポイントの前
    const insertPoint = '// テスト用エンドポイント';
    
    // 追加するエンドポイントハンドラー
    const directHandlers = `// 月次レポート直接ハンドラー - APIの互換性のため
app.get('/api/monthly-report/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    console.log(\`月次レポート取得リクエスト: \${year}年\${month}月\`);
    
    // monthlyReportRoutesにリダイレクト
    req.url = \`/\${year}/\${month}\`;
    monthlyReportRoutes(req, res);
  } catch (error) {
    console.error('月次レポート取得エラー:', error);
    res.status(500).json({ success: false, message: '月次レポート取得エラー', error: error.message });
  }
});

app.put('/api/monthly-report/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    console.log(\`月次レポート更新リクエスト: \${year}年\${month}月\`);
    
    // monthlyReportRoutesにリダイレクト
    req.url = \`/\${year}/\${month}\`;
    req.method = 'POST'; // monthlyReportRoutesではPUTの代わりにPOSTを使用
    monthlyReportRoutes(req, res);
  } catch (error) {
    console.error('月次レポート更新エラー:', error);
    res.status(500).json({ success: false, message: '月次レポート更新エラー', error: error.message });
  }
});

// テスト用エンドポイント`;
    
    // 置換
    serverContent = serverContent.replace(insertPoint, directHandlers);
    
    // 保存
    fs.writeFileSync(serverFilePath, serverContent);
    console.log('サーバーにダイレクトなエンドポイントハンドラを追加しました。');
    return true;
  } catch (error) {
    console.error('サーバーファイルの修正でエラーが発生しました:', error);
    return false;
  }
}

// メイン実行関数
async function main() {
  console.log('月次詳細のAPIエンドポイント修正を開始します...');
  
  try {
    // 解決方法1: サーバーにエイリアスルートを追加
    const aliasAdded = addAliasRoutes();
    
    // 解決方法2: CSVImportModal.tsxのエンドポイントを修正
    const csvImportFixed = fixCSVImportEndpoints();
    
    // 解決方法3: ダイレクトに動作するエンドポイントハンドラを追加
    const directHandlersAdded = addDirectEndpointHandlers();
    
    if (aliasAdded || csvImportFixed || directHandlersAdded) {
      console.log('修正が完了しました。サーバーを再起動してください。');
    } else {
      console.log('修正は必要ありませんでした。');
    }
    
    return {
      aliasAdded,
      csvImportFixed,
      directHandlersAdded,
      success: true
    };
  } catch (error) {
    console.error('修正中にエラーが発生しました:', error);
    return {
      error: error.message,
      success: false
    };
  }
}

// 実行
main().then(result => {
  console.log('結果:', result);
  if (result.success) {
    console.log(`
==================================================
修正が完了しました。以下のアクションを実行してください：

1. サーバーを再起動:
   cd backend
   npm run dev

2. フロントエンドを再起動:
   cd frontend
   npm start

3. 動作確認:
   - 月次詳細タブでCSVインポートを実行
   - 従業員詳細が正常に動作することを確認
==================================================
`);
  } else {
    console.log(`
==================================================
修正に失敗しました。
backup ディレクトリにあるバックアップファイルを元に戻すか、
サポートにお問い合わせください。
==================================================
`);
  }
});