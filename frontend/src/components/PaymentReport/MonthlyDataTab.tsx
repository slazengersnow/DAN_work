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
      const templateContent = `年度,${currentYear},,,,,,,,,,,,
,4月,5月,6月,7月,8月,9月,10月,11月,12月,1月,2月,3月,
常勤雇用労働者数,510,515,520,523,525,530,528,527,520,515,510,505,
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
      URL.revokeObjectURL(url);
      console.log('月別データテンプレートをダウンロードしました');
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

  // CSVをパースする関数 - 年度取得用の関数を引数として受け取る
  const parseMonthlyCSV = (csvContent: string, yearGetter: () => number) => {
    // BOMを除去する
    const content = csvContent.replace(/^\uFEFF/, '');
    
    // 行に分割
    const rows = content.split(/\r?\n/).filter(row => row.trim() !== '');
    
    // ヘッダー行を取得
    const headers = rows[0].split(',');
    
    // データ行をパース
    const data = rows.slice(1).map(row => {
      const rowValues = row.split(',');
      const record: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        // ヘッダーに対応する値を設定
        const strValue = rowValues[index] ? rowValues[index].trim() : '';
        
        // 数値に変換（常用労働者数、障がい者雇用者数）
        if (header === '常用労働者数' || header === '障がい者雇用者数' || 
            header === '常勤雇用労働者数') {
          record[header] = strValue ? parseInt(strValue, 10) : 0;
        } else {
          record[header] = strValue;
        }
      });
      
      return record;
    });
    
    console.log("パースしたCSVデータ:", data);
    
    // 月別データの形式に変換
    const monthMap: { [key: string]: string } = {
      '4月': 'april', '5月': 'may', '6月': 'june', '7月': 'july', 
      '8月': 'august', '9月': 'september', '10月': 'october', '11月': 'november', 
      '12月': 'december', '1月': 'january', '2月': 'february', '3月': 'march'
    };
    
    // API向けのデータ形式に変換
    const totalRegularEmployees: { [key: string]: number } = {};
    const disabledEmployees: { [key: string]: number } = {};
    
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key.trim() === '') {
          const month = item[key]; // 月の値
          if (month && monthMap[month]) {
            const monthKey = monthMap[month];
            // このアプローチは値を直接取得できないため修正
            // 対応する行と列のデータを取得する別の方法を使用
          }
        }
      });
      
      // 行ベースの処理も実行
      const month = item['月'];
      if (month && monthMap[month]) {
        const monthKey = monthMap[month];
        totalRegularEmployees[monthKey] = Number(item['常用労働者数'] || item['常勤雇用労働者数']) || 0;
        disabledEmployees[monthKey] = Number(item['障がい者雇用者数']) || 0;
      }
    });
    
    // 月次データが入力されていることを確認
    if (Object.keys(totalRegularEmployees).length === 0 || Object.keys(disabledEmployees).length === 0) {
      console.warn("月次データが不足しています。テンプレート形式を確認してください。");
      
      // 代替方法で取得を試みる
      for (let i = 1; i < rows.length; i++) {
        const rowValues = rows[i].split(',');
        if (rowValues[0] && (rowValues[0].includes('常勤雇用労働者数') || rowValues[0].includes('常用労働者数'))) {
          // 行の先頭が常用労働者数の場合、月ごとのデータを格納
          const monthKeys = [
            'april', 'may', 'june', 'july', 'august', 'september',
            'october', 'november', 'december', 'january', 'february', 'march'
          ];
          
          for (let j = 1; j <= 12; j++) {
            if (j < rowValues.length && rowValues[j].trim() !== '') {
              totalRegularEmployees[monthKeys[j-1]] = Number(rowValues[j]) || 0;
            }
          }
        } else if (rowValues[0] && rowValues[0].includes('障がい者雇用者数')) {
          // 行の先頭が障がい者雇用者数の場合、月ごとのデータを格納
          const monthKeys = [
            'april', 'may', 'june', 'july', 'august', 'september',
            'october', 'november', 'december', 'january', 'february', 'march'
          ];
          
          for (let j = 1; j <= 12; j++) {
            if (j < rowValues.length && rowValues[j].trim() !== '') {
              disabledEmployees[monthKeys[j-1]] = Number(rowValues[j]) || 0;
            }
          }
        }
      }
    }
    
    // 確認のためデータをログ出力
    console.log("変換後のデータ:", { totalRegularEmployees, disabledEmployees });
    
    return {
      year: yearGetter(), // 渡された関数を使用して年度を取得
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
        // デフォルト設定を使った処理...
      }
    } catch (error) {
      // その他の致命的なエラーのみログに記録
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
      return {
        month: month,
        employees: monthlyData.totalRegularEmployees?.[key] || 0,
        disabledEmployees: monthlyData.disabledEmployees?.[key] || 0
      };
    });
  };
  
  // シンプル形式のデータを処理する関数（すべての月で同じ値）
  const processSimpleFormat = (totalEmployees: number, disabledEmployees: number) => {
    const months = [
      '4月', '5月', '6月', '7月', '8月', '9月', 
      '10月', '11月', '12月', '1月', '2月', '3月'
    ];
    
    console.log('シンプル形式のデータを処理します', { totalEmployees, disabledEmployees });
    
    // すべての月で同じ値を使用
    return months.map(month => ({
      month,
      employees: totalEmployees,
      disabledEmployees: disabledEmployees
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
      return {
        month: month,
        employees: data[`employees_${key}`] || 0,
        disabledEmployees: data[`disabled_${key}`] || 0
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
      // 複数の可能なデータ構造をチェック
      
      // ケース1: 標準形式の月次データ
      if (data.monthly_data) {
        const monthlyDataObj = typeof data.monthly_data === 'string' 
          ? JSON.parse(data.monthly_data)
          : data.monthly_data;
        
        if (monthlyDataObj && monthlyDataObj.totalRegularEmployees && monthlyDataObj.disabledEmployees) {
          // 標準形式処理
          return processStandardFormat(monthlyDataObj);
        }
      }
      
      // ケース2: フラットな構造の月次データ
      if (data.total_employees && data.disabled_employees) {
        // フラット構造処理 (すべての月で同じ値)
        return processSimpleFormat(data.total_employees, data.disabled_employees);
      }
      
      // ケース3: フィールド直接アクセス
      const monthKeys = ['april', 'may', 'june', 'july', 'august', 'september',
                        'october', 'november', 'december', 'january', 'february', 'march'];
      
      const hasDirectMonthFields = monthKeys.some(key => 
        data[`employees_${key}`] !== undefined || data[`disabled_${key}`] !== undefined
      );
      
      if (hasDirectMonthFields) {
        // 直接フィールドアクセス処理
        return processDirectFields(data);
      }
      
      // どの形式にも当てはまらない場合はデフォルト値を使用
      console.warn('認識できるデータ構造ではありません。デフォルト値を使用します。');
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
          return {
            month: month,
            employees: monthlyDataObj?.totalRegularEmployees?.[key] || 0,
            disabledEmployees: monthlyDataObj?.disabledEmployees?.[key] || 0
          };
        });
        
        console.log('フォーマット済み月次データ:', formattedData);
        setMonthlyData(formattedData);
        return;
      }
      
      // 代替データ構造の確認
      if (data.total_employees && data.disabled_employees) {
        console.log('シンプル形式のデータを処理します', {
          totalEmployees: data.total_employees,
          disabledEmployees: data.disabled_employees
        });
        
        // すべての月で同じ値を使用
        const formattedData = defaultMonthlyData.map(item => ({
          ...item,
          employees: data.total_employees,
          disabledEmployees: data.disabled_employees
        }));
        
        setMonthlyData(formattedData);
        return;
      }
      
      // 適応的な処理を試みる
      const adaptiveData = adaptiveProcessMonthlyData(data);
      setMonthlyData(adaptiveData);
      
    } catch (error) {
      console.error('データ処理エラー:', error);
      setMonthlyData(defaultMonthlyData);
    }
    
    // いずれの場合もローディング状態を解除
    setLoading(false);
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
      // 実雇用率 = 障害者雇用数 / 常用労働者数 * 100
      const employmentRate = item.employees > 0 
        ? (item.disabledEmployees / item.employees) * 100
        : 0;
      
      // 必要雇用数 = 常用労働者数 * 法定雇用率 / 100
      const requiredEmployees = Math.floor(item.employees * LEGAL_EMPLOYMENT_RATE / 100);
      
      // 超過・未達 = 障害者雇用数 - 必要雇用数
      const difference = item.disabledEmployees - requiredEmployees;
      
      // 調整金・納付金（設定値から計算）
      const payment = difference >= 0 
        ? difference * subsidyAmount  // 調整金（プラス）
        : difference * paymentAmount; // 納付金（マイナス）
      
      return {
        ...item,
        employmentRate,
        requiredEmployees,
        difference,
        payment
      };
    });
  }, [monthlyData, LEGAL_EMPLOYMENT_RATE, subsidyAmount, paymentAmount]);
  
  // 合計値を計算
  const totals = useMemo(() => {
    const totalEmployees = monthlyData.reduce((sum, item) => sum + item.employees, 0);
    const totalDisabled = monthlyData.reduce((sum, item) => sum + item.disabledEmployees, 0);
    
    const totalRequiredEmployees = calculatedData.reduce((sum, item) => sum + item.requiredEmployees, 0);
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
    return num.toLocaleString();
  };

  // 平均従業員数を計算するヘルパー関数
  const calculateAverageEmployees = (monthlyData: {[key: string]: number}) => {
    const values = Object.values(monthlyData);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
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
      return {
        month: month,
        employees: importedData.totalRegularEmployees[key] || 0,
        disabledEmployees: importedData.disabledEmployees[key] || 0
      };
    });
    
    console.log('CSVから生成した表示データ:', formattedData);
    
    // 画面表示を更新
    setMonthlyData(formattedData);
    
    // データを保存
    saveImportedData(importedData);
  };
  
  // インポートしたデータを保存
  const saveImportedData = async (importedData: any) => {
    try {
      setLoading(true);
      const year = getYearValue();
      
      console.log('保存するデータ準備:', importedData);
      
      // 既存のレポートデータを取得
      let existingData: any = null;
      try {
        existingData = await paymentReportApi.getPaymentReport(year);
        console.log('既存データ:', existingData);
      } catch (error) {
        console.log('既存データなし、新規作成します');
      }
      
      // APIに送信するデータを構築
      const paymentReportData = {
        year,
        fiscal_year: year,
        total_employees: calculateAverageEmployees(importedData.totalRegularEmployees),
        disabled_employees: calculateAverageEmployees(importedData.disabledEmployees),
        // 既存データからの情報を維持
        ...(existingData || {}),
        // 新しい月次データを追加
        monthly_data: importedData
      };
      
      console.log('APIに送信するデータ:', paymentReportData);
      
      // APIを呼び出してデータを保存
      await paymentReportApi.savePaymentReport(year, paymentReportData);
      
      setLoading(false);
      alert('月別データを保存しました。画面をリロードします。');
      // データ更新後にページをリロード
      window.location.reload();
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
              <th style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6', 
                whiteSpace: 'nowrap',
                width: '150px'
              }}>項目</th>
              {monthlyData.map((item, idx) => (
                <th key={`month-header-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  fontWeight: 'normal', 
                  backgroundColor: '#f8f9fa', 
                  borderBottom: '1px solid #dee2e6', 
                  whiteSpace: 'nowrap' 
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
                whiteSpace: 'nowrap' 
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
                borderBottom: '1px solid #dee2e6' 
              }}>
                常用労働者数(人)
              </td>
              {calculatedData.map((item, idx) => (
                <td key={`employees-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6' 
                }}>
                  {formatNumber(item.employees)}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold' 
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
                borderBottom: '1px solid #dee2e6' 
              }}>
                障がい者雇用者数(人)
              </td>
              {calculatedData.map((item, idx) => (
                <td key={`disabled-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6' 
                }}>
                  {item.disabledEmployees}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold' 
              }}>
                {totals.totalDisabled}
              </td>
            </tr>
            
            {/* 超過・未達の行 */}
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6' 
              }}>
                超過・未達(人)
              </td>
              {calculatedData.map((item, idx) => (
                <td key={`difference-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6',
                  color: item.difference < 0 ? '#dc3545' : 'inherit'
                }}>
                  {item.difference > 0 ? '+' + item.difference : item.difference}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold',
                color: totals.totalDifference < 0 ? '#dc3545' : 'inherit'
              }}>
                {totals.totalDifference > 0 ? '+' + totals.totalDifference : totals.totalDifference}
              </td>
            </tr>
            
            {/* 調整金・納付金の行 */}
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6' 
              }}>
                調整金・納付金(円)
              </td>
              {calculatedData.map((item, idx) => (
                <td key={`payment-${item.month}-${idx}`} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6',
                  color: item.payment < 0 ? '#dc3545' : '#28a745'
                }}>
                  {formatNumber(item.payment)}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold',
                color: totals.totalPayment < 0 ? '#dc3545' : '#28a745'
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