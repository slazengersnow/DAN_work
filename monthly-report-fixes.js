/**
 * 月次詳細修正スクリプト
 * このスクリプトは月次詳細表示の問題を修正します
 * MonthlyReportDetail.tsxを編集して、計算ロジックと表示の問題を解消します
 */

const fs = require('fs');
const path = require('path');

// ファイルパスの設定
const originalFile = path.join(__dirname, 'frontend', 'src', 'pages', 'MonthlyReport', 'MonthlyReportDetail.tsx');
const backupFile = path.join(__dirname, 'backup', 'frontend', 'src', 'pages', 'MonthlyReport', 'MonthlyReportDetail.tsx');

// 修正関数
function fixMonthlyReportDetail() {
  console.log('月次詳細の修正を開始します...');
  
  try {
    // ファイルが存在するか確認
    if (!fs.existsSync(originalFile)) {
      throw new Error(`ファイルが見つかりません: ${originalFile}`);
    }
    
    // ファイルを読み込む
    let content = fs.readFileSync(originalFile, 'utf8');
    console.log(`ファイルを読み込みました: ${originalFile}`);
    
    // 修正リスト - 各修正とその説明
    const fixes = [
      {
        name: '実雇用率の計算精度を修正',
        description: '実雇用率の計算を小数点第1位切り上げから小数点第2位四捨五入に変更',
        regex: /Math\.ceil\(rawRate \* 10\) \/ 10/g,
        replacement: 'Math.round(rawRate * 100) / 100'
      },
      {
        name: '実雇用率の合計欄計算を修正',
        description: '実雇用率の合計欄計算を小数点第2位に変更',
        regex: /Math\.ceil\(totalRawRate \* 10\) \/ 10/g,
        replacement: 'Math.round(totalRawRate * 100) / 100'
      },
      {
        name: '法定雇用率の小数点表示を2桁に変更',
        description: '法定雇用率を小数点以下1桁から2桁に変更（例: 2.3 → 2.30）',
        regex: /value\.toFixed\(1\)/g,
        replacement: 'value.toFixed(2)'
      },
      {
        name: '法定雇用率のNumber型変換を修正',
        description: '法定雇用率の数値型変換後の小数点表示を2桁に変更',
        regex: /Number\(value\)\.toFixed\(1\)/g,
        replacement: 'Number(value).toFixed(2)'
      },
      {
        name: '実雇用率表示の小数点表示を修正',
        description: '実雇用率の小数点以下1桁表示から2桁表示に変更',
        regex: /\/\/ 小数点第1位まで表示\s+displayValue = Number\(value\)\.toFixed\(1\);/g,
        replacement: '// 小数点第2位まで表示\n                          displayValue = Number(value).toFixed(2);'
      },
      {
        name: '障がい者カウント計算を修正',
        description: '1・2級パートタイムのカウント計算を修正（2×0.5 → 1）',
        regex: /level1And2PartTimeValues\[i\] \* 2 \* 0\.5/g,
        replacement: 'level1And2PartTimeValues[i] * 1'
      },
      {
        name: '法定雇用者数計算を切り上げから切り捨てに変更',
        description: '法定雇用者数の計算方法を切り上げから切り捨てに変更（Math.ceil → Math.floor）',
        regex: /Math\.ceil\(\(legalRateValues\[i\] \* totalEmployeeValues\[i\]\) \/ 100\)/g,
        replacement: 'Math.floor((legalRateValues[i] * totalEmployeeValues[i]) / 100)'
      },
      {
        name: '法定雇用者数合計計算を切り捨てに変更',
        description: '法定雇用者数の合計計算も切り捨てに変更',
        regex: /Math\.ceil\(\(legalRateValues\[12\] \* totalEmployeeValues\[12\]\) \/ 100\)/g,
        replacement: 'Math.floor((legalRateValues[12] * totalEmployeeValues[12]) / 100)'
      },
      {
        name: '空入力値の初期表示を修正',
        description: '法定雇用率の空入力値をより正確に表示（0.0 → 0.00）',
        regex: /value = isLegalRate \? ['"]0\.0['"] : ['"]0['"];/g,
        replacement: 'value = isLegalRate ? "0.00" : "0";'
      },
      {
        name: '超過・不足計算の合計欄を修正',
        description: '超過・不足の合計欄計算を単純合計から正確な計算に修正',
        regex: /\/\/ 合計欄（12）は、4月から3月までの超過・未達の単純合計\s+const totalOverUnder[\s\S]*?\/\/ 合計値をセット\s+newData\.data\[overUnderRowIndex\]\.values\[12\] = totalOverUnder;/g,
        replacement: '// 合計欄（12）も合計の障害者数 - 合計の法定雇用者数で計算\n      newData.data[overUnderRowIndex].values[12] = totalDisabledValues[12] - legalCountValues[12];'
      }
    ];
    
    // 各修正を適用
    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.name}を適用中...`);
      const prevContent = content;
      content = content.replace(fix.regex, fix.replacement);
      
      // 置換が実行されたか確認
      if (prevContent === content) {
        console.log(`   警告: この修正は適用されませんでした`);
      } else {
        console.log(`   完了: ${fix.description}`);
      }
    });
    
    // 特殊な修正: 1桁小数点処理の追加 (正規表現だけでは難しい複雑な置換)
    console.log('特殊な修正: 法定雇用率の1桁小数点処理を修正中...');
    
    // 小数点処理セクションを探す
    const partialDecimalPattern = /\/\/ 法定雇用率の特別処理\s+if \(isLegalRate\) {[\s\S]+?\/\/ 通常の数値または小数\s+else {/;
    const originalSection = content.match(partialDecimalPattern);
    
    if (originalSection) {
      // 新しい処理コードに置き換え
      const newSection = `// 法定雇用率の特別処理
    if (isLegalRate) {
      // 小数点のみの入力
      if (value === '.') {
        numValue = 0;
        displayValue = '0.';
      } 
      // 末尾が小数点の数値
      else if (value.endsWith('.')) {
        // 数値としては '.00' を付加して解釈
        numValue = parseFloat(value + '00');
        // 表示用には末尾の小数点を保持
        displayValue = value;
      }
      // 1桁の小数点（例：2.5）の場合、2桁に統一（2.50）
      else if (value.includes('.') && value.split('.')[1].length === 1) {
        numValue = parseFloat(value);
        displayValue = value + '0';
      }
      // 通常の数値または小数
      else {`;
      
      content = content.replace(originalSection[0], newSection);
      console.log('   完了: 法定雇用率の小数点処理を拡張（1桁小数を2桁に自動変換）');
    } else {
      console.log('   警告: 法定雇用率処理セクションが見つかりませんでした');
    }
    
    // 修正前のファイルをバックアップ
    if (!fs.existsSync(path.dirname(backupFile))) {
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
    }
    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(originalFile, backupFile);
      console.log(`元のファイルをバックアップしました: ${backupFile}`);
    }
    
    // 修正内容を保存
    fs.writeFileSync(originalFile, content);
    console.log(`修正を適用しました: ${originalFile}`);
    
    return true;
  } catch (error) {
    console.error(`エラーが発生しました: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// 実行
if (fixMonthlyReportDetail()) {
  console.log('');
  console.log('==== 月次詳細の修正が完了しました ====');
  console.log('主な修正内容:');
  console.log('1. 実雇用率の計算精度を小数点第2位まで正確に表示');
  console.log('2. 法定雇用率の表示形式を2桁小数に統一');
  console.log('3. 障がい者合計の計算ロジックを修正（1・2級パートは1カウント）');
  console.log('4. 法定雇用者数の計算を切り上げから切り捨てに変更');
  console.log('5. 超過・不足計算の合計欄を正確に計算');
  console.log('6. 小数点表示と入力処理の改善');
  console.log('');
  console.log('これらの修正により、月次詳細の表示と計算が正確になります。');
  console.log('従業員詳細タブには影響がありません。');
  console.log('');
  console.log('アプリケーションを再起動して変更を適用してください。');
} else {
  console.log('');
  console.log('==== 月次詳細の修正に失敗しました ====');
  console.log('エラーログを確認してください。');
}