/**
 * 月次詳細のCSVインポートエンドポイント修正スクリプト
 * CSVImportModal.tsx と EmployeeCSVImportModal.tsx の修正を行います
 */

const fs = require('fs');
const path = require('path');

// ファイルパス
const csvImportFilePath = path.join(__dirname, 'frontend', 'src', 'pages', 'MonthlyReport', 'CSVImportModal.tsx');
const employeeCSVImportFilePath = path.join(__dirname, 'frontend', 'src', 'pages', 'MonthlyReport', 'EmployeeCSVImportModal.tsx');

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

// CSVImportModal.tsxのエンドポイントを修正
function fixCSVImportEndpoints() {
  console.log('CSVImportModalのエンドポイントを修正します...');
  
  try {
    let csvImportContent = fs.readFileSync(csvImportFilePath, 'utf8');
    
    // まずバックアップを作成
    createBackup(csvImportFilePath);
    
    // 修正が必要かチェック
    const originalCount = (csvImportContent.match(/\/monthly-report\//g) || []).length;
    if (originalCount === 0) {
      console.log('CSVImportModalのエンドポイントは既に修正されています。');
      return { fixed: false, changes: 0 };
    }
    
    // エンドポイントの修正
    csvImportContent = csvImportContent.replace(/\/monthly-report\//g, '/monthly-reports/');
    
    const newCount = (csvImportContent.match(/\/monthly-reports\//g) || []).length;
    const changes = newCount - (csvImportContent.match(/\/monthly-report\//g) || []).length;
    
    // 保存
    fs.writeFileSync(csvImportFilePath, csvImportContent);
    console.log(`CSVImportModalのエンドポイントを修正しました。(${changes}箇所)`);
    return { fixed: true, changes };
  } catch (error) {
    console.error('CSVImportModalファイルの修正でエラーが発生しました:', error);
    return { fixed: false, error: error.message };
  }
}

// EmployeeCSVImportModal.tsxのエンドポイントを修正
function fixEmployeeCSVImportEndpoints() {
  console.log('EmployeeCSVImportModalのエンドポイントを修正します...');
  
  try {
    let csvImportContent = fs.readFileSync(employeeCSVImportFilePath, 'utf8');
    
    // まずバックアップを作成
    createBackup(employeeCSVImportFilePath);
    
    // 修正が必要かチェック
    const originalCount = (csvImportContent.match(/\/monthly-report\//g) || []).length;
    if (originalCount === 0) {
      console.log('EmployeeCSVImportModalのエンドポイントは既に修正されています。');
      return { fixed: false, changes: 0 };
    }
    
    // エンドポイントの修正
    csvImportContent = csvImportContent.replace(/\/monthly-report\//g, '/monthly-reports/');
    
    const newCount = (csvImportContent.match(/\/monthly-reports\//g) || []).length;
    const changes = newCount - (csvImportContent.match(/\/monthly-report\//g) || []).length;
    
    // 保存
    fs.writeFileSync(employeeCSVImportFilePath, csvImportContent);
    console.log(`EmployeeCSVImportModalのエンドポイントを修正しました。(${changes}箇所)`);
    return { fixed: true, changes };
  } catch (error) {
    console.error('EmployeeCSVImportModalファイルの修正でエラーが発生しました:', error);
    return { fixed: false, error: error.message };
  }
}

// APIクライアントとその他のファイルのエンドポイントも修正
function fixOtherApiEndpoints() {
  console.log('その他のAPIエンドポイントを修正します...');
  
  try {
    const apiDir = path.join(__dirname, 'frontend', 'src', 'api');
    const files = fs.readdirSync(apiDir);
    let totalChanges = 0;
    
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        const filePath = path.join(apiDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 修正が必要かチェック
        const originalCount = (content.match(/\/monthly-report\//g) || []).length;
        if (originalCount === 0) {
          continue;
        }
        
        // バックアップを作成
        createBackup(filePath);
        
        // エンドポイントの修正
        content = content.replace(/\/monthly-report\//g, '/monthly-reports/');
        
        const newCount = (content.match(/\/monthly-reports\//g) || []).length;
        const changes = newCount - (content.match(/\/monthly-report\//g) || []).length;
        
        // 保存
        fs.writeFileSync(filePath, content);
        console.log(`${file}のエンドポイントを修正しました。(${changes}箇所)`);
        totalChanges += changes;
      }
    }
    
    return { fixed: totalChanges > 0, changes: totalChanges };
  } catch (error) {
    console.error('その他のAPIエンドポイント修正でエラーが発生しました:', error);
    return { fixed: false, error: error.message };
  }
}

// メイン実行関数
async function main() {
  console.log('月次詳細CSVインポートのAPIエンドポイント修正を開始します...');
  
  try {
    // 1. CSVImportModal.tsxのエンドポイントを修正
    const csvImportResult = fixCSVImportEndpoints();
    
    // 2. EmployeeCSVImportModal.tsxのエンドポイントを修正
    const employeeCSVImportResult = fixEmployeeCSVImportEndpoints();
    
    // 3. その他のAPIエンドポイントも修正
    const otherApiResult = fixOtherApiEndpoints();
    
    const totalChanges = 
      (csvImportResult.changes || 0) + 
      (employeeCSVImportResult.changes || 0) + 
      (otherApiResult.changes || 0);
    
    if (totalChanges > 0) {
      console.log(`合計${totalChanges}箇所のAPIエンドポイントを修正しました。`);
      return {
        csvImportFixed: csvImportResult.fixed,
        employeeCSVImportFixed: employeeCSVImportResult.fixed,
        otherApiFixed: otherApiResult.fixed,
        totalChanges,
        success: true
      };
    } else {
      console.log('修正は必要ありませんでした。');
      return {
        csvImportFixed: false,
        employeeCSVImportFixed: false,
        otherApiFixed: false,
        totalChanges: 0,
        success: true
      };
    }
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
    if (result.totalChanges > 0) {
      console.log(`
==================================================
修正が完了しました。以下のアクションを実行してください：

1. フロントエンドを再起動:
   cd frontend
   npm start

2. 動作確認:
   - 月次詳細タブでCSVインポートを実行
   - エラーが解消されているか確認
==================================================
`);
    } else {
      console.log(`
==================================================
すべてのファイルが既に正しいエンドポイントを使用しています。
追加の修正は必要ありません。
==================================================
`);
    }
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