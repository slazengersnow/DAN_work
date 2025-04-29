import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import './CSVImportModal.css';
import { generateCSVTemplate, downloadCSV, convertTemplateDataToApiFormat, MonthlyCSVData } from './utils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  fiscalYear: number;
}

// PapaParse エラー型の定義
interface ParseError {
  type: string;
  code: string;
  message: string;
  row?: number;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImportSuccess, fiscalYear }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 年度をステート管理（CSVからの読み込み用）
  const [detectedFiscalYear, setDetectedFiscalYear] = useState<number | null>(null);
  
  // 現在のインポート進行状況
  const [importProgress, setImportProgress] = useState<string | null>(null);
  
  // コンポーネントがマウントされた時、またはpropsが変更された時に年度を更新
  useEffect(() => {
    console.log(`年度プロパティが変更されました: ${fiscalYear}`);
  }, [fiscalYear]);

  // モーダルを開いた時にメッセージをクリア
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setImportProgress(null);
      setDetectedFiscalYear(null);
      setFile(null);
    }
  }, [isOpen]);

  // CSVテンプレートのダウンロード
  const handleDownloadTemplate = useCallback(() => {
    console.log(`テンプレートをダウンロード: ${fiscalYear}年度`);
    const csvContent = generateCSVTemplate(fiscalYear);
    downloadCSV(csvContent, `月次データ_テンプレート_${fiscalYear}年度.csv`);
  }, [fiscalYear]);

  // ファイル選択ハンドラ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      console.log(`ファイルが選択されました: ${selectedFile.name} (${selectedFile.size} bytes)`);
      setFile(selectedFile);
      setErrorMessage(null);
      setDetectedFiscalYear(null); // ファイル選択時に検出年度をリセット
      
      // ファイルが選択されたら自動的にパースを試行
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setImportProgress('ファイルを解析中...');
        setTimeout(() => {
          previewCSV(selectedFile);
        }, 100);
      }
    }
  };

  // ファイル選択ボタンクリックハンドラ
  const handleSelectFile = () => {
    console.log('ファイル選択ボタンがクリックされました');
    fileInputRef.current?.click();
  };

  // CSVファイルのプレビュー処理（選択時に自動実行）
  const previewCSV = async (file: File) => {
    try {
      // パースのみ行う（実際のインポートはまだ行わない）
      const parsedData = await parseCSV(file);
      
      // 年度情報を抽出
      let detectedYear: number | null = null;
      
      // CSVの全行をチェックして年度を探す
      for (const row of parsedData) {
        // '年度'キーがある場合
        if ('年度' in row && row['年度'] !== null && row['年度'] !== undefined && row['年度'] !== '') {
          const yearVal = row['年度'];
          
          // 数値の場合
          if (typeof yearVal === 'number' && !isNaN(yearVal) && yearVal >= 1000 && yearVal <= 9999) {
            detectedYear = yearVal;
            break;
          }
          
          // 文字列の場合、4桁の数字を抽出
          if (typeof yearVal === 'string') {
            const match = yearVal.match(/\d{4}/);
            if (match) {
              detectedYear = parseInt(match[0], 10);
              break;
            }
          }
        }
        
        // 列名に年度が含まれている場合（例：2024）
        for (const key of Object.keys(row)) {
          if (/^20\d{2}$/.test(key)) {
            detectedYear = parseInt(key, 10);
            break;
          }
        }
        
        if (detectedYear) break;
      }
      
      // 年度が検出されない場合は現在の設定年度を使用
      if (!detectedYear) {
        // フォールバックとして、CSVの構造から年度を推測
        detectedYear = fiscalYear;
      }
      
      // 年度情報を表示
      setDetectedFiscalYear(detectedYear);
      
      if (detectedYear === fiscalYear) {
        setImportProgress(`現在の設定年度 (${fiscalYear}年度) でインポートの準備ができました。`);
      } else {
        setImportProgress(`CSVから${detectedYear}年度を検出しました。インポートの準備ができました。`);
      }
    } catch (error) {
      console.error('CSVプレビューエラー:', error);
      setImportProgress('CSVファイルの解析中にエラーが発生しました。');
    }
  };

  // CSVファイルのパース処理
  const parseCSV = (file: File): Promise<any[]> => {
    console.log(`CSVファイルのパース開始: ${file.name}`);
    return new Promise((resolve, reject) => {
      // すべてのオプションをanyとして扱い、型エラーを回避
      const parseOptions: any = {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // 数値を自動的に変換
        encoding: 'UTF-8',  // 型定義では対応していないがPapaParseは実際にはサポート
        // 重複ヘッダーの処理を明示的に無効化
        duplicateHeaderMode: 'skip', // 'skip'は最初のヘッダーのみ使用
        // ヘッダー変換処理の強化
        transformHeader: (header: string) => {
          // 空のヘッダーを処理
          if (!header || header.trim() === '') {
            return `_empty_${Math.random().toString(36).substring(2, 9)}`;
          }
          // ヘッダーの空白を削除し、トリミング
          return header.trim();
        },
        complete: (results: any) => {
          const { data, errors, meta } = results;
          
          console.log('パース結果のプレビュー:', {
            dataLength: data?.length,
            errors: errors?.length,
            fields: meta?.fields,
            sample: data?.slice(0, 2)
          });
          
          if (errors && errors.length > 0) {
            console.error('CSVパースエラー:', errors);
            // エラーコードの型チェックを修正
            const criticalErrors = errors.filter((e: any) => 
              e.code && typeof e.code === 'string' && e.code !== 'DUPLICATE_HEADER'
            );
            if (criticalErrors.length > 0) {
              reject(new Error('CSVファイルの解析中にエラーが発生しました'));
              return;
            }
          }

          // 重複ヘッダーの警告がある場合でも処理を続行
          if (meta && meta.fields) {
            console.log('検出されたヘッダー:', meta.fields);
          }

          try {
            // 空行や無効なデータをフィルタリング
            const validData = data.filter((row: any) => {
              // 完全に空のオブジェクトを除外
              if (Object.keys(row).length === 0) {
                return false;
              }
              
              // すべての値が空/null/undefinedのオブジェクトを除外
              const hasAnyValue = Object.values(row).some((v: any) => 
                v !== null && v !== undefined && v !== ''
              );
              
              return hasAnyValue;
            });
            
            // データが空かどうかチェック
            if (validData.length === 0) {
              console.warn('フィルタリング後に有効なデータが見つかりませんでした');
            } else {
              console.log('有効なデータ行数:', validData.length);
              // サンプルデータを表示（最初の2行）
              if (validData.length > 0) {
                console.log('サンプルデータ (最初の行):', validData[0]);
                if (validData.length > 1) {
                  console.log('サンプルデータ (2行目):', validData[1]);
                }
              }
            }
            
            console.log('パース完了。データ行数:', validData.length);
            resolve(validData as any[]);
          } catch (error) {
            console.error('データ変換エラー:', error);
            reject(new Error('CSVデータの変換中にエラーが発生しました'));
          }
        },
        error: (error: Error) => {
          console.error('CSVパースエラー:', error);
          reject(new Error('CSVファイルの読み込み中にエラーが発生しました'));
        }
      };

      try {
        // ファイルをパース処理
        Papa.parse(file, parseOptions);
      } catch (err) {
        console.error('Papaparse実行エラー:', err);
        reject(new Error('CSVファイルの処理中にエラーが発生しました'));
      }
    });
  };

  // CSVデータのAPIへの送信処理 - 改良版
  const importCSVData = async (data: MonthlyCSVData[]) => {
    try {
      setIsLoading(true);
      
      // データが空の場合はエラー
      if (data.length === 0) {
        setErrorMessage('インポートするデータが見つかりませんでした。');
        setIsLoading(false);
        return;
      }
      
      console.log(`インポート処理開始: ${data.length}件のデータ`);
      
      // 月の値がnullやNaNでないか確認し、フィルタリング
      const validData = data.filter(item => 
        item.month !== null && !isNaN(item.month)
      );
      
      console.log('有効なデータ:', validData.length, '件');
      console.log('インポートするデータ:', JSON.stringify(validData, null, 2));
      
      if (validData.length === 0) {
        setErrorMessage('有効な月情報が見つかりませんでした。テンプレート形式を確認してください。');
        setIsLoading(false);
        return;
      }
      
      setImportProgress(`${validData.length}件のデータをインポート中...`);
      
      // 各月のデータを順次APIに送信
      const results = await Promise.all(
        validData.map(async (monthData, index) => {
          // 処理状況の更新
          setImportProgress(`${index + 1}/${validData.length}件目: ${monthData.fiscal_year}年度${monthData.month}月のデータをインポート中...`);
          
          try {
            // 既存データの確認
            const checkUrl = `${API_BASE_URL}/monthly-reports/${monthData.fiscal_year}/${monthData.month}`;
            console.log(`既存データ確認 GET: ${checkUrl}`);
            
            try {
              const checkResponse = await axios.get(checkUrl);
              
              if (checkResponse.data && checkResponse.data.success) {
                // 既存データがある場合は更新
                const updateUrl = `${API_BASE_URL}/monthly-reports/${monthData.fiscal_year}/${monthData.month}`;
                console.log(`データ更新 PUT: ${updateUrl}`);
                
                // データ型変換を追加（すべてのパートタイム障がい者関連のフィールドを整数に）
                const fixedData = {
                  ...monthData,
                  other_parttime_count: Math.round(monthData.other_parttime_count || 0)
                };
                
                return await axios.put(updateUrl, fixedData);
              }
            } catch (error) {
              // 404エラーなど - データが存在しない場合は新規作成
              console.log(`${monthData.fiscal_year}年度${monthData.month}月のデータは存在しません。新規作成します。`);
            }
            
            // 新規データ作成
            const createUrl = `${API_BASE_URL}/monthly-reports`;
            console.log(`データ新規作成 POST: ${createUrl}`);
            
            // データ型変換を追加（すべてのパートタイム障がい者関連のフィールドを整数に）
            const fixedData = {
              ...monthData,
              other_parttime_count: Math.round(monthData.other_parttime_count || 0)
            };
            
            return await axios.post(createUrl, fixedData);
          } catch (error) {
            console.error(`${monthData.fiscal_year}年度${monthData.month}月のデータ処理中にエラー:`, error);
            throw error;
          }
        })
      );
      
      console.log('インポート結果:', results);
      
      // APIレスポンスをチェック
      const successResponses = results.filter(res => res && res.data && res.data.success);
      console.log(`成功したレスポンス: ${successResponses.length}/${results.length}`);
      
      if (successResponses.length > 0) {
        const yearUsed = validData[0].fiscal_year;
        setSuccessMessage(`${yearUsed}年度の月次データをインポートしました。(${successResponses.length}/${results.length}件成功)`);
        
        // 少し待ってからコールバックを実行
        setTimeout(() => {
          try {
            if (onImportSuccess) {
              console.log('インポート成功コールバックを実行');
              onImportSuccess();
            }
            
            // 最後にモーダルを閉じる
            onClose();
          } catch (err) {
            console.error('コールバック実行エラー:', err);
          }
        }, 2000);
      } else {
        setErrorMessage('データのインポートに失敗しました。');
      }
    } catch (error) {
      console.error('インポートエラー:', error);
      setErrorMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
    } finally {
      setIsLoading(false);
      setImportProgress(null);
    }
  };

  // インポート実行
  const handleImport = async () => {
    if (!file) {
      setErrorMessage('ファイルを選択してください。');
      return;
    }
    
    try {
      setImportProgress('CSVファイルを解析中...');
      
      // CSVをパース
      const parsedData = await parseCSV(file);
      
      if (parsedData.length === 0) {
        setErrorMessage('インポートするデータが見つかりませんでした。');
        setImportProgress(null);
        return;
      }
      
      console.log('パース済みデータ:', parsedData);
      
      // 検出された年度またはデフォルト年度を使用
      const yearToUse = detectedFiscalYear || fiscalYear;
      console.log(`インポートに使用する年度: ${yearToUse}`);
      
      // CSVから年度を抽出する新しい処理に変更
      setImportProgress('データを変換中...');
      const apiFormatData = convertTemplateDataToApiFormat(parsedData, yearToUse);
      
      console.log('API形式データ:', apiFormatData);
      
      if (apiFormatData.length === 0) {
        setErrorMessage('有効なインポートデータが見つかりませんでした。CSVファイルが正しいテンプレート形式かどうか確認してください。一般的な原因は、月の行が正しく認識できていないか、データ行にキーワード（従業員数や法定雇用率など）が含まれていない可能性があります。');
        setImportProgress(null);
        return;
      }

      // インポート前に検出された年度を反映
      const detectedYear = apiFormatData[0].fiscal_year;
      
      // インポート前に年度確認のメッセージを表示
      if (window.confirm(`${detectedYear}年度のデータとして${apiFormatData.length}件のデータをインポートします。よろしいですか？`)) {
        // データをインポート
        await importCSVData(apiFormatData);
      } else {
        setImportProgress(null);
      }
    } catch (error) {
      console.error('インポートエラー:', error);
      setErrorMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
      setImportProgress(null);
    }
  };

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="csv-import-modal-overlay">
      <div className="csv-import-modal">
        <div className="csv-import-modal-header">
          <h2>月別データのインポート</h2>
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
          
          {/* 説明セクション */}
          <div className="import-info-section">
            <p>
              CSVファイルから月次データをインポートします。
              テンプレートをダウンロードして必要なデータを入力してください。
            </p>
            <p>
              <strong>注意:</strong> テンプレートには「年度」行があります。この値を変更した場合、
              その年度でデータがインポートされます。現在選択されている年度（{fiscalYear}年度）のテンプレートを
              ダウンロードすることをお勧めします。
            </p>
            <p>
              <strong>重要:</strong> テンプレートの形式を変更しないでください。特に「月」の行と各項目名（「従業員数 (名)」など）は
              正確に記載してください。
            </p>
          </div>
          
          {/* テンプレートダウンロードボタン */}
          <div>
            <button 
              className="import-template-button"
              onClick={handleDownloadTemplate}
              disabled={isLoading}
            >
              {fiscalYear}年度用テンプレートをダウンロード
            </button>
            <div style={{ 
              marginTop: '6px', 
              color: '#666', 
              fontSize: '0.85rem' 
            }}>
              ダウンロードしたテンプレートに直接データを入力し、保存してからインポートしてください。
            </div>
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
          
          {/* 進行状況表示 */}
          {importProgress && (
            <div className="import-progress">
              <div className="progress-indicator"></div>
              <p>{importProgress}</p>
            </div>
          )}
          
          {/* 検出された年度表示 */}
          {detectedFiscalYear && (
            <div className="detected-year">
              <p>
                <strong>検出された年度:</strong> {detectedFiscalYear}年度
              </p>
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
            disabled={!file || isLoading}
          >
            {isLoading ? 'インポート中...' : 'インポート'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;