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
  const [detectedYear, setDetectedYear] = useState<number | null>(null);
  
  // 処理段階の状態管理
  const [processStage, setProcessStage] = useState<'initial' | 'parsing' | 'ready' | 'completed' | 'error'>('initial');
  
  // パースされたデータのキャッシュ
  const [parsedDataCache, setParsedDataCache] = useState<any[] | null>(null);
  
  // 変換後の従業員データキャッシュ
  const [convertedEmployeeData, setConvertedEmployeeData] = useState<any[] | null>(null);
  const [importData, setImportData] = useState<any[] | null>(null);
  
  // エラー設定関数
  const setError = (message: string | null) => {
    setErrorMessage(message);
    if (message) {
      setProcessStage('error');
    }
  };
  
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
      setDetectedYear(null);
      setFile(null);
      setProcessStage('initial');
      setParsedDataCache(null);
      setConvertedEmployeeData(null);
      setImportData(null);
    }
  }, [isOpen]);

  // CSVテンプレートのダウンロード
  const handleDownloadTemplate = () => {
    try {
      console.log("従業員データテンプレートをダウンロード:", fiscalYear + "年度");
      
      // テンプレートヘッダーを改善（年度行を含む）
      const headers = [
        "年度," + fiscalYear + ",,,,,,,,,,,,,,,,,,,",
        "社員ID,氏名,障害区分,障害,等級,採用日,状態,WH,HC,4月,5月,6月,7月,8月,9月,10月,11月,12月,1月,2月,3月"
      ];
      
      // サンプルデータ
      const sampleData = [
        "1001,山田 太郎,身体障害,視覚,1級,2010/4/1,在籍,正社員,2,2,2,2,2,2,2,2,2,2,2,2,2",
        "2222,山田 花子,身体障害,聴覚,4級,2020/4/10,在籍,短時間労働者,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5",
        "3333,山田 一郎,知的障害,,B1,2020/10/1,在籍,正社員,1,1,1,1,1,1,1,1,1,1,1,1,1"
      ];
      
      // 注釈行を追加
      const notes = [
        ",,,,,,,,,,,,,,,,,,,,,",
        "注意事項:,,,,,,,,,,,,,,,,,,,,,",
        ",障害区分:,身体障害、知的障害、精神障害、発達障害のいずれかをご入力ください,,,,,,,,,,,,,,,,,,,",
        ",等級:,身体障害は1級～7級、知的障害はA・Bのいずれかをご入力ください,,,,,,,,,,,,,,,,,,,",
        ",採用日:,YYYY/MM/DDの形式でご入力ください（例: 2000/04/01）,,,,,,,,,,,,,,,,,,,",
        ",状態:,在籍、休職、退職のいずれかをご入力ください,,,,,,,,,,,,,,,,,,,",
        ",WH:,正社員、短時間労働者、特定短時間労働者のいずれかをご入力ください,,,,,,,,,,,,,,,,,,,",
        ",HC:,HC(障がい者のカウント)は2、1、0.5のいずれかをご入力ください,,,,,,,,,,,,,,,,,,,",
      ];
      
      // CSVコンテンツの作成
      let csvContent = '\uFEFF'; // BOMを追加して文字化けを防止
      csvContent += [...headers, ...sampleData, ...notes].join("\n");
      
      // Blobの作成とダウンロード
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `従業員データテンプレート_${fiscalYear}年度.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("テンプレートのダウンロードに失敗しました:", error);
      setError("テンプレートのダウンロードに失敗しました");
    }
  };

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

  // 年度行を検出するための事前処理
  const checkForYearRow = (csvContent: string) => {
    try {
      // 最初の数行だけを取得して年度行をチェック
      const lines = csvContent.split('\n').slice(0, 3);
      const firstLine = lines[0].trim();
      
      // 「年度,YYYY」パターンを検出
      const yearRowMatch = firstLine.match(/^年度[,\t]\s*(\d{4})\s*$/);
      
      if (yearRowMatch) {
        const yearValue = parseInt(yearRowMatch[1], 10);
        console.log(`年度行を検出しました: ${yearValue}`);
        
        // 年度行を削除し、残りの内容を返す
        const modifiedCsv = csvContent.substring(csvContent.indexOf('\n') + 1);
        return { hasYearRow: true, yearRowValue: yearValue, modifiedCsv };
      }
      
      // 複数列を持つ行で最初の列が「年度」の場合も検出
      if (firstLine.startsWith('年度,') || firstLine.startsWith('年度\t')) {
        const parts = firstLine.split(/[,\t]/);
        if (parts.length > 1 && !isNaN(parseInt(parts[1], 10))) {
          const yearValue = parseInt(parts[1], 10);
          console.log(`複数列の年度行を検出しました: ${yearValue}`);
          
          // 年度行を削除し、残りの内容を返す
          const modifiedCsv = csvContent.substring(csvContent.indexOf('\n') + 1);
          return { hasYearRow: true, yearRowValue: yearValue, modifiedCsv };
        }
      }
    } catch (error) {
      console.error("年度行チェック中にエラーが発生しました:", error);
    }
    
    console.log("年度行は検出されませんでした");
    return { hasYearRow: false, yearRowValue: null, modifiedCsv: null };
  };

  // CSVファイル解析
  const parseCSVFile = (file: File) => {
    return new Promise((resolve, reject) => {
      try {
        console.log("ファイル選択ボタンがクリックされました");
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const csvContent = event.target?.result as string;
          console.log(`CSVの最初の部分: ${csvContent.substring(0, 200)}`);
          
          // 年度行をチェック
          const yearRowResult = checkForYearRow(csvContent);
          console.log("年度行チェック結果:", yearRowResult);
          
          // 年度行が検出された場合、修正されたCSVを使用
          const contentToProcess = yearRowResult.hasYearRow ? yearRowResult.modifiedCsv : csvContent;
          
          if (yearRowResult.hasYearRow) {
            console.log("年度行を含むCSVを処理します（年度: " + yearRowResult.yearRowValue + "）");
            setDetectedYear(yearRowResult.yearRowValue);
          } else {
            console.log("通常のCSVパース処理を実行します（年度行なし）");
            setDetectedYear(null);
          }
          
          console.log("CSVの最初のチャンク:", contentToProcess?.substring(0, 200));
          
          if (!contentToProcess) {
            setError('CSVコンテンツの処理に失敗しました');
            reject(new Error('CSVコンテンツの処理に失敗しました'));
            return;
          }
          
          // PapaParse設定を改善
          Papa.parse(contentToProcess, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
              try {
                // デバッグ情報の追加
                console.log("CSV解析結果の詳細:", {
                  dataRows: results.data.length,
                  errors: results.errors,
                  meta: results.meta,
                  headers: results.meta.fields
                });
                
                if (results.data.length > 0) {
                  console.log("最初の行のデータ:", results.data[0]);
                  console.log("利用可能なフィールド名:", results.meta.fields);
                }
                
                // 自動生成フィールド名を検出
                const autoGeneratedFields = results.meta.fields.filter(field => field.startsWith('_empty_'));
                if (autoGeneratedFields.length > 0) {
                  console.log("自動生成された空フィールド名:", autoGeneratedFields);
                }
                
                // パース完了処理
                handleParseComplete(results, yearRowResult.yearRowValue);
                resolve(results);
              } catch (error) {
                console.error("CSVパース完了処理中にエラーが発生しました:", error);
                setError(`CSVデータの処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
                reject(error);
              }
            },
            error: (error) => {
              console.error("CSVパース中にエラーが発生しました:", error);
              setError(`CSVファイルの解析に失敗しました: ${error.message || '不明なエラー'}`);
              reject(error);
            }
          });
        };
        
        reader.onerror = (error) => {
          console.error("ファイル読み込み中にエラーが発生しました:", error);
          setError("ファイルの読み込みに失敗しました");
          reject(error);
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
      } catch (error) {
        console.error("ファイル処理中に予期しないエラーが発生しました:", error);
        setError(`予期しないエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
        reject(error);
      }
    });
  };

  // getCurrentFiscalYear - 現在の年度を取得する補助関数
  const getCurrentFiscalYear = (): number => {
    return fiscalYear;
  };
  
  // CSVデータをAPI形式に変換する関数
  const convertCSVData = (csvData: any[], detectedFiscalYear = null) => {
    console.log("CSVデータをAPI形式に変換開始", csvData.length, csvData);
    
    // 年度の検出
    let fiscalYearToUse = detectedFiscalYear;
    if (!fiscalYearToUse) {
      // 年度列からの検出を試みる
      fiscalYearToUse = getCurrentFiscalYear();
      
      try {
        if (csvData && csvData.length > 0 && csvData[0].hasOwnProperty('年度')) {
          const yearFromData = parseInt(csvData[0]['年度'], 10);
          if (!isNaN(yearFromData) && yearFromData > 2000 && yearFromData < 2100) {
            fiscalYearToUse = yearFromData;
            console.log("検出された年度:", fiscalYearToUse);
          }
        }
      } catch (error) {
        console.error("年度検出中にエラー:", error);
      }
    }
    
    // 使用する年度を決定
    console.log("使用する年度:", fiscalYearToUse);
    
    // フィールドのマッピングを改善
    const convertedData: any[] = [];
    
    // CSVデータのフィールド名を取得
    const availableFields = csvData.length > 0 ? Object.keys(csvData[0]) : [];
    console.log("CSVデータの使用可能なフィールド名:", availableFields);
    
    // 自動生成フィールドと通常フィールドを分離
    const autoGenFields = availableFields.filter(f => f.startsWith('_empty_'));
    const regularFields = availableFields.filter(f => !f.startsWith('_empty_'));
    console.log("自動生成フィールド:", autoGenFields);
    console.log("通常フィールド:", regularFields);
    
    // 自動生成フィールドがあれば位置ベースのマッピングを使用
    const usePositionalMapping = autoGenFields.length > 0;
    if (usePositionalMapping) {
      console.log("自動生成フィールドがあります。データの位置から推測してマッピングを拡張します。");
    }
    
    // 想定されるフィールド順序（ヘッダー行の典型的な順序）
    const expectedFieldOrder = [
      "社員ID", "氏名", "障害区分", "障害", "等級", "採用日", "状態", "WH", "HC", 
      "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"
    ];
    
    // 位置ベースの拡張マッピング
    const extendedMapping: {[key: string]: string} = {};
    if (usePositionalMapping) {
      autoGenFields.forEach((field, index) => {
        if (index < expectedFieldOrder.length) {
          extendedMapping[field] = expectedFieldOrder[index];
          console.log(`自動生成フィールド ${field} は ${expectedFieldOrder[index]} に相当すると推測`);
        }
      });
    }
    
    // 各行のデータを変換
    csvData.forEach((row, rowIndex) => {
      try {
        console.log(`行 ${rowIndex + 1} の処理開始:`, row);
        
        // フィールドの取得（通常か拡張マッピングを使用）
        const getField = (fieldName: string) => {
          if (row.hasOwnProperty(fieldName)) {
            return row[fieldName];
          }
          
          // 拡張マッピングのチェック
          for (const [autoField, mappedField] of Object.entries(extendedMapping)) {
            if (mappedField === fieldName && row.hasOwnProperty(autoField)) {
              return row[autoField];
            }
          }
          
          // 状態/状況フィールドの特別処理
          if (fieldName === '状態') {
            // '状況'フィールドも試す
            if (row.hasOwnProperty('状況')) {
              return row['状況'];
            }
            
            // 拡張マッピングでの「状況」を検索
            for (const [autoField, mappedField] of Object.entries(extendedMapping)) {
              if (mappedField === '状況' && row.hasOwnProperty(autoField)) {
                return row[autoField];
              }
            }
          }
          
          return null;
        };
        
        // 主要フィールドの取得
        const employeeId = getField('社員ID');
        console.log(`行 ${rowIndex + 1} の社員ID: ${employeeId}`);
        
        const name = getField('氏名');
        console.log(`行 ${rowIndex + 1} の氏名: ${name}`);
        
        // 社員IDまたは氏名が空の場合はスキップ（ヘッダー行など）
        if (!employeeId || !name) {
          console.log(`行 ${rowIndex + 1} は社員IDまたは氏名がないためスキップします。`);
          return;
        }
        
        console.log(`行 ${rowIndex + 1} は有効なデータ行です`);
        
        // 採用日を解析
        const hireDateStr = getField('採用日');
        let hireDate = null;
        
        try {
          if (hireDateStr) {
            // 様々な日付形式に対応
            const dateStr = String(hireDateStr).trim();
            
            // YYYY/MM/DD, YYYY-MM-DD, YYYY/M/D, etc.
            const dateRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
            const dateMatch = dateStr.match(dateRegex);
            
            if (dateMatch) {
              const [_, year, month, day] = dateMatch;
              hireDate = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
            } else {
              hireDate = dateStr;
            }
          }
        } catch (error) {
          console.error(`行 ${rowIndex + 1} の採用日解析中にエラー:`, error);
        }
        
        // 月次データの処理
        const monthlyData: {[key: string]: number | string} = {};
        
        ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'].forEach((month) => {
          let monthValue = getField(month);
          console.log(`行 ${rowIndex + 1} の${month}データ: ${monthValue}`);
          
          if (monthValue === null || monthValue === undefined || monthValue === '') {
            monthlyData[month] = '';
          } else {
            // 数値に変換を試みる
            const numValue = parseFloat(String(monthValue));
            if (!isNaN(numValue)) {
              monthlyData[month] = numValue;
            } else {
              // 数値変換に失敗した場合はHC値を使用
              const hcValue = getField('HC');
              monthlyData[month] = hcValue || '';
            }
          }
        });
        
        // 変換後のデータを作成
        const convertedRow = {
          fiscal_year: fiscalYearToUse,
          employee_id: employeeId,
          name: name,
          disability_type: getField('障害区分') || '',
          disability: getField('障害') || '',
          disability_grade: getField('等級') || '',
          hire_date: hireDate || '',
          status: getField('状態') || '',
          employment_type: getField('WH') || '',
          hc_value: parseFloat(String(getField('HC'))) || 0,
          monthly_status: monthlyData
        };
        
        console.log(`行 ${rowIndex + 1} の従業員データ変換完了:`, convertedRow);
        convertedData.push(convertedRow);
      } catch (error) {
        console.error(`行 ${rowIndex + 1} の処理中にエラーが発生しました:`, error);
      }
    });
    
    console.log("従業員データに変換:", convertedData.length + "名", convertedData);
    return convertedData;
  };
  
  // パース完了時のハンドラ
  const handleParseComplete = (results: ParseResult<any>, detectedYear = null) => {
    try {
      console.log("パース完了。データ行数:", results.data.length);
      
      // エラーチェック
      if (results.errors && results.errors.length > 0) {
        console.error("CSVパースエラー:", results.errors);
        setError(`CSVパースエラー: ${results.errors[0].message || '不明なエラー'}`);
        return;
      }
      
      // 空データチェック
      if (!results.data || results.data.length === 0) {
        setError("CSVデータが空です");
        return;
      }
      
      // 変換済みデータを使用してインポートします
      let convertedData;
      try {
        convertedData = convertCSVData(results.data, detectedYear);
        if (!convertedData || convertedData.length === 0) {
          setError("有効なデータ行が見つかりませんでした。CSVファイルの形式を確認してください。");
          return;
        }
      } catch (error) {
        console.error("データの変換に失敗しました:", error);
        setError(`データの変換に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
        return;
      }
      
      // 変換済みデータをキャッシュ
      setConvertedEmployeeData(convertedData);
      
      // デバッグ情報 - 障がい者データが正しく変換されているか確認
      console.log('変換されたAPIデータ:', convertedData);
      
      // 検出された年度を設定
      if (convertedData[0]?.fiscal_year) {
        setDetectedFiscalYear(convertedData[0].fiscal_year);
      }
      
      // パース済みデータをキャッシュに保存
      setParsedDataCache(results.data);
      setProcessStage('ready');
      
      setImportData(convertedData);
    } catch (error) {
      console.error("データ処理エラー:", error);
      setError(`データの変換に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
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
        try {
          await parseCSVFile(file);
        } catch (error) {
          console.error('パース処理に失敗しました:', error);
          setError(`CSVの解析中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
          return;
        }
        
        if (importData && importData.length > 0) {
          setConvertedEmployeeData(importData);
        } else {
          setError('有効なインポートデータが見つかりませんでした。テンプレート形式を確認してください。');
          setProcessStage('error');
          return;
        }
      }
      
      // デバッグ情報
      console.log('インポートする従業員データ:', convertedEmployeeData || importData);

      // インポート確認
      const dataToImport = convertedEmployeeData || importData;
      if (!dataToImport || dataToImport.length === 0) {
        setError('インポートするデータが見つかりませんでした');
        return;
      }
      
      const numEmployees = dataToImport.length;
      const detectedYear = detectedFiscalYear || fiscalYear;
      
      if (window.confirm(`${detectedYear}年度の${numEmployees}名の従業員データをインポートします。よろしいですか？`)) {
        setIsLoading(true);
        
        // データをコンポーネントに渡す
        onImportSuccess(dataToImport);
        
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

export default EmployeeCSVImportModal;