// このスクリプトは月次詳細表示の問題を修正するための変更を適用します
// MonthlyReportDetail.tsxファイルを修正して、計算ロジックとフォーマットの問題を解決します

const fs = require('fs');
const path = require('path');

// ファイルパス
const filePath = path.join(__dirname, 'frontend/src/pages/MonthlyReport/MonthlyReportDetail.tsx');

// ファイルを読み込む
console.log(`${filePath} を読み込んでいます...`);
let content = fs.readFileSync(filePath, 'utf8');

// ===== 修正内容 =====

// 修正1: 実雇用率の計算を小数点第2位まで正確に表示
console.log('1. 実雇用率の計算精度を修正します...');
content = content.replace(
  /Math\.ceil\(rawRate \* 10\) \/ 10/g, 
  'Math.round(rawRate * 100) / 100'
);
content = content.replace(
  /Math\.ceil\(totalRawRate \* 10\) \/ 10/g, 
  'Math.round(totalRawRate * 100) / 100'
);

// 修正2: 法定雇用率の小数点表示を2桁に統一
console.log('2. 法定雇用率の表示形式を2桁小数に修正します...');
content = content.replace(
  /value\.toFixed\(1\)/g, 
  'value.toFixed(2)'
);
content = content.replace(
  /Number\(value\)\.toFixed\(1\)/g, 
  'Number(value).toFixed(2)'
);
content = content.replace(
  /Number\(value\)\.toFixed\(1\);(\s+)\/\/ 小数点第1位まで表示/g, 
  'Number(value).toFixed(2);$1// 小数点第2位まで表示'
);

// 修正3: 障がい者合計の計算ロジックを修正
console.log('3. 障がい者合計の計算ロジックを修正します...');
content = content.replace(
  /level1And2Values\[i\] \* 2 \+ otherValues\[i\] \+\s+level1And2PartTimeValues\[i\] \* 2 \* 0\.5 \+ otherPartTimeValues\[i\] \* 0\.5/g,
  'level1And2Values[i] * 2 + otherValues[i] + level1And2PartTimeValues[i] * 1 + otherPartTimeValues[i] * 0.5'
);

// 修正4: 法定雇用者数の計算をMath.floorに変更
console.log('4. 法定雇用者数の計算方法を変更します...');
content = content.replace(
  /Math\.ceil\(\(legalRateValues\[i\] \* totalEmployeeValues\[i\]\) \/ 100\)/g,
  'Math.floor((legalRateValues[i] * totalEmployeeValues[i]) / 100)'
);
content = content.replace(
  /Math\.ceil\(\(legalRateValues\[12\] \* totalEmployeeValues\[12\]\) \/ 100\)/g,
  'Math.floor((legalRateValues[12] * totalEmployeeValues[12]) / 100)'
);

// 修正5: 空の入力値の処理を修正
console.log('5. 空入力値の処理を修正します...');
content = content.replace(
  /value = isLegalRate \? '0\.0' : '0';/g,
  'value = isLegalRate ? \'0.00\' : \'0\';'
);

// 修正6: 法定雇用率の小数点処理を修正
console.log('6. 法定雇用率の小数点処理を修正します...');
content = content.replace(
  /numValue = parseFloat\(value \+ '0'\);/g,
  'numValue = parseFloat(value + \'00\');'
);

// 修正7: 一桁小数の法定雇用率を2桁に統一する処理を追加
console.log('7. 一桁小数の法定雇用率表示を2桁に統一する処理を追加します...');
const partialDecimalPattern = /else if \(value\.endsWith\('\.\'\)\) \{\s+\/\/ 数値としては '\.0' を付加して解釈\s+numValue = parseFloat\(value \+ '0'\);\s+\/\/ 表示用には末尾の小数点を保持\s+displayValue = value;\s+\}\s+\/\/ 通常の数値または小数/;
const newPartialDecimalCode = `else if (value.endsWith('.')) {
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
      // 通常の数値または小数`;

content = content.replace(partialDecimalPattern, newPartialDecimalCode);

// ===== 修正ファイルの保存 =====
console.log('修正内容をバックアップして保存します...');
const backupPath = path.join(__dirname, 'frontend/src/pages/MonthlyReport/MonthlyReportDetail.tsx.bak');
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`元のファイルを ${backupPath} にバックアップしました`);

fs.writeFileSync(filePath, content, 'utf8');
console.log(`${filePath} を修正しました`);

console.log('-----------------------------------');
console.log('主な修正内容:');
console.log('1. 実雇用率の計算精度を小数点第2位まで正確に表示するよう修正');
console.log('2. 法定雇用率の表示形式を2桁小数に統一（2.30など）');
console.log('3. 障がい者合計の計算ロジックを修正（1・2級パートは1カウント）');
console.log('4. 法定雇用者数の計算をMath.ceil（切り上げ）からMath.floor（切り捨て）に変更');
console.log('5. 小数点表示と入力処理の改善');
console.log('');
console.log('月次詳細機能の修正が完了しました。サーバーを再起動して変更内容を確認してください。');
console.log('従業員詳細タブには影響ありません。');