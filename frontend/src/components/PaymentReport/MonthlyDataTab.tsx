import React, { useState, useEffect, useMemo } from 'react';
import { paymentReportApi } from '../../api/paymentReportApi';
import { settingsApi } from '../../api/settingsApi'; // 設定APIをインポート

interface MonthlyDataTabProps {
  fiscalYear: string;
  reportData?: any;
}

// インポートモーダルコンポーネント
const MonthlyDataImport: React.FC<{
  onImportComplete?: (importedData: any) => void;
  onClose?: () => void;
  currentYear: number;
}> = ({ onImportComplete, onClose, currentYear }) => {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // テンプレートダウンロード処理
  const handleDownloadTemplate = async () => {
    try {
      // CSVテンプレートの内容（BOM付きUTF-8でエンコード）
      const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
      
      // より明確で堅牢なCSVテンプレート形式
      const templateContent = 
`年度,${currentYear},,,,,,,,,,,,
月,4月,5月,6月,7月,8月,9月,10月,11月,12月,1月,2月,3月,
常用労働者数,510,515,520,523,525,530,528,527,520,515,510,505,
障がい者雇用者数,13,13,14,15,15,15,14,14,13,13,12,12,`;
      
      // CSVファイルを作成（BOMを追加してUTF-8エンコーディングを明示）
      const blob = new Blob([BOM, templateContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `monthly_data_template_${currentYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('月別データテンプレートをダウンロードしました');
      
      // テンプレートの使い方を説明するアラート
      alert(
        'CSVテンプレートをダウンロードしました。\n\n' +
        '【使い方】\n' +
        '1. ファイルをExcelなどで開く\n' +
        '2. 年度の数字を必要に応じて変更（例: 2023, 2024, 2025など）\n' +
        '3. 各月の常用労働者数と障がい者雇用者数を入力\n' +
        '4. 【重要】CSVとして保存する（文字コードはUTF-8を選択）\n' +
        '5. 「CSVファイルを選択」ボタンからインポート\n\n' +
        '※ファイル形式は変更しないでください。月や行の見出しは変更しないでください。'
      );
    } catch (error) {
      console.error('テンプレートダウンロードエラー:', error);
      alert('テンプレートのダウンロード中にエラーが発生しました');
    }
  };

  // CSVファイル選択処理
  const handleFileSelect = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setImporting(true);
          setImportError(null);
          
          // FileReader でファイルを読み込む
          const reader = new FileReader();
          
          reader.onload = async (event) => {
            if (event.target && event.target.result) {
              const csvContent = event.target.result as string;
              
              try {
                // CSVをパースしてデータに変換 - 年度取得関数として () => currentYear を渡す
                const importedData = parseMonthlyCSV(csvContent, () => currentYear);
                
                console.log('CSVから読み込んだデータ:', importedData);
                
                // インポート完了通知
                if (onImportComplete) {
                  onImportComplete(importedData);
                }
                
                // モーダルを閉じる
                if (onClose) {
                  onClose();
                }
                
                setImporting(false);
                alert('月別データのインポートが完了しました');
              } catch (parseError) {
                console.error('CSVパースエラー:', parseError);
                setImportError('CSVデータの解析中にエラーが発生しました。正しいフォーマットか確認してください。');
                setImporting(false);
              }
            }
          };
          
          reader.onerror = () => {
            setImportError('ファイルの読み込み中にエラーが発生しました');
            setImporting(false);
          };
          
          reader.readAsText(file, 'UTF-8');
          
        } catch (error) {
          console.error('CSVインポートエラー:', error);
          setImportError('CSVインポート中にエラーが発生しました');
          setImporting(false);
        }
      }
    };
    
    fileInput.click();
  };

  // CSVをパースする関数 - 修正版
  const parseMonthlyCSV = (csvContent: string, yearGetter: () => number) => {
    // BOMを除去する
    const content = csvContent.replace(/^\uFEFF/, '');
    
    // 行に分割
    const rows = content.split(/\r?\n/).filter(row => row.trim() !== '');
    console.log('CSV行数:', rows.length);
    console.log('CSV内容:', rows);
    
    // 年度を取得
    let year = yearGetter();
    // 行から年度を探す
    for (const row of rows) {
      const cells = row.split(',');
      if (cells[0] === '年度' && cells[1] && /^\d{4}$/.test(cells[1].trim())) {
        year = parseInt(cells[1].trim(), 10);
        break;
      }
    }
    
    console.log("CSV解析: 年度", year);
    
    // 月次データ用の初期構造
    const totalRegularEmployees: { [key: string]: number } = {};
    const disabledEmployees: { [key: string]: number } = {};
    
    // 月の対応マップ
    const monthMap: { [key: string]: string } = {
      '4月': 'april', '5月': 'may', '6月': 'june', '7月': 'july', 
      '8月': 'august', '9月': 'september', '10月': 'october', '11月': 'november', 
      '12月': 'december', '1月': 'january', '2月': 'february', '3月': 'march'
    };
    
    // 月ヘッダー行と各データ行を検出
    let monthHeaderRow: string[] = [];
    let regularEmployeesRow: string[] = [];
    let disabledEmployeesRow: string[] = [];
    
    // 行を解析してデータを抽出
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].split(',');
      
      // 月ヘッダー行を検出
      if (cells[0] === '月' || (cells[0] === '' && cells[1] === '4月')) {
        monthHeaderRow = cells;
        continue;
      }
      
      // 常用労働者数の行を検出
      if (cells[0] && (cells[0].includes('常用労働者数') || cells[0].includes('常勤雇用労働者数'))) {
        regularEmployeesRow = cells;
        continue;
      }
      
      // 障がい者雇用者数の行を検出
      if (cells[0] && cells[0].includes('障がい者雇用者数')) {
        disabledEmployeesRow = cells;
        continue;
      }
    }
    
    console.log("月ヘッダー行:", monthHeaderRow);
    console.log("常用労働者数行:", regularEmployeesRow);
    console.log("障がい者雇用者数行:", disabledEmployeesRow);
    
    // 月次データを取得 - 必ず数値型として処理
    for (let i = 1; i < monthHeaderRow.length; i++) {
      const monthCell = monthHeaderRow[i] ? monthHeaderRow[i].trim() : '';
      if (monthCell && monthMap[monthCell]) {
        const monthKey = monthMap[monthCell];
        
        // 常用労働者数
        if (regularEmployeesRow.length > i) {
          const cellValue = regularEmployeesRow[i] ? regularEmployeesRow[i].trim() : '';
          const value = cellValue ? parseFloat(cellValue) : 0;
          totalRegularEmployees[monthKey] = isNaN(value) ? 0 : value;
        }
        
        // 障がい者雇用者数
        if (disabledEmployeesRow.length > i) {
          const cellValue = disabledEmployeesRow[i] ? disabledEmployeesRow[i].trim() : '';
          const value = cellValue ? parseFloat(cellValue) : 0;
          disabledEmployees[monthKey] = isNaN(value) ? 0 : value;
        }
      }
    }
    
    // 不足している月のデータを0で初期化
    const monthKeys = [
      'april', 'may', 'june', 'july', 'august', 'september',
      'october', 'november', 'december', 'january', 'february', 'march'
    ];
    
    monthKeys.forEach(month => {
      if (totalRegularEmployees[month] === undefined) {
        totalRegularEmployees[month] = 0;
      }
      if (disabledEmployees[month] === undefined) {
        disabledEmployees[month] = 0;
      }
    });
    
    // データのバリデーション
    const hasData = Object.values(totalRegularEmployees).some(v => v > 0) || 
                   Object.values(disabledEmployees).some(v => v > 0);
                   
    if (!hasData) {
      throw new Error("CSVからデータを抽出できませんでした。ファイル形式を確認してください。");
    }
    
    return {
      year,
      totalRegularEmployees,
      disabledEmployees
    };
  };

  // スタイル設定
  return (
    <div style={{ 
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      width: '80%',
      maxWidth: '500px',
      zIndex: 1000
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        marginBottom: '20px',
        color: '#4361ee',
        textAlign: 'center'
      }}>
        月別データのインポート
      </h3>
      
      {importError && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '8px 12px', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {importError}
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleDownloadTemplate}
          style={{ 
            padding: '10px',
            backgroundColor: '#4361ee',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          disabled={importing}
        >
          インポートテンプレートをダウンロード
        </button>
        
        <button
          onClick={handleFileSelect}
          style={{ 
            padding: '10px',
            backgroundColor: '#f1f1f1',
            border: '1px solid #ddd',
            color: '#333333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          disabled={importing}
        >
          {importing ? 'インポート中...' : 'CSVファイルを選択'}
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            style={{ 
              padding: '8px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px',
              alignSelf: 'flex-end'
            }}
            disabled={importing}
          >
            閉じる
          </button>
        )}
      </div>
    </div>
  );
};

const MonthlyDataTab: React.FC<MonthlyDataTabProps> = ({ fiscalYear, reportData }) => {
  // 設定値
  const [subsidyAmount, setSubsidyAmount] = useState<number>(27000); // 調整金額（デフォルト: 27,000円/人・月）
  const [paymentAmount, setPaymentAmount] = useState<number>(50000); // 納付金額（デフォルト: 50,000円/人・月）
  const [legalRate, setLegalRate] = useState<number>(2.3); // 法定雇用率
  
  // 法定雇用率
  const LEGAL_EMPLOYMENT_RATE = legalRate; // 2.3%
  
  // コンポーネントの先頭で定数として定義
  const defaultMonthlyData = [
    { month: '4月', employees: 0, disabledEmployees: 0 },
    { month: '5月', employees: 0, disabledEmployees: 0 },
    { month: '6月', employees: 0, disabledEmployees: 0 },
    { month: '7月', employees: 0, disabledEmployees: 0 },
    { month: '8月', employees: 0, disabledEmployees: 0 },
    { month: '9月', employees: 0, disabledEmployees: 0 },
    { month: '10月', employees: 0, disabledEmployees: 0 },
    { month: '11月', employees: 0, disabledEmployees: 0 },
    { month: '12月', employees: 0, disabledEmployees: 0 },
    { month: '1月', employees: 0, disabledEmployees: 0 },
    { month: '2月', employees: 0, disabledEmployees: 0 },
    { month: '3月', employees: 0, disabledEmployees: 0 }
  ];
  
  // API連携用の状態
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // CSVインポート関連の状態
  const [showImport, setShowImport] = useState(false);
  
  // 月別データ
  const [monthlyData, setMonthlyData] = useState([
    { month: '4月', employees: 510, disabledEmployees: 13 },
    { month: '5月', employees: 515, disabledEmployees: 13 },
    { month: '6月', employees: 520, disabledEmployees: 14 },
    { month: '7月', employees: 523, disabledEmployees: 15 },
    { month: '8月', employees: 525, disabledEmployees: 15 },
    { month: '9月', employees: 530, disabledEmployees: 15 },
    { month: '10月', employees: 528, disabledEmployees: 14 },
    { month: '11月', employees: 527, disabledEmployees: 14 },
    { month: '12月', employees: 520, disabledEmployees: 13 },
    { month: '1月', employees: 515, disabledEmployees: 13 },
    { month: '2月', employees: 510, disabledEmployees: 12 },
    { month: '3月', employees: 505, disabledEmployees: 12 }
  ]);
  
  // 年度数値を取得する
  const getYearValue = () => {
    if (fiscalYear.includes('年度')) {
      return parseInt(fiscalYear.replace('年度', ''));
    }
    return new Date().getFullYear();
  };

  // 設定を読み込む
  const loadSettings = async () => {
    try {
      // 設定APIが実装されていない場合のフォールバック
      try {
        // 会社設定を取得
        const settings = await settingsApi.getCompanySettings();
        console.log('取得した設定:', settings);
        
        if (settings) {
          // 設定オブジェクトを型安全に扱うため、any型にキャスト
          const anySettings = settings as any;
          
          // 各設定値を取得（プロパティが存在しない場合はデフォルト値を使用）
          const subsidyAmountValue = anySettings.subsidyAmount || 
                                    (anySettings.paymentReport && anySettings.paymentReport.subsidyAmount) || 
                                    27000;
          
          const paymentAmountValue = anySettings.paymentAmount || 
                                    (anySettings.paymentReport && anySettings.paymentReport.paymentAmount) || 
                                    50000;
          
          const legalRateValue = anySettings.legalRate || 
                                (anySettings.paymentReport && anySettings.paymentReport.legalRate) || 
                                2.3;
          
          // 状態を更新
          setSubsidyAmount(subsidyAmountValue);
          setPaymentAmount(paymentAmountValue);
          setLegalRate(legalRateValue);
          
          console.log('設定を適用しました:', {
            subsidyAmount: subsidyAmountValue,
            paymentAmount: paymentAmountValue,
            legalRate: legalRateValue
          });
        }
      } catch (settingsError) {
        // 設定APIがない場合は静かに失敗させる
        console.log('会社設定は利用できません。デフォルト値を使用します。');
        // デフォルト設定を使用
      }
    } catch (error) {
      // その他のエラーは記録するだけ
      console.error('設定の読み込みに失敗しました:', error);
    }
  };
  
  // 標準形式のデータを処理する関数
  const processStandardFormat = (monthlyData: any) => {
    const months = [
      '4月', '5月', '6月', '7月', '8月', '9月', 
      '10月', '11月', '12月', '1月', '2月', '3月'
    ];
    const monthKeys = [
      'april', 'may', 'june', 'july', 'august', 'september',
      'october', 'november', 'december', 'january', 'february', 'march'
    ];
    
    console.log('標準形式のデータを処理します');
    
    return months.map((month, index) => {
      const key = monthKeys[index];
      // 数値型を確実に維持する
      const employeeValue = monthlyData.totalRegularEmployees?.[key];
      const disabledValue = monthlyData.disabledEmployees?.[key];
      
      // 数値に変換（文字列の場合も変換、NaNの場合は0に）
      const employees = typeof employeeValue === 'number' ? employeeValue : 
                        (employeeValue ? parseFloat(employeeValue) : 0);
      const disabledEmployees = typeof disabledValue === 'number' ? disabledValue : 
                              (disabledValue ? parseFloat(disabledValue) : 0);
                              
      return {
        month: month,
        employees: isNaN(employees) ? 0 : employees,
        disabledEmployees: isNaN(disabledEmployees) ? 0 : disabledEmployees
      };
    });
  };
  
  // シンプル形式のデータを処理する関数（すべての月で同じ値）
  const processSimpleFormat = (totalEmployees: any, disabledEmployees: any) => {
    const months = [
      '4月', '5月', '6月', '7月', '8月', '9月', 
      '10月', '11月', '12月', '1月', '2月', '3月'
    ];
    
    // 数値型に正しく変換
    const employeesValue = typeof totalEmployees === 'number' ? totalEmployees : 
                          (totalEmployees ? parseFloat(String(totalEmployees)) : 0);
    
    const disabledValue = typeof disabledEmployees === 'number' ? disabledEmployees : 
                         (disabledEmployees ? parseFloat(String(disabledEmployees)) : 0);
    
    console.log('シンプル形式のデータを処理します', { 
      totalEmployees: employeesValue, 
      disabledEmployees: disabledValue 
    });
    
    // すべての月で同じ値を使用
    return months.map(month => ({
      month,
      employees: isNaN(employeesValue) ? 0 : employeesValue,
      disabledEmployees: isNaN(disabledValue) ? 0 : disabledValue
    }));
  };
  
  // フィールド直接アクセスの形式を処理する関数
  const processDirectFields = (data: any) => {
    const months = [
      '4月', '5月', '6月', '7月', '8月', '9月', 
      '10月', '11月', '12月', '1月', '2月', '3月'
    ];
    const monthKeys = [
      'april', 'may', 'june', 'july', 'august', 'september',
      'october', 'november', 'december', 'january', 'february', 'march'
    ];
    
    console.log('フィールド直接アクセス形式のデータを処理します');
    
    return months.map((month, index) => {
      const key = monthKeys[index];
      // 数値型を確実に維持する
      const employeeField = `employees_${key}`;
      const disabledField = `disabled_${key}`;
      
      // 数値に変換
      const employees = data[employeeField] ? parseFloat(data[employeeField]) : 0;
      const disabledEmployees = data[disabledField] ? parseFloat(data[disabledField]) : 0;
      
      return {
        month: month,
        employees: isNaN(employees) ? 0 : employees,
        disabledEmployees: isNaN(disabledEmployees) ? 0 : disabledEmployees
      };
    });
  };
  
  // 適応的なデータ処理関数を追加
  const adaptiveProcessMonthlyData = (data: any) => {
    console.log('適応的データ処理を開始:', data);
    
    // データなしの場合
    if (!data) {
      console.warn('データがありません');
      return defaultMonthlyData;
    }
    
    try {
      // シンプル形式の確認（total_employeesとdisabled_employeesが存在する）
      if (data.total_employees !== undefined && data.disabled_employees !== undefined) {
        console.log('シンプル形式のデータを処理します', {
          totalEmployees: data.total_employees,
          disabledEmployees: data.disabled_employees
        });
        
        // すべての月で同じ値を使用
        return processSimpleFormat(data.total_employees, data.disabled_employees);
      }
      
      // monthly_dataの確認（文字列かオブジェクト）
      let monthlyDataObj: any = null;
      
      if (data.monthly_data) {
        if (typeof data.monthly_data === 'string') {
          try {
            monthlyDataObj = JSON.parse(data.monthly_data);
            console.log('monthly_data (文字列)をパースしました:', monthlyDataObj);
          } catch (e) {
            console.error('monthly_dataのJSON解析エラー:', e);
          }
        } else if (typeof data.monthly_data === 'object') {
          monthlyDataObj = data.monthly_data;
          console.log('monthly_data (オブジェクト)を取得しました:', monthlyDataObj);
        }
        
        // 標準形式のチェック
        if (monthlyDataObj && 
            (monthlyDataObj.totalRegularEmployees || monthlyDataObj.disabledEmployees)) {
          console.log('標準形式のデータを処理します');
          
          // 月次データがある場合は標準形式処理
          return processStandardFormat(monthlyDataObj);
        }
      }
      
      // 上記のいずれにも該当しない場合はデフォルト値を返す
      console.log('認識できるデータ構造ではありません。デフォルト値を使用します。');
      console.log('データ構造:', {
        hasMonthlyData: !!data.monthly_data,
        monthlyDataType: typeof data.monthly_data,
        hasTotal: !!data.total_employees,
        hasDisabled: !!data.disabled_employees
      });
      
      // デフォルト値を返す
      return defaultMonthlyData;
      
    } catch (error) {
      console.error('データ処理エラー:', error);
      return defaultMonthlyData;
    }
  };
  
  // データ処理関数を修正
  const processReportData = (data: any) => {
    if (!data) {
      console.warn('データがありません');
      setMonthlyData(defaultMonthlyData);
      setLoading(false); // ローディング状態を解除
      return;
    }
    
    try {
      console.log('データ処理開始:', data);
      
      let monthlyDataObj: any = null;
      
      // 1. monthly_data がJSON文字列の場合
      if (data.monthly_data && typeof data.monthly_data === 'string') {
        try {
          monthlyDataObj = JSON.parse(data.monthly_data);
          console.log('monthly_data (文字列)をパースしました:', monthlyDataObj);
        } catch (e) {
          console.error('monthly_dataのJSON解析エラー:', e);
        }
      }
      // 2. monthly_data がオブジェクトの場合
      else if (data.monthly_data && typeof data.monthly_data === 'object') {
        monthlyDataObj = data.monthly_data;
        console.log('monthly_data (オブジェクト)を取得しました:', monthlyDataObj);
      }
      
      // 月次データが見つかった場合の処理
      if (monthlyDataObj && 
          ((monthlyDataObj.totalRegularEmployees && Object.keys(monthlyDataObj.totalRegularEmployees).length > 0) ||
           (monthlyDataObj.disabledEmployees && Object.keys(monthlyDataObj.disabledEmployees).length > 0))) {
        
        console.log('有効な月次データを検出しました');
        
        const months = [
          '4月', '5月', '6月', '7月', '8月', '9月', 
          '10月', '11月', '12月', '1月', '2月', '3月'
        ];
        const monthKeys = [
          'april', 'may', 'june', 'july', 'august', 'september',
          'october', 'november', 'december', 'january', 'february', 'march'
        ];
        
        const formattedData = months.map((month, index) => {
          const key = monthKeys[index];
          
          // 数値型を確実に維持する
          const employeeValue = monthlyDataObj?.totalRegularEmployees?.[key];
          const disabledValue = monthlyDataObj?.disabledEmployees?.[key];
          
          // 数値に変換
          const employees = typeof employeeValue === 'number' ? employeeValue : 
                          (employeeValue ? parseFloat(String(employeeValue)) : 0);
          const disabledEmployees = typeof disabledValue === 'number' ? disabledValue : 
                                 (disabledValue ? parseFloat(String(disabledValue)) : 0);
          
          return {
            month: month,
            employees: isNaN(employees) ? 0 : employees,
            disabledEmployees: isNaN(disabledEmployees) ? 0 : disabledEmployees
          };
        });
        
        console.log('フォーマット済み月次データ:', formattedData);
        setMonthlyData(formattedData);
        setLoading(false); // ここでローディング状態を解除
        return;
      }
      
      // 代替データ構造の確認
      if (data.total_employees !== undefined && data.disabled_employees !== undefined) {
        console.log('シンプル形式のデータを処理します', {
          totalEmployees: data.total_employees,
          disabledEmployees: data.disabled_employees
        });
        
        // 数値型を確実に維持する
        const totalEmployees = typeof data.total_employees === 'number' ? data.total_employees : 
                             (data.total_employees ? parseFloat(String(data.total_employees)) : 0);
        
        const disabledEmployees = typeof data.disabled_employees === 'number' ? data.disabled_employees : 
                                (data.disabled_employees ? parseFloat(String(data.disabled_employees)) : 0);
        
        // すべての月で同じ値を使用
        const formattedData = defaultMonthlyData.map(item => ({
          ...item,
          employees: isNaN(totalEmployees) ? 0 : totalEmployees,
          disabledEmployees: isNaN(disabledEmployees) ? 0 : disabledEmployees
        }));
        
        setMonthlyData(formattedData);
        setLoading(false); // ここでローディング状態を解除
        return;
      }
      
      // 適応的な処理を試みる
      const adaptiveData = adaptiveProcessMonthlyData(data);
      setMonthlyData(adaptiveData);
      
      // 処理の最後でローディング状態を解除
      setLoading(false);
      
    } catch (error) {
      console.error('データ処理エラー:', error);
      setMonthlyData(defaultMonthlyData);
      setLoading(false); // エラー時もローディング状態を解除
    }
  };
  
  // API からデータを取得する関数
  const fetchPaymentReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const year = getYearValue();
      const report = await paymentReportApi.getPaymentReport(year);
      
      // データ処理関数を呼び出し
      processReportData(report);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '月次データの取得に失敗しました');
      console.error('月次データの取得エラー:', err);
      
      // データがない場合はデフォルト値を使用
      setMonthlyData(defaultMonthlyData);
    }
  };
  
  // 初期処理
  useEffect(() => {
    // 設定を読み込む
    loadSettings();
    
    // データ読み込み
    console.log('MonthlyDataTab: fiscalYear/reportData変更検知', fiscalYear, reportData);
    
    if (reportData) {
      console.log('親コンポーネントから受け取ったデータを処理します:', reportData);
      setLoading(true); // 親コンポーネントからのデータ処理中もローディング状態に
      processReportData(reportData);
      return; // reportData が存在する場合は API 呼び出しをスキップ
    }
    
    // reportData がない場合のみ API 呼び出し
    console.log('MonthlyDataTab: APIからデータを取得します', fiscalYear);
    fetchPaymentReport();
  }, [fiscalYear, reportData]);
  
  // 月別のデータを計算
  const calculatedData = useMemo(() => {
    return monthlyData.map(item => {
      // 数値型を確実に維持する
      const employees = typeof item.employees === 'number' ? item.employees : 
                       (item.employees ? parseFloat(String(item.employees)) : 0);
      
      const disabledEmployees = typeof item.disabledEmployees === 'number' ? item.disabledEmployees : 
                               (item.disabledEmployees ? parseFloat(String(item.disabledEmployees)) : 0);
      
      // 実雇用率 = 障害者雇用数 / 常用労働者数 * 100
      const employmentRate = employees > 0 
        ? (disabledEmployees / employees) * 100
        : 0;
      
      // 必要雇用数 = 常用労働者数 * 法定雇用率 / 100
      const requiredEmployees = Math.floor(employees * LEGAL_EMPLOYMENT_RATE / 100);
      
      // 超過・未達 = 障害者雇用数 - 必要雇用数
      const difference = disabledEmployees - requiredEmployees;
      
      // 調整金・納付金（設定値から計算）
      const payment = difference >= 0 
        ? difference * subsidyAmount  // 調整金（プラス）
        : difference * paymentAmount; // 納付金（マイナス）
      
      return {
        ...item,
        employees,
        disabledEmployees,
        employmentRate,
        requiredEmployees,
        difference,
        payment
      };
    });
  }, [monthlyData, LEGAL_EMPLOYMENT_RATE, subsidyAmount, paymentAmount]);
  
  // 合計値を計算
  const totals = useMemo(() => {
    // 数値の合計を確実に計算するためのヘルパー関数
    const sumNumericValues = (values: any[]) => {
      return values.reduce((sum, value) => {
        const numValue = typeof value === 'number' ? value : 
                        (value ? parseFloat(String(value)) : 0);
        return sum + (isNaN(numValue) ? 0 : numValue);
      }, 0);
    };
    
    const employeesArray = monthlyData.map(item => item.employees);
    const disabledArray = monthlyData.map(item => item.disabledEmployees);
    const requiredArray = calculatedData.map(item => item.requiredEmployees);
    
    const totalEmployees = sumNumericValues(employeesArray);
    const totalDisabled = sumNumericValues(disabledArray);
    const totalRequiredEmployees = sumNumericValues(requiredArray);
    
    const totalDifference = totalDisabled - totalRequiredEmployees;
    
    // 合計金額を計算（各月の調整金/納付金合計）
    const totalPayment = calculatedData.reduce((sum, item) => sum + item.payment, 0);
    
    return {
      totalEmployees,
      totalDisabled,
      totalRequiredEmployees,
      totalDifference,
      totalPayment
    };
  }, [calculatedData, monthlyData]);
  
  // 金額の表示フォーマット
  const formatNumber = (num: number) => {
    // NaNの場合は0として表示
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  };

  // 平均従業員数を計算するヘルパー関数
  const calculateAverageEmployees = (monthlyData: {[key: string]: number}) => {
    const values = Object.values(monthlyData);
    if (values.length === 0) return 0;
    
    // NaNを除外した有効な値の平均を計算
    const validValues = values.filter(v => !isNaN(v) && v !== null && v !== undefined);
    if (validValues.length === 0) return 0;
    
    const sum = validValues.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
    return sum / validValues.length;
  };

  // インポート完了ハンドラ
  const handleImportComplete = (importedData: any) => {
    console.log('インポート完了', importedData);
    
    // データのバリデーション
    if (!importedData) {
      console.error('インポートデータが空です');
      alert('インポートデータが無効です。CSVファイルの内容を確認してください。');
      return;
    }
    
    if (!importedData.totalRegularEmployees || !importedData.disabledEmployees) {
      console.error('インポートデータに必要なフィールドがありません:', importedData);
      alert('インポートデータに常用労働者数または障がい者雇用者数がありません。CSVファイルの内容を確認してください。');
      return;
    }
    
    if (Object.keys(importedData.totalRegularEmployees).length === 0 || 
        Object.keys(importedData.disabledEmployees).length === 0) {
      console.error('インポートデータのフィールドが空です:', importedData);
      alert('インポートデータに月別の数値データがありません。CSVファイルの内容を確認してください。');
      return;
    }
    
    console.log('インポートデータの検証に成功しました:', importedData);
    
    // 月別データの変換
    const months = [
      '4月', '5月', '6月', '7月', '8月', '9月', 
      '10月', '11月', '12月', '1月', '2月', '3月'
    ];
    const monthKeys = [
      'april', 'may', 'june', 'july', 'august', 'september',
      'october', 'november', 'december', 'january', 'february', 'march'
    ];
    
    const formattedData = months.map((month, index) => {
      const key = monthKeys[index];
      
      // 数値型を確実に維持する
      const employeeValue = importedData.totalRegularEmployees[key];
      const disabledValue = importedData.disabledEmployees[key];
      
      // 数値変換（NaNをチェック）
      const employees = typeof employeeValue === 'number' ? employeeValue : 
                       (employeeValue ? parseFloat(String(employeeValue)) : 0);
      const disabledEmployees = typeof disabledValue === 'number' ? disabledValue : 
                              (disabledValue ? parseFloat(String(disabledValue)) : 0);
      
      return {
        month: month,
        employees: isNaN(employees) ? 0 : employees,
        disabledEmployees: isNaN(disabledEmployees) ? 0 : disabledEmployees
      };
    });
    
    console.log('CSVから生成した表示データ:', formattedData);
    
    // 画面表示を更新
    setMonthlyData(formattedData);
    
    // データを保存
    saveImportedData(importedData);
  };
  
  // 数値を安全に変換するヘルパー関数（NaNをチェック）
  const safeParseFloat = (value: any): string => {
    if (value === null || value === undefined) return '0.0';
    
    // 数値型の場合
    if (typeof value === 'number') {
      return isNaN(value) ? '0.0' : value.toFixed(1);
    }
    
    // 文字列や他の型の場合
    const parsedValue = parseFloat(String(value));
    if (isNaN(parsedValue)) {
      return '0.0';
    }
    return parsedValue.toFixed(1); // 小数点1桁で表示
  };
  
  // インポートしたデータを保存する関数
  const saveImportedData = async (importedData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // 年度を取得
      const year = importedData.year;
      console.log('保存するデータ準備:', importedData);
      
      // 既存のレポートデータを取得
      let existingData: any = null;
      try {
        existingData = await paymentReportApi.getPaymentReport(year);
        console.log('既存データ:', existingData);
      } catch (error) {
        console.log('既存データなし、新規作成します');
      }
      
      // 月次データから平均値を計算
      const avgTotalEmployees = calculateAverageEmployees(importedData.totalRegularEmployees);
      const avgDisabledEmployees = calculateAverageEmployees(importedData.disabledEmployees);
      
      console.log('計算した平均値:', {
        avgTotalEmployees,
        avgDisabledEmployees
      });
      
      // APIに送信するデータを構築
      const paymentReportData = {
        // 既存データの情報を引き継ぐ (ただし上書きしたいフィールドは除く)
        ...(existingData || {}),
        
        // 基本プロパティを更新
        year,
        fiscal_year: year,
        
        // 計算した平均値で上書き（必ず数値型で保存）
        total_employees: Number(avgTotalEmployees),
        disabled_employees: Number(avgDisabledEmployees),
        average_employee_count: Number(avgTotalEmployees),
        actual_employment_count: Number(avgDisabledEmployees),
        
        // 実雇用率を再計算
        employment_rate: avgTotalEmployees > 0 ? (avgDisabledEmployees / avgTotalEmployees * 100) : 0,
        
        // 月次データを直接オブジェクトとして設定（文字列ではなく）
        monthly_data: importedData
      };
      
      // IDフィールドを削除（新規作成対応）
      if ('id' in paymentReportData) {
        delete paymentReportData.id;
      }
      
      // 画面表示用に月次データを更新
      const formattedData = processStandardFormat(importedData);
      setMonthlyData(formattedData);
      
      console.log('送信するデータ:', paymentReportData);
      
      // APIでデータを保存
      const savedData = await paymentReportApi.savePaymentReport(year, paymentReportData);
      console.log('保存されたデータ:', savedData);
      
      setLoading(false);
      alert('月別データを保存しました。');
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '月別データの保存に失敗しました');
      console.error('月別データの保存エラー:', err);
    }
  };
  
  // インポートモーダルを閉じる
  const handleCloseImport = () => {
    setShowImport(false);
  };

  return (
    <div style={{ padding: '0', marginTop: '1rem' }}>
      {/* ヘッダー部分にCSVインポートボタンを追加 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0 }}>月別データ ({fiscalYear})</h3>
        <button 
          onClick={() => setShowImport(true)}
          style={{ 
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '8px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          CSVインポート
        </button>
      </div>
      
      {loading && (
        <div style={{ 
          padding: '12px', 
          textAlign: 'center', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          データを読み込み中...
        </div>
      )}
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '8px 12px', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
              <th style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6', 
                whiteSpace: 'nowrap',
                width: '150px', // 項目列の幅を固定
                height: '36px' // 高さを固定
              }}>項目</th>
              {monthlyData.map((item, idx) => (
                <th key={`month-header-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  fontWeight: 'normal', 
                  backgroundColor: '#f8f9fa', 
                  borderBottom: '1px solid #dee2e6', 
                  whiteSpace: 'nowrap',
                  width: '60px', // 各月の列幅を固定
                  height: '36px' // 高さを固定
                }}>
                  {item.month}
                </th>
              ))}
              <th style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6', 
                whiteSpace: 'nowrap',
                width: '80px', // 合計列の幅を固定（少し広め）
                height: '36px' // 高さを固定
              }}>
                合計
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 常用労働者数の行 */}
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6',
                height: '36px' // 高さを固定
              }}>
                常用労働者数(人)
              </td>
              {calculatedData.map((item, idx) => (
                <td key={`employees-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6',
                  height: '36px' // 高さを固定
                }}>
                  {formatNumber(item.employees)}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold',
                height: '36px' // 高さを固定
              }}>
                {formatNumber(totals.totalEmployees)}
              </td>
            </tr>
            
            {/* 障がい者雇用者数の行 */}
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6',
                height: '36px' // 高さを固定
              }}>
                障がい者雇用者数(人)
              </td>
              {calculatedData.map((item, idx) => (
                <td key={`disabled-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6',
                  height: '36px' // 高さを固定
                }}>
                  {/* 小数点以下を表示するが、0なら小数点以下を表示しない */}
                  {item.disabledEmployees % 1 === 0 
                    ? Math.floor(item.disabledEmployees) 
                    : item.disabledEmployees.toFixed(1)}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold',
                height: '36px' // 高さを固定
              }}>
                {/* 小数点以下を表示するが、0なら小数点以下を表示しない */}
                {totals.totalDisabled % 1 === 0 
                  ? Math.floor(totals.totalDisabled) 
                  : totals.totalDisabled.toFixed(1)}
              </td>
            </tr>
            
            {/* 超過・未達の行 */}
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6',
                height: '36px' // 高さを固定
              }}>
                超過・未達(人)
              </td>
              {calculatedData.map((item, idx) => (
                <td key={`difference-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6',
                  color: item.difference < 0 ? '#dc3545' : 'inherit',
                  height: '36px' // 高さを固定
                }}>
                  {/* 小数点以下を表示するが、0なら小数点以下を表示しない */}
                  {item.difference > 0 
                    ? '+' + (item.difference % 1 === 0 ? Math.floor(item.difference) : item.difference.toFixed(1))
                    : (item.difference % 1 === 0 ? Math.floor(item.difference) : item.difference.toFixed(1))}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold',
                color: totals.totalDifference < 0 ? '#dc3545' : 'inherit',
                height: '36px' // 高さを固定
              }}>
                {/* 小数点以下を表示するが、0なら小数点以下を表示しない */}
                {totals.totalDifference > 0 
                  ? '+' + (totals.totalDifference % 1 === 0 ? Math.floor(totals.totalDifference) : totals.totalDifference.toFixed(1))
                  : (totals.totalDifference % 1 === 0 ? Math.floor(totals.totalDifference) : totals.totalDifference.toFixed(1))}
              </td>
            </tr>
            
            {/* 調整金・納付金の行 */}
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6',
                height: '36px' // 高さを固定
              }}>
                調整金・納付金(円)
              </td>
              {calculatedData.map((item, idx) => (
                <td key={`payment-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6',
                  color: item.payment < 0 ? '#dc3545' : '#28a745',
                  height: '36px' // 高さを固定
                }}>
                  {formatNumber(item.payment)}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold',
                color: totals.totalPayment < 0 ? '#dc3545' : '#28a745',
                height: '36px' // 高さを固定
              }}>
                {formatNumber(totals.totalPayment)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* インポートモーダルのオーバーレイ */}
      {showImport && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 50
        }}>
          <MonthlyDataImport 
            onImportComplete={handleImportComplete}
            onClose={handleCloseImport}
            currentYear={getYearValue()} // 年度を渡す
          />
        </div>
      )}
    </div>
  );
};

export default MonthlyDataTab;