import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// コンテキストの型定義
interface YearMonthContextType {
  fiscalYear: number;
  month: number;
  setFiscalYear: (year: number) => void;
  setMonth: (month: number) => void;
  dispatchYearMonthChange: (year: number, month: number) => void;
}

// 現在の年月を取得する関数
const getCurrentYearMonth = () => {
  const currentDate = new Date();
  return {
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  };
};

// デフォルト値（現在の年と月）を設定
const { year: defaultYear, month: defaultMonth } = getCurrentYearMonth();
const defaultValues: YearMonthContextType = {
  fiscalYear: defaultYear,
  month: defaultMonth,
  setFiscalYear: () => {},
  setMonth: () => {},
  dispatchYearMonthChange: () => {}
};

// localStorage操作をsafely処理する関数
const safelyGetItem = (key: string, defaultValue: any): any => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.warn(`ストレージからの読み込みエラー (${key}):`, error);
    return defaultValue;
  }
};

const safelySetItem = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`ストレージへの書き込みエラー (${key}):`, error);
  }
};

// コンテキスト作成
const YearMonthContext = createContext<YearMonthContextType>(defaultValues);

// プロバイダープロパティの型定義
interface YearMonthProviderProps {
  children: ReactNode;
  initialYear?: number;
  initialMonth?: number;
}

// プロバイダーコンポーネント
export const YearMonthProvider: React.FC<YearMonthProviderProps> = ({ 
  children, 
  initialYear,
  initialMonth 
}) => {
  // ストレージから値を取得、または初期値を使用
  const [fiscalYear, setFiscalYearState] = useState<number>(
    initialYear || safelyGetItem('fiscalYear', defaultValues.fiscalYear)
  );
  
  const [month, setMonthState] = useState<number>(
    initialMonth || safelyGetItem('month', defaultValues.month)
  );

  // 年度と月を同時に変更する関数
  const dispatchYearMonthChange = (year: number, month: number) => {
    console.log(`年度と月を変更: ${year}年${month}月`);
    setFiscalYearState(year);
    setMonthState(month);
    safelySetItem('fiscalYear', year);
    safelySetItem('month', month);
    
    // カスタムイベントを発火して他のコンポーネントに通知
    const yearMonthChangeEvent = new CustomEvent('yearMonthChanged', { 
      detail: { year, month } 
    });
    window.dispatchEvent(yearMonthChangeEvent);
  };

  // ラッパー関数を作成して、状態更新とストレージ保存を行う
  const setFiscalYear = (year: number) => {
    console.log(`年度を${year}に変更しました`);
    setFiscalYearState(year);
    safelySetItem('fiscalYear', year);
    
    // カスタムイベントを発火して他のコンポーネントに通知
    const yearChangeEvent = new CustomEvent('fiscalYearChanged', { 
      detail: { year, month } 
    });
    window.dispatchEvent(yearChangeEvent);
  };

  const setMonth = (newMonth: number) => {
    console.log(`月を${newMonth}に変更しました`);
    setMonthState(newMonth);
    safelySetItem('month', newMonth);
    
    // カスタムイベントを発火して他のコンポーネントに通知
    const monthChangeEvent = new CustomEvent('monthChanged', { 
      detail: { year: fiscalYear, month: newMonth } 
    });
    window.dispatchEvent(monthChangeEvent);
  };

  // 初期値が変わったときにコンテキストの値を更新
  useEffect(() => {
    if (initialYear !== undefined && initialYear !== fiscalYear) {
      setFiscalYearState(initialYear);
      safelySetItem('fiscalYear', initialYear);
    }
    
    if (initialMonth !== undefined && initialMonth !== month) {
      setMonthState(initialMonth);
      safelySetItem('month', initialMonth);
    }
  }, [initialYear, initialMonth]);

  // コンポーネントマウント時にコンソールに情報を出力
  useEffect(() => {
    console.log('YearMonthContext初期化:', { fiscalYear, month });
  }, []);

  return (
    <YearMonthContext.Provider value={{ 
      fiscalYear, 
      month, 
      setFiscalYear, 
      setMonth,
      dispatchYearMonthChange
    }}>
      {children}
    </YearMonthContext.Provider>
  );
};

// カスタムフック
export const useYearMonth = (): YearMonthContextType => {
  const context = useContext(YearMonthContext);
  if (context === undefined) {
    throw new Error('useYearMonth must be used within a YearMonthProvider');
  }
  return context;
};

export default YearMonthContext;