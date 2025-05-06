import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import axios, { AxiosResponse, AxiosError } from 'axios';
import Papa, { ParseResult } from 'papaparse';
import './CSVImportModal.css';
import { generateCSVTemplate, downloadCSV, convertTemplateDataToApiFormat, MonthlyCSVData } from './utils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  fiscalYear: number;
}

/**
 * 拡張されたCSVインポートモーダルコンポーネント - エラーハンドリング強化版
 */
const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImportSuccess, fiscalYear }) => {
  // 状態管理
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 年度をステート管理（CSVからの読み込み用）
  const [detectedFiscalYear, setDetectedFiscalYear] = useState<number | null>(null);
  
  // 現在のインポート進行状況
  const [importProgress, setImportProgress] = useState<number>(0);
  
  // 処理段階の状態管理
  const [processStage, setProcessStage] = useState<'initial' | 'parsing' | 'ready' | 'importing' | 'completed' | 'error'>('initial');
  
  // パースされたデータのキャッシュ
  const [parsedDataCache, setParsedDataCache] = useState<any[] | null>(null);
  
  // API処理結果の追跡
  const [processedMonths, setProcessedMonths] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<string>('');
  
  // 変換後のAPIデータキャッシュ
  const [convertedApiData, setConvertedApiData] = useState<MonthlyCSVData[] | null>(null);

  // リトライ機能のためのカウンター
  const [retryCount, setRetryCount] = useState<number>(0);
  const MAX_RETRIES = 3;
  
  // ステータスメッセージ
  const statusMessage = useMemo(() => {
    switch (processStage) {
      case 'parsing':
        return 'ファイル解析中...';
      case 'ready':
        return `${detectedFiscalYear || fiscalYear}年度のデータ (${parsedDataCache?.length || 0}行) の準備完了`;
      case 'importing':
        return `インポート中... ${importProgress}%`;
      case 'completed':
        return 'インポート完了！';
      case 'error':
        return 'エラーが発生しました';
      default:
        return '';
    }
  }, [processStage, importProgress, detectedFiscalYear, fiscalYear, parsedDataCache]);

  // 年度情報メッセージ - 検出された年度と選択されている年度が異なる場合に表示
  const yearInfoMessage = useMemo(() => {
    if (detectedFiscalYear && detectedFiscalYear !== fiscalYear) {
      return `テンプレートから${detectedFiscalYear}年度が検出されました。このデータは${detectedFiscalYear}年度としてインポートされます。`;
    } else if (detectedFiscalYear === null && parsedDataCache && parsedDataCache.length > 0) {
      return `テンプレートに年度情報がないため、現在選択されている${fiscalYear}年度としてインポートされます。`;
    }
    return null;
  }, [detectedFiscalYear, fiscalYear, parsedDataCache]);

  // コンポーネントがマウントされた時、またはpropsが変更された時に年度を更新
  useEffect(() => {
    console.log(`年度プロパティが変更されました: ${fiscalYear}`);
  }, [fiscalYear]);

  // モーダルを開いた時にステートをリセット
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setImportProgress(0);
      setDetectedFiscalYear(null);
      setFile(null);
      setProcessStage('initial');
      setParsedDataCache(null);
      setProcessedMonths([]);
      setImportSummary('');
      setConvertedApiData(null);
      setRetryCount(0);
    }
  }, [isOpen]);

  // バッチサイズを動的に計算（パフォーマンス最適化）
  const calculateBatchSize = (totalItems: number): number => {
    // 項目数が少ない場合は全て同時処理
    if (totalItems <= 3) return totalItems;
    // 項目数が多い場合は最大5件ずつ
    return Math.min(5, Math.ceil(totalItems / 3));
  };

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
      setDetectedFiscalYear(null);
      setParsedDataCache(null);
      setProcessStage('parsing');
      setConvertedApiData(null);
      
      // ファイル解析を即時開始
      parseCSVFile(selectedFile);
    }
  };

  // ファイル選択ボタンクリックハンドラ
  const handleSelectFile = () => {
    console.log('ファイル選択ボタンがクリックされました');
    fileInputRef.current?.click();
  };

  // CSVファイル解析 - 高度なエラーハンドリングを追加
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
        // エラーチェック - メッセージベースで判断
        if (results.errors && results.errors.length > 0) {
          // 一般的なエラーパターン - 重大なエラーかどうかをメッセージで判断
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
          // 年度を検出（utils.ts内の関数で処理）
          const convertedData = convertTemplateDataToApiFormat(validData, fiscalYear);
          
          // データが変換できた場合
          if (convertedData && convertedData.length > 0) {
            // 検出された年度を設定
            setDetectedFiscalYear(convertedData[0].fiscal_year);
            
            // API形式のデータをキャッシュ
            setConvertedApiData(convertedData);
            
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
        // パース実行 - 型定義に合わせて必要な設定のみ使用
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

  // 休止する関数（リトライ時の待機用）
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // APIリクエストを送信する関数（リトライ機能付き）
  const sendApiRequest = async (method: string, url: string, data?: any): Promise<AxiosResponse> => {
    let lastError: Error | null = null;
    // リトライロジック
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // 初回以外は待機時間を設ける（指数バックオフ）
        if (attempt > 0) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          await sleep(waitTime);
          console.log(`リトライ #${attempt} (${url})...`);
        }
        
        let response;
        if (method.toUpperCase() === 'GET') {
          response = await axios.get(url, { timeout: 5000 });
        } else if (method.toUpperCase() === 'POST') {
          response = await axios.post(url, data, { timeout: 5000 });
        } else if (method.toUpperCase() === 'PUT') {
          response = await axios.put(url, data, { timeout: 5000 });
        } else {
          throw new Error(`未対応のHTTPメソッド: ${method}`);
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // APIエンドポイントが存在しない場合
        if (error instanceof AxiosError && error.response?.status === 404) {
          // 404エラーの場合は、別のエンドポイントを試す
          if (url.includes('/monthly-reports/')) {
            // /monthly-reports/ から /monthly-report/ に変更してリトライ
            url = url.replace('/monthly-reports/', '/monthly-report/');
            console.log(`エンドポイント変更: ${url}`);
            
            // リトライカウントをリセット（新しいURLなので）
            attempt = -1; // 次のループで0になる
            continue;
          }
        }
        
        // 最大リトライ回数に達した場合、またはキャンセルされた場合は例外をスロー
        if (attempt === MAX_RETRIES) {
          console.error(`リクエスト失敗 (${MAX_RETRIES}回リトライ後): ${url}`, error);
          throw error;
        }
      }
    }
    
    // 実行されることはないはずだが、TypeScriptのエラーを回避するために必要
    throw lastError;
  };  

  // 既存データチェック - 非同期関数として実装
  const checkExistingData = async (fiscalYear: number, month: number): Promise<boolean> => {
    try {
      const response = await sendApiRequest(
        'GET',
        `${API_BASE_URL}/monthly-reports/${fiscalYear}/${month}`
      );
      return !!(response && response.data && response.data.success);
    } catch (error) {
      console.log(`${fiscalYear}年${month}月のデータは存在しません`);
      return false;
    }
  };
  
  // インポート結果サマリーの生成
  const generateImportSummary = (statusList: { month: number, status: string }[]): string => {
    const counts = {
      新規: 0,
      更新: 0,
      エラー: 0,
      合計: statusList.length
    };
    
    statusList.forEach(item => {
      if (item.status === '新規') counts.新規++;
      else if (item.status === '更新') counts.更新++;
      else if (item.status === 'エラー') counts.エラー++;
    });
    
    return `合計: ${counts.合計}件（新規: ${counts.新規}件、更新: ${counts.更新}件${counts.エラー > 0 ? `、エラー: ${counts.エラー}件` : ''}）`;
  };

  // CSVデータのAPIへのインポート - 完全に再設計
  const importCSVData = async (data: MonthlyCSVData[]) => {
    try {
      setIsLoading(true);
      setProcessStage('importing');
      setImportProgress(0);
      setProcessedMonths([]);
      
      // データが空の場合はエラー
      if (data.length === 0) {
        setErrorMessage('インポートするデータが見つかりませんでした。');
        setIsLoading(false);
        setProcessStage('error');
        return;
      }
      
      console.log(`インポート処理開始: ${data.length}件のデータ`);
      
      // 月の値が有効かチェック
      const validData = data.filter(item => 
        item.month !== null && !isNaN(item.month)
      );
      
      if (validData.length === 0) {
        setErrorMessage('有効な月情報が見つかりませんでした。');
        setIsLoading(false);
        setProcessStage('error');
        return;
      }
      
      // バッチサイズを動的に計算
      const BATCH_SIZE = calculateBatchSize(validData.length);
      const results: AxiosResponse<any>[] = [];
      
      // 完了したデータを追跡
      const processedMonthsArray: string[] = [];
      
      // ステータスリスト
      const statusList: { month: number, status: string }[] = [];
      
      // バッチ処理のヘルパー関数（順次処理に変更）
      const processBatches = async () => {
        for (let i = 0; i < validData.length; i += BATCH_SIZE) {
          const startIndex = i;
          const endIndex = Math.min(startIndex + BATCH_SIZE, validData.length);
          const batch = validData.slice(startIndex, endIndex);
          
          // バッチを順次処理
          for (const monthData of batch) {
            try {
              // まず対象データの存在をチェック
              const existingData = await checkExistingData(monthData.fiscal_year, monthData.month);
              
              let response;
              if (existingData) {
                // 既存データの更新
                console.log(`${monthData.fiscal_year}年度${monthData.month}月のデータを更新します`);
                try {
                  response = await sendApiRequest(
                    'PUT',
                    `${API_BASE_URL}/monthly-reports/${monthData.fiscal_year}/${monthData.month}`,
                    monthData
                  );
                  processedMonthsArray.push(`${monthData.month}月(更新)`);
                  statusList.push({ month: monthData.month, status: '更新' });
                } catch (error) {
                  // 更新に失敗した場合はPOSTを試みる
                  console.log(`PUT要求失敗、POST要求を試みます`);
                  response = await sendApiRequest(
                    'POST',
                    `${API_BASE_URL}/monthly-reports/${monthData.fiscal_year}/${monthData.month}`,
                    monthData
                  );
                  processedMonthsArray.push(`${monthData.month}月(POST更新)`);
                  statusList.push({ month: monthData.month, status: '更新' });
                }
              } else {
                // 新規データの作成（2つのエンドポイントを試す）
                console.log(`${monthData.fiscal_year}年度${monthData.month}月のデータを新規作成します`);
                try {
                  // エンドポイント1: /monthly-reports
                  response = await sendApiRequest(
                    'POST',
                    `${API_BASE_URL}/monthly-reports`,
                    monthData
                  );
                } catch (error) {
                  // エンドポイント1が失敗した場合、エンドポイント2を試す
                  console.log(`エンドポイント1失敗、エンドポイント2を試みます`);
                  try {
                    // エンドポイント2: /monthly-reports/:year/:month
                    response = await sendApiRequest(
                      'POST',
                      `${API_BASE_URL}/monthly-reports/${monthData.fiscal_year}/${monthData.month}`,
                      monthData
                    );
                  } catch (innerError) {
                    // 両方のエンドポイントが失敗した場合
                    console.error(`両方のエンドポイントが失敗しました: ${innerError}`);
                    throw innerError; // 外側のcatchブロックに委譲
                  }
                }
                
                processedMonthsArray.push(`${monthData.month}月(新規)`);
                statusList.push({ month: monthData.month, status: '新規' });
              }
              
              if (response && response.data) {
                results.push(response);
              }
            } catch (error) {
              console.error(`${monthData.month}月データの処理中にエラー:`, error);
              processedMonthsArray.push(`${monthData.month}月(エラー)`);
              statusList.push({ month: monthData.month, status: 'エラー' });
            }
          }
          
          // 進捗率を更新
          const progressPercent = Math.round(((endIndex) / validData.length) * 100);
          setImportProgress(Math.min(progressPercent, 100));
          setProcessedMonths([...processedMonthsArray]);
        }
        
        return results;
      };
      
      // 順次処理を開始
      const batchResults = await processBatches();
      
      // 結果の確認
      const successResponses = batchResults.filter(res => res && res.data && res.data.success);
      console.log(`成功したレスポンス: ${successResponses.length}/${batchResults.length}`);
      console.log('処理した月:', processedMonthsArray.join(', '));
      
      // ステータスから結果サマリーを作成
      const summary = generateImportSummary(statusList);
      setImportSummary(summary);
      
      if (successResponses.length > 0) {
        const yearUsed = validData[0].fiscal_year;
        setSuccessMessage(`${yearUsed}年度の月次データをインポートしました。(${successResponses.length}/${batchResults.length}件)`);
        setProcessStage('completed');
        
        // 遅延処理を最適化
        setTimeout(() => {
          if (onImportSuccess) {
            console.log('インポート成功コールバックを実行');
            onImportSuccess();
          }
          // モーダルを閉じる
          onClose();
        }, 800);
      } else {
        setErrorMessage('データのインポートに失敗しました。');
        setProcessStage('error');
      }
    } catch (error) {
      console.error('インポートエラー:', error);
      setErrorMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
      setProcessStage('error');
    } finally {
      setIsLoading(false);
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
      if (convertedApiData && convertedApiData.length > 0) {
        console.log('変換済みデータを使用してインポートします');
      } else {
        // 変換済みデータがない場合は再変換
        console.log(`インポートに使用する年度: ${detectedFiscalYear || fiscalYear}`);
        const apiFormatData = convertTemplateDataToApiFormat(parsedDataCache, detectedFiscalYear || fiscalYear);
        setConvertedApiData(apiFormatData);
        
        if (apiFormatData.length === 0) {
          setErrorMessage('有効なインポートデータが見つかりませんでした。テンプレート形式を確認してください。');
          setProcessStage('error');
          return;
        }
      }
      
      // デバッグ情報 - 障がい者データが正しく変換されているか確認
      console.log('変換されたAPIデータ:', convertedApiData);

      // インポート確認
      const detectedYear = convertedApiData![0].fiscal_year;
      if (window.confirm(`${detectedYear}年度の${convertedApiData!.length}件のデータをインポートします。よろしいですか？`)) {
        await importCSVData(convertedApiData!);
      }
    } catch (error) {
      console.error('インポートエラー:', error);
      setErrorMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
      setProcessStage('error');
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
          
          {/* コンパクトな説明セクション */}
          <div className="import-info-section">
            <p>
              CSVファイルから月次データをインポートします。
              テンプレートをダウンロードして必要なデータを入力してください。
              <button 
                className="import-template-button"
                onClick={handleDownloadTemplate}
                disabled={isLoading}
              >
                {fiscalYear}年度テンプレートをダウンロード
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
                {processStage === 'parsing' || processStage === 'importing' ? (
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
              
              {/* プログレスバー */}
              {(processStage === 'parsing' || processStage === 'importing') && (
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${processStage === 'parsing' ? 50 : importProgress}%` 
                    }}
                  ></div>
                </div>
              )}
              
              {/* 検出された年度表示 */}
              {yearInfoMessage && (
                <div className="detected-year-info">
                  <span>{yearInfoMessage}</span>
                </div>
              )}
              
              {/* インポート進捗状況 */}
              {processStage === 'importing' && processedMonths.length > 0 && (
                <div className="import-status-list">
                  <div className="processed-months-label">処理中:</div>
                  <div className="processed-months-items">
                    {processedMonths.map((item, index) => (
                      <span key={index} className="processed-month-item">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* インポート完了サマリー */}
              {processStage === 'completed' && importSummary && (
                <div className="import-summary">
                  <span>{importSummary}</span>
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
            disabled={!file || isLoading || processStage === 'error' || processStage === 'importing' || processStage === 'parsing'}
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

export default CSVImportModal;