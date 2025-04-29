// src/pages/MonthlyReport/YearMonthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// コンテキストの型定義
interface YearMonthContextType {
  fiscalYear: number;
  month: number;
  setFiscalYear: (year: number) => void;
  setMonth: (month: number) => void;
}

// デフォルト値（現在の年と月）を設定
const currentDate = new Date();
const defaultValues: YearMonthContextType = {
  fiscalYear: currentDate.getFullYear(),
  month: currentDate.getMonth() + 1,
  setFiscalYear: () => {},
  setMonth: () => {}
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

  // ラッパー関数を作成して、状態更新とストレージ保存を行う
  const setFiscalYear = (year: number) => {
    setFiscalYearState(year);
    safelySetItem('fiscalYear', year);
    console.log(`年度を${year}に変更しました`);
  };

  const setMonth = (newMonth: number) => {
    setMonthState(newMonth);
    safelySetItem('month', newMonth);
    console.log(`月を${newMonth}に変更しました`);
  };

  // コンポーネントマウント時にコンソールに情報を出力
  useEffect(() => {
    console.log('YearMonthContext初期化:', { fiscalYear, month });
  }, []);

  return (
    <YearMonthContext.Provider value={{ fiscalYear, month, setFiscalYear, setMonth }}>
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