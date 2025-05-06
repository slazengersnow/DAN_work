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

  // CSVファイル解析 - 年度行の特別処理を追加
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
      
      // 年度行を検出するための事前処理
      const checkFirstRowForFiscalYear = (csvContent: string): { 
        hasYearRow: boolean, 
        yearRowValue: number | null, 
        modifiedCsv: string | null 
      } => {
        const lines = csvContent.split(/\r?\n/);
        if (lines.length < 2) return { hasYearRow: false, yearRowValue: null, modifiedCsv: null };
        
        const firstLine = lines[0].trim();
        // 「年度,XXXX」形式の行を検出
        const yearRowMatch = firstLine.match(/^年度[,\t](\d{4})$/);
        
        if (yearRowMatch) {
          const yearValue = parseInt(yearRowMatch[1], 10);
          console.log('CSVの1行目から年度を検出:', yearValue);
          
          // 年度を設定
          setDetectedFiscalYear(yearValue);
          
          // 2行目がヘッダー行
          return { 
            hasYearRow: true, 
            yearRowValue: yearValue,
            modifiedCsv: null  // 実際のファイルは変更しない
          };
        }
        
        return { hasYearRow: false, yearRowValue: null, modifiedCsv: null };
      };
      
      // CSVの最初の部分をログ出力してデバッグ
      console.log('CSVの最初の部分:', csvText.substring(0, 200));
      
      // 年度行のチェック
      const yearRowCheck = checkFirstRowForFiscalYear(csvText);
      console.log('年度行チェック結果:', yearRowCheck);
      
      // 正常終了時のコールバック
      const handleParseComplete = (results: ParseResult<any>) => {
        try {
          // CSV解析結果の詳細出力
          console.log("CSV解析結果の詳細:", {
            dataRows: results.data?.length || 0,
            errors: results.errors,
            meta: results.meta,
            headers: results.meta?.fields || []
          });
          
          // PapaParseのエラーチェック
          if (results.errors && results.errors.length > 0) {
            console.error("CSVパースエラー:", results.errors);
            
            // エラーが「Too many fields」で、区切り文字の問題の可能性がある場合
            const tooManyFieldsError = results.errors.some(e => 
              e.message && e.message.includes('Too many fields'));
            
            if (tooManyFieldsError) {
              setErrorMessage(`CSVファイルの区切り文字が正しく認識できませんでした。カンマ区切り(,)のCSVファイルを使用してください。`);
            } else {
              setErrorMessage(`CSVパースエラー: ${results.errors[0].message}`);
            }
            
            setProcessStage('error');
            return;
          }
          
          // データの有無チェック
          if (!results.data || results.data.length === 0) {
            setErrorMessage("CSVデータが空です");
            setProcessStage('error');
            return;
          }
          
          // 利用可能なフィールド名を確認
          if (results.data.length > 0) {
            const firstRow = results.data[0];
            console.log('最初の行のデータ:', firstRow);
            console.log('利用可能なフィールド名:', Object.keys(firstRow));
            
            // _empty_xxxフィールドがある場合は警告
            const emptyFields = Object.keys(firstRow).filter(key => key.startsWith('_empty_'));
            if (emptyFields.length > 0) {
              console.warn('自動生成された空フィールド名:', emptyFields);
            }
          }
          
          // 有効なデータを抽出 (空行を除外)
          const validData = results.data.filter((row: any) => 
            Object.keys(row).length > 0 && 
            Object.values(row).some(v => v !== null && v !== undefined && v !== '')
          );
          
          console.log('パース完了。データ行数:', validData.length);
          
          // 年度を検出し、データを変換
          try {
            // 年度行から検出した年度を優先的に使用
            const yearToUse = yearRowCheck.yearRowValue || fiscalYear;
            const convertedData = convertEmployeeTemplateDataToApiFormat(validData, yearToUse);
            
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
              console.warn('変換されたデータがありません');
              throw new Error('有効な従業員データが変換できませんでした。CSVファイルの形式を確認してください。');
            }
          } catch (conversionError) {
            console.error('データ変換エラー:', conversionError);
            setErrorMessage(`データの変換に失敗しました: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`);
            setProcessStage('error');
          }
        } catch (err) {
          console.error('データ処理エラー:', err);
          setErrorMessage(`CSVデータの処理中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
          setProcessStage('error');
        }
      };
      
      try {
        // 年度行を検出した場合は特別処理
        if (yearRowCheck.hasYearRow) {
          console.log('年度行を検出: 2行目をヘッダーとして処理する特別な処理を実行します');
          
          // CSVの行を分割
          const lines = csvText.split(/\r?\n/);
          
          if (lines.length >= 2) {
            console.log('取得された最初の2行:', {
              '1行目(年度行)': lines[0],
              '2行目(ヘッダー行)': lines[1]
            });
            
            // 年度行(1行目)を保持しつつ、2行目をヘッダーとして処理するCSVを作成
            // 1. 年度行を一時的に保存
            const yearRow = lines[0];
            const yearMatch = yearRow.match(/年度,(\d{4})/);
            if (yearMatch) {
              const detectedYear = parseInt(yearMatch[1], 10);
              setDetectedFiscalYear(detectedYear);
              console.log(`年度行から年度を検出: ${detectedYear}`);
            }
            
            // 2. 2行目以降のみを使用して新しいCSVテキストを作成
            const modifiedCsvText = lines.slice(1).join('\n');
            
            // 3. 2行目からのデータでパースを実行
            Papa.parse(modifiedCsvText, {
              header: true,
              skipEmptyLines: true,
              dynamicTyping: true,
              delimiter: ',',
              encoding: 'UTF-8',
              delimitersToGuess: [',', ';', '\t', '|'],
              comments: '#',
              transformHeader: (header) => {
                const trimmedHeader = header.trim();
                return trimmedHeader || `_empty_${Math.random().toString(36).substring(2, 7)}`;
              },
              error: function(error) {
                console.error('CSVパース処理中のエラー:', error);
              },
              complete: handleParseComplete,
            });
            
            return; // 特別処理を実行したので、通常のパース処理は行わない
          }
        }
        
        // 通常のパース処理（年度行を検出していない場合）
        console.log('通常のCSVパース処理を実行します（年度行なし）');
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          delimiter: ',', // カンマを明示的に指定
          encoding: 'UTF-8', // エンコーディングを明示
          delimitersToGuess: [',', ';', '\t', '|'], // 区切り文字の自動検出
          comments: '#', // コメント行をスキップ
          transformHeader: (header) => {
            // ヘッダー変換 - 空の場合は一意のIDを生成
            const trimmedHeader = header.trim();
            return trimmedHeader || `_empty_${Math.random().toString(36).substring(2, 7)}`;
          },
          error: function(error) {
            console.error('CSVパース処理中のエラー:', error);
          },
          beforeFirstChunk: function(chunk) {
            // CSVファイルの最初の部分をデバッグ出力
            console.log('CSVの最初のチャンク:', chunk.substring(0, 100));
            return chunk;
          },
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
    
    // ファイル読み込み開始 - UTF-8エンコーディングを明示
    try {
      // まずはUTF-8で試す
      reader.readAsText(file, 'UTF-8');
    } catch (error) {
      console.error('UTF-8でのファイル読み込みエラー:', error);
      try {
        // UTF-8で失敗したらShift-JISで試す
        reader.readAsText(file, 'Shift_JIS');
      } catch (error2) {
        console.error('Shift_JISでのファイル読み込みエラー:', error2);
        // 最後の手段としてエンコーディング指定なしで読み込み
        reader.readAsText(file);
      }
    }
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

  // モーダルが閉じている場合は空のdivを返す（nullではなく）
  if (!isOpen) return <></>;

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
              テンプレートは必ず以下の構造を維持してください：
              <br/>・1行目：<strong>「年度,XXXX」</strong>（例：年度,2025）
              <br/>・2行目：<strong>ヘッダー行</strong>（社員ID,氏名,障害区分,...）
              <br/>・3行目以降：<strong>データ行</strong>
            </p>
            <p className="note">
              <strong>CSVファイル形式の注意点:</strong><br/>
              - カンマ区切り(,)のCSVファイル形式を使用してください<br/>
              - UTF-8エンコードを推奨します<br/>
              - 1行目の「年度,XXXX」と2行目のヘッダー行は必ず残してください<br/>
              - ヘッダー行（列名）の変更はしないでください<br/>
              - エクセルで編集した場合は「CSV（カンマ区切り）」形式で保存してください
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

// CSVテンプレートの生成 - 改良版
const generateEmployeeCSVTemplate = (fiscalYear: number): string => {
  // CSVデータ作成
  let csvContent = '\uFEFF'; // BOMを追加して文字化けを防止
  
  // 年度行を追加
  csvContent += `年度,${fiscalYear}\n`;
  
  // ヘッダー行を追加
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
  
  // 注意事項を追加（注意：インポート時は削除されます）
  csvContent += '\n注意事項（インポート時は注意事項全体を削除してデータのみにしてください）\n';
  csvContent += 'ファイル構造,以下の行順序を維持してください：1行目「年度,XXXX」、2行目「ヘッダー行」、3行目以降「データ行」\n';
  csvContent += '年度行,必ず1行目に「年度,XXXX」形式の年度指定を記載してください。年度を省略すると選択中の年度が使用されます\n';
  csvContent += '障害区分,身体障害、知的障害、精神障害、発達障害のいずれかをご入力ください\n';
  csvContent += '等級,1級や3級、知的障害の場合には、A1, A2, B1, B2のいずれかをご入力ください\n';
  csvContent += '採用日,YYYY/MM/DDのフォーマットでご入力ください。例えば、2000年4月1日入社の場合には、2000/04/01または2000/4/1\n';
  csvContent += '状態,在籍、休職、退職からご入力ください\n';
  csvContent += 'WH,正社員、短時間労働者、特定短時間労働者からご入力ください\n';
  csvContent += 'HC及び各月,HC(障がい者のカウント)及び各月は、2、1、0.5からご入力ください\n';
  csvContent += 'ヘッダー行,ヘッダー行（列名）の変更はしないでください。特に月の表記（「9月」と「9 月」の違い）に注意してください\n';
  csvContent += 'エクセル保存,エクセルで編集した場合は必ず「CSV（カンマ区切り）」形式で保存してください\n';
  
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
// 採用日を処理する関数
const processHireDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  dateStr = String(dateStr).trim();
  
  // 様々な日付形式に対応
  const formats = [
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/  // MM/DD/YYYY or DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const parts = match.slice(1).map(Number);
      let year, month, day;
      
      if (format === formats[0]) {
        // YYYY/MM/DD形式
        [year, month, day] = parts;
      } else {
        // MM/DD/YYYY形式
        [month, day, year] = parts;
      }
      
      // 日付が有効かどうかチェック
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        // フォーマットを統一（YYYY/MM/DD）
        return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
      }
    }
  }
  
  // 元の値をそのまま返す（変換できない場合）
  return dateStr;
};

const convertEmployeeTemplateDataToApiFormat = (csvData: any[], defaultFiscalYear: number): any[] => {
  console.log('CSVデータをAPI形式に変換開始', csvData.length, csvData);
  
  // フィールド名のマッピングを追加 - 自動生成フィールド(_empty_xxx)も対応
  const fieldMappings: {[key: string]: string[]} = {
    '社員ID': ['社員ID', '社員番号', 'ID', 'employee_id', 'employee-id'],
    '氏名': ['氏名', '名前', 'フルネーム', 'name'],
    '障害区分': ['障害区分', '障害種別', '障害タイプ', 'disability_type', 'disability-type'],
    '障害': ['障害', '障害名', 'disability'],
    '等級': ['等級', 'グレード', '級', 'grade'],
    '採用日': ['採用日', '入社日', 'hire_date', 'hire-date'],
    '退職日': ['退職日', '退社日', 'retirement_date', 'retirement-date'],
    '状態': ['状態', '状況', 'ステータス', '在籍状況', 'status'],
    'WH': ['WH', '雇用形態', '勤務形態', 'work_hours', 'work-hours'],
    'HC': ['HC', 'ヘッドカウント', 'head_count', 'head-count'],
    // 月のフィールド対応（スペースありなしの両方に対応）
    '4月': ['4月', '4 月', 'Apr', 'April'],
    '5月': ['5月', '5 月', 'May'],
    '6月': ['6月', '6 月', 'Jun', 'June'],
    '7月': ['7月', '7 月', 'Jul', 'July'],
    '8月': ['8月', '8 月', 'Aug', 'August'],
    '9月': ['9月', '9 月', 'Sep', 'September'],
    '10月': ['10月', '10 月', 'Oct', 'October'],
    '11月': ['11月', '11 月', 'Nov', 'November'],
    '12月': ['12月', '12 月', 'Dec', 'December'],
    '1月': ['1月', '1 月', 'Jan', 'January'],
    '2月': ['2月', '2 月', 'Feb', 'February'],
    '3月': ['3月', '3 月', 'Mar', 'March']
  };
  
  // CSVデータの最初の行を調査して、自動生成された列名(empty_xxx)をマッピングに追加
  if (csvData.length > 0) {
    const firstRow = csvData[0];
    const availableFields = Object.keys(firstRow);
    console.log('CSVデータの使用可能なフィールド名:', availableFields);
    
    // 自動生成フィールド名の検出と処理
    const emptyFields = availableFields.filter(field => field.startsWith('_empty_'));
    const nonEmptyFields = availableFields.filter(field => !field.startsWith('_empty_'));
    console.log('自動生成フィールド:', emptyFields);
    console.log('通常フィールド:', nonEmptyFields);
    
    if (emptyFields.length > 0) {
      // 年度,2025のケースを疑う - 2行目がヘッダー行だった場合
      console.log('自動生成フィールドがあります。データの位置から推測してマッピングを拡張します。');
      
      // 期待される標準列名 (テンプレートの列順)
      const expectedColumns = [
        '社員ID', '氏名', '障害区分', '障害', '等級', '採用日', '状態', 'WH', 'HC',
        '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'
      ];
      
      // 位置ベースのマッピング - 空フィールドの位置から元の列名を推測
      emptyFields.forEach((emptyField, index) => {
        const expectedColumn = index < expectedColumns.length ? expectedColumns[index] : null;
        if (expectedColumn) {
          console.log(`自動生成フィールド ${emptyField} は ${expectedColumn} に相当すると推測`);
          fieldMappings[expectedColumn].push(emptyField);
        }
      });
    }
  }
  
  // 柔軟なフィールド取得関数 - 拡張版
  const getFieldValue = (row: any, fieldNames: string[]): any => {
    // 通常のフィールド名で検索
    for (const name of fieldNames) {
      if (row[name] !== undefined && row[name] !== null) {
        return row[name];
      }
    }
    
    // _empty_xxx形式のフィールドにも対応
    // 各フィールドの配列内の位置を利用してマッピング
    const allColumns = Object.keys(row);
    const emptyColumns = allColumns.filter(col => col.startsWith('_empty_'));
    
    // 標準的な列順
    const standardColumns = [
      '社員ID', '氏名', '障害区分', '障害', '等級', '採用日', '状態', 'WH', 'HC',
      '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'
    ];
    
    // フィールドの正規化された名前を取得
    const normalizedName = fieldNames[0]; // 最初の名前を代表として使用
    const columnIndex = standardColumns.indexOf(normalizedName);
    
    // 位置が分かり、かつその位置に対応する_empty_xxxフィールドが存在する場合
    if (columnIndex >= 0 && columnIndex < emptyColumns.length) {
      const emptyField = emptyColumns[columnIndex];
      if (row[emptyField] !== undefined && row[emptyField] !== null) {
        return row[emptyField];
      }
    }
    
    return null;
  };
  
  // 年度の取得
  let fiscalYear = defaultFiscalYear; // デフォルト値
  
  // 年度行を検出 - すべての行をチェック
  for (const row of csvData) {
    // 年度フィールドを検出
    const yearValue = getFieldValue(row, ['年度', 'fiscal_year', 'fiscalYear', 'year']);
    if (yearValue !== null && yearValue !== '') {
      if (typeof yearValue === 'number') {
        fiscalYear = yearValue;
        console.log('検出された年度(数値):', fiscalYear);
        break;
      } else if (typeof yearValue === 'string') {
        const match = yearValue.match(/\d{4}/);
        if (match) {
          fiscalYear = parseInt(match[0], 10);
          console.log('検出された年度(文字列):', fiscalYear);
          break;
        }
      }
    }
  }
  console.log('使用する年度:', fiscalYear);
  
  // 従業員データを抽出
  const employees: any[] = [];
  
  // すべての行をチェック (フィルタリングを緩和)
  for (let index = 0; index < csvData.length; index++) {
    const row = csvData[index];
    console.log(`行 ${index + 1} の処理開始:`, row);
    
    try {
      // 社員IDの取得 (必須項目)
      const employeeId = getFieldValue(row, fieldMappings['社員ID']);
      console.log(`行 ${index + 1} の社員ID:`, employeeId);
      
      // 氏名の取得 (必須項目)
      const name = getFieldValue(row, fieldMappings['氏名']);
      console.log(`行 ${index + 1} の氏名:`, name);
      
      // 必須項目のチェック
      if (!employeeId || !name) {
        // 社員IDまたは氏名がない行はスキップ
        console.log(`行 ${index + 1} は社員IDまたは氏名がないためスキップします。`);
        continue;
      }
      
      // この行は処理対象
      console.log(`行 ${index + 1} は有効なデータ行です`);
      
      // データマッピング
      const employee: any = {
        fiscal_year: fiscalYear,
        employee_id: employeeId,
        name: name,
        disability_type: getFieldValue(row, fieldMappings['障害区分']) || '',
        disability: getFieldValue(row, fieldMappings['障害']) || '',
        grade: getFieldValue(row, fieldMappings['等級']) || '',
        hire_date: processHireDate(getFieldValue(row, fieldMappings['採用日']) || ''),
        status: getFieldValue(row, fieldMappings['状態']) || '在籍',
        wh: getFieldValue(row, fieldMappings['WH']) || '正社員',
        retirement_date: processHireDate(getFieldValue(row, fieldMappings['退職日']) || ''),
        monthlyStatus: []
      };
      
      // HC値の処理
      const hcValue = getFieldValue(row, fieldMappings['HC']);
      if (hcValue !== null) {
        try {
          // 文字列の場合はカンマをピリオドに変換
          const hcString = typeof hcValue === 'string' ? 
            hcValue.replace(',', '.') : String(hcValue);
          
          const hcNumber = parseFloat(hcString);
          if (!isNaN(hcNumber)) {
            employee.hc = hcNumber;
          } else {
            console.warn(`行 ${index + 1} のHC値(${hcValue})が数値ではありません。デフォルト値1を使用します。`);
            employee.hc = 1;
          }
        } catch (e) {
          console.warn(`行 ${index + 1} のHC値変換エラー:`, e);
          employee.hc = 1;
        }
      } else {
        employee.hc = 1; // デフォルト値
      }
      
      // 月次データの処理
      const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
      
      // 各月のHC値を抽出
      employee.monthlyStatus = months.map((month, monthIndex) => {
        const monthValue = getFieldValue(row, fieldMappings[month]);
        console.log(`行 ${index + 1} の${month}データ:`, monthValue);
        
        // 空、未定義、nullはHC値として処理
        if (monthValue === null || monthValue === '' || monthValue === undefined) {
          return employee.hc; // デフォルトはHC値
        }
        
        // 数値変換試行
        try {
          // 文字列の場合はカンマをピリオドに変換
          const strValue = typeof monthValue === 'string' ? 
            monthValue.replace(',', '.') : String(monthValue);
          
          const numValue = parseFloat(strValue);
          if (isNaN(numValue)) {
            console.warn(`行 ${index + 1} の${month}の値(${monthValue})が数値ではありません。HC値として処理します。`);
            return employee.hc;
          } else {
            return numValue;
          }
        } catch (e) {
          console.warn(`行 ${index + 1} の${month}の値(${monthValue})の変換エラー:`, e);
          return employee.hc;
        }
      });
      
      console.log(`行 ${index + 1} の従業員データ変換完了:`, employee);
      employees.push(employee);
    } catch (error) {
      console.error(`行 ${index + 1} の処理中にエラー発生:`, error);
    }
  }
  
  console.log(`従業員データに変換: ${employees.length}名`, employees);
  return employees;
};

export default EmployeeCSVImportModal;