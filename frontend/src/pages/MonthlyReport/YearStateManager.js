/**
 * YearStateManager.js - 年度管理改善ユーティリティ
 * 
 * CSVインポート後に年度が勝手に切り替わる問題を修正し、
 * 年度状態を安定して管理するためのユーティリティクラスです。
 * 
 * 主な機能:
 * 1. インポート前の年度を記憶し、インポート後も同じ年度を維持
 * 2. 年度切り替えイベントを監視し、不要な切り替えを防止
 * 3. 年度状態の変更履歴を追跡
 * 
 * 使用方法:
 * YearMonthProvider コンポーネントと統合して使用します。
 * 
 * 作成: 2025年5月
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 年度状態管理のためのカスタムフック
 * @param {number} initialYear - 初期年度
 * @param {Function} setContextYear - コンテキストの年度設定関数
 * @return {Object} 年度管理に関するユーティリティ
 */
export const useYearStateManager = (initialYear, setContextYear) => {
  // 年度に関する状態
  const [activeYear, setActiveYear] = useState(initialYear);
  const [importInProgress, setImportInProgress] = useState(false);
  const preImportYearRef = useRef(initialYear);
  
  // 年度変更履歴
  const yearChangeHistoryRef = useRef([]);
  
  // 不要な年度変更を防ぐためのロックフラグ
  const yearChangeLockRef = useRef(false);
  
  // 年度変更をロックする関数（指定時間後に自動解除）
  const lockYearChange = useCallback((durationMs = 3000) => {
    yearChangeLockRef.current = true;
    
    // 指定時間後にロックを解除
    setTimeout(() => {
      yearChangeLockRef.current = false;
    }, durationMs);
    
    console.log(`年度変更をロックしました (${durationMs}ms)`);
  }, []);
  
  // 年度変更履歴に記録する関数
  const recordYearChange = useCallback((oldYear, newYear, source) => {
    const record = {
      timestamp: new Date(),
      oldYear,
      newYear,
      source
    };
    
    yearChangeHistoryRef.current.push(record);
    
    // 最大20件まで履歴を保持
    if (yearChangeHistoryRef.current.length > 20) {
      yearChangeHistoryRef.current = yearChangeHistoryRef.current.slice(-20);
    }
    
    // デバッグ用にローカルストレージにも保存
    try {
      const storedHistory = JSON.parse(localStorage.getItem('yearChangeHistory') || '[]');
      const updatedHistory = [...storedHistory, record].slice(-20);
      localStorage.setItem('yearChangeHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('年度変更履歴の保存に失敗しました:', error);
    }
    
    console.log(`年度変更を記録: ${oldYear} → ${newYear} (ソース: ${source})`);
  }, []);
  
  // CSVインポート開始前の年度を記録
  const recordPreImportYear = useCallback(() => {
    preImportYearRef.current = activeYear;
    setImportInProgress(true);
    console.log(`CSVインポート前の年度を記録: ${preImportYearRef.current}`);
  }, [activeYear]);
  
  // CSVインポート完了後に年度を復元
  const restoreYearAfterImport = useCallback(() => {
    const savedYear = preImportYearRef.current;
    console.log(`CSVインポート後の年度を復元: ${savedYear}`);
    
    // 年度変更をロック
    lockYearChange();
    
    // インポート状態を更新
    setImportInProgress(false);
    
    // コンテキストとローカル状態の年度を復元
    setActiveYear(savedYear);
    setContextYear(savedYear);
    
    // 変更履歴に記録
    recordYearChange('(インポート後の自動変更)', savedYear, 'import_complete');
    
    return savedYear;
  }, [setContextYear, lockYearChange, recordYearChange]);
  
  // 安全に年度を変更する関数
  const safelySetYear = useCallback((newYear, source = 'manual') => {
    // ロック中は変更をスキップ
    if (yearChangeLockRef.current) {
      console.warn(`年度変更はロックされています: ${activeYear} → ${newYear} (スキップ)`);
      return false;
    }
    
    // CSVインポート中は変更をスキップ
    if (importInProgress) {
      console.warn(`CSVインポート中は年度変更できません: ${activeYear} → ${newYear} (スキップ)`);
      return false;
    }
    
    // 有効な年度かチェック
    if (typeof newYear !== 'number' || isNaN(newYear) || newYear < 2000 || newYear > 2100) {
      console.error(`無効な年度です: ${newYear}`);
      return false;
    }
    
    // 変更なしの場合はスキップ
    if (newYear === activeYear) {
      return false;
    }
    
    // 変更を記録
    recordYearChange(activeYear, newYear, source);
    
    // 年度を更新
    setActiveYear(newYear);
    setContextYear(newYear);
    
    return true;
  }, [activeYear, importInProgress, recordYearChange, setContextYear]);
  
  // 年度変更イベントを監視（不正な自動変更を検出・防止）
  useEffect(() => {
    const handleYearChange = (event) => {
      const { year } = event.detail;
      
      // 年度のみが変更された場合
      if (year && year !== activeYear) {
        console.log(`年度変更イベントを検出: ${activeYear} → ${year}`);
        
        // インポート中は変更をブロック
        if (importInProgress) {
          console.warn('インポート中の自動年度変更を防止しました');
          
          // 元の年度を復元
          setTimeout(() => {
            setContextYear(activeYear);
          }, 0);
          
          // 変更履歴に記録
          recordYearChange(year, activeYear, 'blocked_during_import');
          
          // イベントをキャンセル（残念ながらCustomEventは停止できないが、記録のため）
          if (event.preventDefault) {
            event.preventDefault();
          }
          
          return false;
        }
        
        // 通常の年度変更は記録
        recordYearChange(activeYear, year, 'event');
      }
    };
    
    // カスタムイベントをリッスン
    window.addEventListener('fiscalYearChanged', handleYearChange);
    
    return () => {
      window.removeEventListener('fiscalYearChanged', handleYearChange);
    };
  }, [activeYear, importInProgress, recordYearChange, setContextYear]);
  
  // 現在の年度状態を取得する関数
  const getYearState = useCallback(() => {
    return {
      activeYear,
      preImportYear: preImportYearRef.current,
      importInProgress: importInProgress,
      yearChangeLocked: yearChangeLockRef.current,
      yearChangeHistory: [...yearChangeHistoryRef.current]
    };
  }, [activeYear, importInProgress]);
  
  // デバッグ用にコンソールに情報を出力
  const debug = useCallback(() => {
    console.group('年度状態マネージャー情報');
    console.log('現在の年度:', activeYear);
    console.log('インポート前の年度:', preImportYearRef.current);
    console.log('インポート中:', importInProgress);
    console.log('年度変更ロック:', yearChangeLockRef.current);
    console.log('年度変更履歴:', yearChangeHistoryRef.current);
    console.groupEnd();
  }, [activeYear, importInProgress]);
  
  return {
    activeYear,
    importInProgress,
    recordPreImportYear,
    restoreYearAfterImport,
    safelySetYear,
    lockYearChange,
    getYearState,
    debug
  };
};

/**
 * YearMonthContextへの統合に必要なユーティリティ
 */
export const enhanceYearMonthContext = (YearMonthContext, React) => {
  const originalProvider = YearMonthContext.Provider;
  
  // 拡張されたプロバイダーコンポーネント
  const EnhancedYearMonthProvider = ({ children, value, ...props }) => {
    // 既存のプロバイダー値を拡張
    const enhancedValue = {
      ...value,
      yearStateManager: useYearStateManager(value.fiscalYear, value.setFiscalYear)
    };
    
    return React.createElement(
      originalProvider,
      { value: enhancedValue, ...props },
      children
    );
  };
  
  return {
    ...YearMonthContext,
    Provider: EnhancedYearMonthProvider
  };
};

/**
 * YearStateManager を YearMonthProvider に統合する方法
 * 
 * YearMonthContext.tsx に次のコードを追加:
 * 
 * ```tsx
 * import { useYearStateManager } from './YearStateManager';
 * 
 * // YearMonthProvider 内部で:
 * const yearStateManager = useYearStateManager(fiscalYear, setFiscalYear);
 * 
 * // コンテキスト値に追加
 * return (
 *   <YearMonthContext.Provider value={{ 
 *     fiscalYear, 
 *     month, 
 *     setFiscalYear, 
 *     setMonth,
 *     dispatchYearMonthChange,
 *     yearStateManager // 追加
 *   }}>
 *     {children}
 *   </YearMonthContext.Provider>
 * );
 * ```
 * 
 * インポート処理時の使用例:
 * 
 * ```tsx
 * const { yearStateManager } = useYearMonth();
 * 
 * // インポート開始前に年度を記録
 * const handleImportStart = () => {
 *   yearStateManager.recordPreImportYear();
 *   setImportModalOpen(true);
 * };
 * 
 * // インポート完了後に年度を復元
 * const handleImportSuccess = () => {
 *   yearStateManager.restoreYearAfterImport();
 *   refreshData();
 * };
 * ```
 */

export default useYearStateManager;