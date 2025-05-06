import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Papa, { ParseResult } from 'papaparse';
import './CSVImportModal.css'; // 既存のCSSを再利用

interface EmployeeCSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: any[]) => void;
  fiscalYear: number;
}

// 従業員データCSVインポートモーダル
const EmployeeCSVImportModal: React.FC<EmployeeCSVImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImportSuccess, 
  fiscalYear 
}) => {
  // 状態管理
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 年度をステート管理（CSVからの読み込み用）
  const [detectedFiscalYear, setDetectedFiscalYear] = useState<number | null>(null);
  
  // 処理段階の状態管理
  const [processStage, setProcessStage] = useState<'initial' | 'parsing' | 'ready' | 'completed' | 'error'>('initial');
  
  // パースされたデータのキャッシュ
  const [parsedDataCache, setParsedDataCache] = useState<any[] | null>(null);
  
  // 変換後の従業員データキャッシュ
  const [convertedEmployeeData, setConvertedEmployeeData] = useState<any[] | null>(null);
  
  // ステータスメッセージ
  const statusMessage = useMemo(() => {
    switch (processStage) {
      case 'parsing':
        return 'ファイル解析中...';
      case 'ready':
        return `${detectedFiscalYear || fiscalYear}年度のデータ (${parsedDataCache?.length || 0}名の従業員) の準備完了`;
      case 'completed':
        return 'インポート完了！';
      case 'error':
        return 'エラーが発生しました';
      default:
        return '';
    }
  }, [processStage, detectedFiscalYear, fiscalYear, parsedDataCache]);

  // 年度情報メッセージ - 検出された年度と選択されている年度が異なる場合に表示
  const yearInfoMessage = useMemo(() => {
    if (detectedFiscalYear && detectedFiscalYear !== fiscalYear) {
      return `テンプレートから${detectedFiscalYear}年度が検出されました。このデータは${detectedFiscalYear}年度としてインポートされます。`;
    } else if (detectedFiscalYear === null && parsedDataCache && parsedDataCache.length > 0) {
      return `テンプレートに年度情報がないため、現在選択されている${fiscalYear}年度としてインポートされます。`;
    }
    return null;
  }, [detectedFiscalYear, fiscalYear, parsedDataCache]);

  // モーダルを開いた時にステートをリセット
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setDetectedFiscalYear(null);
      setFile(null);
      setProcessStage('initial');
      setParsedDataCache(null);
      setConvertedEmployeeData(null);
    }
  }, [isOpen]);

  // CSVテンプレートのダウンロード
  const handleDownloadTemplate = useCallback(() => {
    console.log(`従業員データテンプレートをダウンロード: ${fiscalYear}年度`);
    const csvContent = generateEmployeeCSVTemplate(fiscalYear);
    downloadCSV(csvContent, `従業員データ_テンプレート_${fiscalYear}年度.csv`);
  }, [fiscalYear]);

  // ファイル選択ハンドラ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      console.log(`ファイルが選択されました: ${selectedFile.name} (${selectedFile.size} bytes)`);
      setFile(selectedFile);
      setErrorMessage(null);
      setDetectedFiscalYear(null);
      setParsedDataCache(null);
      setProcessStage('parsing');
      setConvertedEmployeeData(null);
      
      // ファイル解析を即時開始
      parseCSVFile(selectedFile);
    }
  };

  // ファイル選択ボタンクリックハンドラ
  const handleSelectFile = () => {
    console.log('ファイル選択ボタンがクリックされました');
    fileInputRef.current?.click();
  };

  // CSVファイル解析
  const parseCSVFile = (file: File) => {
    // FileReaderでファイルをテキストとして読み込む
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      if (!csvText) {
        setErrorMessage('ファイルの読み込みに失敗しました');
        setProcessStage('error');
        return;
      }
      
      // 正常終了時のコールバック
      const handleParseComplete = (results: ParseResult<any>) => {
        // エラーチェック
        if (results.errors && results.errors.length > 0) {
          // 重大なエラーかどうかをメッセージで判断
          const criticalErrors = results.errors.filter(e => {
            const message = e.message.toLowerCase();
            return !message.includes('duplicate') && !message.includes('quote');
          });
          
          if (criticalErrors.length > 0) {
            console.error('CSVパースエラー:', criticalErrors);
            setErrorMessage('CSVファイルの解析中にエラーが発生しました');
            setProcessStage('error');
            return;
          }
        }
        
        // 有効なデータを抽出
        const validData = results.data.filter((row: any) => 
          Object.keys(row).length > 0 && 
          Object.values(row).some(v => v !== null && v !== undefined && v !== '')
        );
        
        console.log('パース完了。データ行数:', validData.length);
        
        try {
          // 年度を検出
          const convertedData = convertEmployeeTemplateDataToApiFormat(validData, fiscalYear);
          
          // データが変換できた場合
          if (convertedData && convertedData.length > 0) {
            // 検出された年度を設定
            if (convertedData[0]?.fiscal_year) {
              setDetectedFiscalYear(convertedData[0].fiscal_year);
            }
            
            // 変換済みデータをキャッシュ
            setConvertedEmployeeData(convertedData);
            
            // パース済みデータをキャッシュに保存
            setParsedDataCache(validData);
            setProcessStage('ready');
          } else {
            throw new Error('データの変換に失敗しました');
          }
        } catch (err) {
          console.error('データ処理エラー:', err);
          setErrorMessage('CSVデータの処理中にエラーが発生しました');
          setProcessStage('error');
        }
      };
      
      try {
        // パース実行
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          fastMode: true,
          transformHeader: (header) => 
            header.trim() || `_empty_${Math.random().toString(36).substring(2, 7)}`,
          complete: handleParseComplete,
        });
      } catch (err) {
        console.error('Papaparse実行エラー:', err);
        setErrorMessage('CSVファイルの処理中にエラーが発生しました');
        setProcessStage('error');
      }
    };
    
    reader.onerror = () => {
      setErrorMessage('ファイルの読み込み中にエラーが発生しました');
      setProcessStage('error');
    };
    
    // ファイル読み込み開始
    reader.readAsText(file);
  };

  // インポート実行
  const handleImport = async () => {
    if (!file) {
      setErrorMessage('ファイルを選択してください。');
      return;
    }
    
    try {
      if (!parsedDataCache) {
        setProcessStage('parsing');
        parseCSVFile(file);
        return;
      }
      
      // すでに変換済みのデータがある場合はそれを使用
      if (convertedEmployeeData && convertedEmployeeData.length > 0) {
        console.log('変換済みデータを使用してインポートします');
      } else {
        // 変換済みデータがない場合は再変換
        console.log(`インポートに使用する年度: ${detectedFiscalYear || fiscalYear}`);
        const apiFormatData = convertEmployeeTemplateDataToApiFormat(
          parsedDataCache, 
          detectedFiscalYear || fiscalYear
        );
        setConvertedEmployeeData(apiFormatData);
        
        if (apiFormatData.length === 0) {
          setErrorMessage('有効なインポートデータが見つかりませんでした。テンプレート形式を確認してください。');
          setProcessStage('error');
          return;
        }
      }
      
      // デバッグ情報
      console.log('インポートする従業員データ:', convertedEmployeeData);

      // インポート確認
      const numEmployees = convertedEmployeeData!.length;
      const detectedYear = detectedFiscalYear || fiscalYear;
      
      if (window.confirm(`${detectedYear}年度の${numEmployees}名の従業員データをインポートします。よろしいですか？`)) {
        setIsLoading(true);
        
        // データをコンポーネントに渡す
        onImportSuccess(convertedEmployeeData!);
        
        setSuccessMessage(`${detectedYear}年度の従業員データ (${numEmployees}名) をインポートしました。`);
        setProcessStage('completed');
        
        // 少し待ってからモーダルを閉じる
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('インポートエラー:', error);
      setErrorMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
      setProcessStage('error');
    } finally {
      setIsLoading(false);
    }
  };

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="csv-import-modal-overlay">
      <div className="csv-import-modal">
        <div className="csv-import-modal-header">
          <h2>従業員データのインポート</h2>
        </div>
        <div className="csv-import-modal-body">
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          
          {/* コンパクトな説明セクション */}
          <div className="import-info-section">
            <p>
              CSVファイルから従業員データをインポートします。
              テンプレートをダウンロードして必要なデータを入力してください。
              <button 
                className="import-template-button"
                onClick={handleDownloadTemplate}
                disabled={isLoading}
              >
                テンプレートをダウンロード
              </button>
            </p>
            <p className="note">
              テンプレートには「年度」行がありますが、空白のままでも問題ありません。
              その場合は現在選択されている年度が使用されます。
            </p>
          </div>
          
          {/* ファイル選択エリア */}
          <div className="file-select-area" onClick={handleSelectFile}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv"
              onChange={handleFileChange}
            />
            <div className="file-select-button">
              CSVファイルを選択
            </div>
            <div className="file-name">
              {file ? file.name : 'ファイルが選択されていません'}
            </div>
          </div>
          
          {/* コンパクトな進行状況表示 */}
          {processStage !== 'initial' && (
            <div className="import-progress-compact">
              {/* ステータスアイコンとメッセージ */}
              <div className="status-row">
                {processStage === 'parsing' ? (
                  <div className="spinner"></div>
                ) : processStage === 'completed' ? (
                  <div className="success-icon">✓</div>
                ) : processStage === 'error' ? (
                  <div className="error-icon">!</div>
                ) : (
                  <div className="ready-icon">⟳</div>
                )}
                <span className="status-message">{statusMessage}</span>
              </div>
              
              {/* 検出された年度表示 */}
              {yearInfoMessage && (
                <div className="detected-year-info">
                  <span>{yearInfoMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="csv-import-modal-footer">
          <button 
            className="cancel-button"
            onClick={onClose}
            disabled={isLoading}
          >
            閉じる
          </button>
          <button 
            className="import-button"
            onClick={handleImport}
            disabled={!file || isLoading || processStage === 'error' || processStage === 'parsing'}
          >
            {isLoading 
              ? 'インポート中...' 
              : processStage === 'ready' 
                ? 'インポート開始' 
                : 'インポート'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// CSVテンプレートの生成
const generateEmployeeCSVTemplate = (fiscalYear: number): string => {
  // CSVデータ作成
  let csvContent = '\uFEFF'; // BOMを追加して文字化けを防止
  
  // 年度行を追加
  csvContent += `年度,${fiscalYear}\n\n`;
  
  // 従業員データのヘッダー行を追加
  csvContent += '従業員データ\n';
  csvContent += '社員ID,氏名,障害区分,障害,等級,採用日,状態,WH,HC,4月,5月,6月,7月,8月,9月,10月,11月,12月,1月,2月,3月\n';
  
  // サンプルデータを追加
  const sampleData = [
    ['1001', '山田 太郎', '身体障害', '視覚', '1級', '2010/04/01', '在籍', '正社員', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2'],
    ['2222', '山田 花子', '身体障害', '聴覚', '4級', '2020/04/10', '在籍', '短時間労働者', '0.5', '0.5', '0.5', '0.5', '0.5', '0.5', '0.5', '0.5', '0.5', '0.5', '0.5', '0.5'],
    ['3333', '山田 一郎', '知的障害', '', 'B', '2020/10/01', '退職', '正社員', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'],
    ['4444', '山田 二郎', '精神障害', 'ADHD', '3級', '2024/05/01', '在籍', '正社員', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'],
    ['5555', '高橋 花', '精神障害', 'うつ病', '2級', '2024/05/04', '休職', '正社員', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1']
  ];
  
  // サンプルデータを追加
  sampleData.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  // 注意事項を追加
  csvContent += '\n注意事項\n';
  csvContent += '年度,年度を入力することで対象年度にCSVインポートを実行することができます\n';
  csvContent += '障害区分,身体障害、知的障害、精神障害、発達障害のいずれかをご入力ください\n';
  csvContent += '等級,1級や3級、知的障害の場合には、A1, A2, B1, B2のいずれかをご入力ください\n';
  csvContent += '採用日,YYYY/MM/DDのフォーマットでご入力ください。例えば、2000年4月1日入社の場合には、2000/04/01\n';
  csvContent += '状態,在籍、休職、退職からご入力ください\n';
  csvContent += 'WH,正社員、短時間労働者、特定短時間労働者からご入力ください\n';
  csvContent += 'HC及び各月,HC(障がい者のカウント)及び各月は、2、1、0.5からご入力ください\n';
  
  return csvContent;
};

// CSVファイルのダウンロード
const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// CSVデータをAPIフォーマットに変換する関数
const convertEmployeeTemplateDataToApiFormat = (csvData: any[], defaultFiscalYear: number): any[] => {
  // 年度の取得
  let fiscalYear = defaultFiscalYear; // デフォルト値
  
  // CSVから年度を検出
  for (const row of csvData) {
    if ('年度' in row && row['年度'] !== null && row['年度'] !== '') {
      const yearValue = row['年度'];
      if (typeof yearValue === 'number') {
        fiscalYear = yearValue;
        break;
      } else if (typeof yearValue === 'string') {
        const match = yearValue.match(/\d{4}/);
        if (match) {
          fiscalYear = parseInt(match[0], 10);
          break;
        }
      }
    }
  }
  
  // 従業員データを抽出
  const employees: any[] = [];
  
  // 従業員データセクションを検出
  let inEmployeeSection = false;
  
  for (const row of csvData) {
    // "従業員データ"のみの行は無視
    if (Object.keys(row).length === 1 && Object.values(row)[0] === '従業員データ') {
      inEmployeeSection = true;
      continue;
    }
    
    // 注意事項セクションは無視
    if (Object.keys(row).length === 1 && Object.values(row)[0] === '注意事項') {
      inEmployeeSection = false;
      break;
    }
    
    // 有効なデータ行の処理
    if (inEmployeeSection && Object.keys(row).length > 3) {
      // データマッピング
      const employee: any = {
        fiscal_year: fiscalYear,
        employee_id: row['社員ID'] || '',
        name: row['氏名'] || '',
        disability_type: row['障害区分'] || '',
        disability: row['障害'] || '',
        grade: row['等級'] || '',
        hire_date: row['採用日'] || '',
        status: row['状態'] || '在籍',
        wh: row['WH'] || '正社員',
        hc: parseFloat(row['HC']) || 1,
        retirement_date: row['退職日'] || '',
        monthlyStatus: []
      };
      
      // 月次データの処理
      const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
      
      // 各月のHC値を抽出
      employee.monthlyStatus = months.map(month => {
        const value = row[month];
        if (value === null || value === undefined || value === '') {
          return employee.hc; // デフォルトはHC値
        }
        return parseFloat(value) || 0;
      });
      
      // 必須項目のチェック
      if (employee.employee_id && employee.name) {
        employees.push(employee);
      }
    }
  }
  
  console.log(`従業員データに変換: ${employees.length}名`);
  return employees;
};

export default EmployeeCSVImportModal;