/**
 * CSVImportStateSync.jsx
 * 
 * このコンポーネントはCSVインポート後の状態同期と画面更新を改善します。
 * MonthlyReport/index.jsx に統合して使用します。
 * 
 * 主な機能:
 * 1. インポート後の画面自動更新
 * 2. 既存データとインポートデータの同期
 * 3. データロード・表示のライフサイクル最適化
 */

import React, { useContext, useEffect, useRef, useState } from 'react';
import { YearMonthContext } from './YearMonthContext';

/**
 * CSVインポート後の状態同期を処理するフック
 */
export const useCSVImportSync = (refreshData, year, month) => {
  // 最後のインポート情報
  const [lastImport, setLastImport] = useState(null);
  // リフレッシュカウンタ（強制再描画用）
  const [refreshCounter, setRefreshCounter] = useState(0);
  // リロード試行回数の追跡
  const retryCountRef = useRef(0);
  // リフレッシュ中フラグ
  const [isRefreshing, setIsRefreshing] = useState(false);
  // レンダリングフラグ
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  // CSVインポートが成功したことをシステムに通知する関数
  const handleImportSuccess = async () => {
    const importTimestamp = Date.now();
    const importInfo = {
      timestamp: importTimestamp,
      year,
      month
    };
    
    setLastImport(importInfo);
    // 意図的に少し遅延してからデータ再読み込み
    setTimeout(() => {
      console.log('CSVインポート完了後のデータ再読み込みを開始します...');
      refreshWithRetry();
    }, 800);
    
    // 1秒後に再描画トリガー
    setTimeout(() => {
      setRenderTrigger(prev => prev + 1);
    }, 1000);
    
    // ローカルストレージに最終インポート情報を保存
    try {
      localStorage.setItem('csvImport_lastImport', JSON.stringify(importInfo));
    } catch (error) {
      console.error('インポート情報の保存中にエラーが発生しました:', error);
    }
    
    return importInfo;
  };
  
  // 初期ロード時に過去のインポート情報を復元
  useEffect(() => {
    try {
      const storedImport = localStorage.getItem('csvImport_lastImport');
      if (storedImport) {
        const importInfo = JSON.parse(storedImport);
        // 24時間以内のインポート情報のみ復元
        if (Date.now() - importInfo.timestamp < 24 * 60 * 60 * 1000) {
          setLastImport(importInfo);
        } else {
          localStorage.removeItem('csvImport_lastImport');
        }
      }
    } catch (error) {
      console.error('保存されたインポート情報の読み込み中にエラーが発生しました:', error);
    }
  }, []);
  
  // リトライ機能付きのデータリフレッシュ
  const refreshWithRetry = async () => {
    if (isRefreshing) return; // 既に実行中なら何もしない
    
    setIsRefreshing(true);
    try {
      if (typeof refreshData === 'function') {
        console.log(`データリフレッシュを開始 (試行 ${retryCountRef.current + 1}/3)`);
        await refreshData();
        // 成功したらカウンタリセット
        retryCountRef.current = 0;
      }
    } catch (error) {
      console.error('データリフレッシュ中にエラーが発生しました:', error);
      
      // 最大3回までリトライ
      if (retryCountRef.current < 2) {
        retryCountRef.current++;
        // 指数バックオフで遅延
        const delay = 1000 * Math.pow(2, retryCountRef.current);
        console.log(`${delay}ms後に再試行します (${retryCountRef.current}/2)`);
        
        setTimeout(() => {
          refreshWithRetry();
        }, delay);
      } else {
        console.error('最大リトライ回数に達しました。データの再読み込みに失敗しました。');
        retryCountRef.current = 0;
      }
    } finally {
      if (retryCountRef.current === 0) {
        setIsRefreshing(false);
        setRefreshCounter(prev => prev + 1);
      }
    }
  };
  
  return {
    handleImportSuccess,
    refreshWithRetry,
    lastImport,
    refreshCounter,
    isRefreshing,
    renderTrigger
  };
};

/**
 * インポート後の状態同期コンポーネント
 */
const CSVImportStateSync = ({ children, refreshData }) => {
  const { year, month } = useContext(YearMonthContext);
  const sync = useCSVImportSync(refreshData, year, month);
  
  // インポート完了時のライフサイクル処理を行うための拡張されたコンテキスト
  const enhancedContext = {
    year,
    month,
    onImportSuccess: sync.handleImportSuccess,
    refreshData: sync.refreshWithRetry,
    isRefreshing: sync.isRefreshing,
    lastImport: sync.lastImport
  };
  
  return (
    <YearMonthContext.Provider value={enhancedContext}>
      {/* キー変更で強制再レンダリング */}
      <div key={`sync-wrapper-${sync.renderTrigger}`}>
        {children}
      </div>
    </YearMonthContext.Provider>
  );
};

export default CSVImportStateSync;

/**
 * YearMonthContext.jsxへの統合方法
 * 
 * 1. YearMonthContext.jsxにuseCSVImportSyncフックをインポート
 * 2. 以下のようにYearMonthProviderコンポーネントを拡張:
 * 
 * // YearMonthProvider コンポーネント内
 * const importSync = useCSVImportSync(refreshData, year, month);
 * 
 * // コンテキスト値に追加
 * const contextValue = {
 *   year,
 *   month,
 *   setYear,
 *   setMonth,
 *   onImportSuccess: importSync.handleImportSuccess, // 追加
 *   refreshData: importSync.refreshWithRetry,        // 追加
 *   isRefreshing: importSync.isRefreshing,          // 追加
 *   lastImport: importSync.lastImport                // 追加
 * };
 * 
 * 3. CSVImportModalコンポーネントの呼び出し時に以下のように使用:
 * <CSVImportModal
 *   isOpen={isImportModalOpen}
 *   onClose={() => setImportModalOpen(false)}
 *   onImportSuccess={onImportSuccess} // コンテキストから提供される関数
 *   fiscalYear={year}
 * />
 */

/**
 * MonthlyReportページへの実装手順
 * 
 * 1. MonthlyReport/index.jsx で CSVImportStateSync をインポート
 * 2. メインコンポーネントを CSVImportStateSync でラップ:
 * 
 * import CSVImportStateSync from './CSVImportStateSync';
 * 
 * // MonthlyReport コンポーネント内
 * return (
 *   <YearMonthProvider>
 *     <CSVImportStateSync refreshData={fetchAllData}>
 *       <div className="monthly-report-container">
 *         ...元の内容...
 *       </div>
 *     </CSVImportStateSync>
 *   </YearMonthProvider>
 * );
 * 
 * 3. CSVImportModalの使用時にコンテキストから取得した onImportSuccess を渡す:
 * 
 * // YearMonthContext から値を取得
 * const { year, month, onImportSuccess } = useContext(YearMonthContext);
 * 
 * // CSVImportModalに渡す
 * <CSVImportModal
 *   isOpen={isImportModalOpen}
 *   onClose={() => setImportModalOpen(false)}
 *   onImportSuccess={onImportSuccess}
 *   fiscalYear={year}
 * />
 */