// src/pages/MonthlyReport/YearMonthContext.tsx
import React, { createContext, useState, ReactNode, useContext } from 'react';

interface YearMonthContextType {
  fiscalYear: number; // 年度
  month: number; // 月
  setYearMonth: (year: number, month: number) => void;
}

// デフォルト値を設定
export const YearMonthContext = createContext<YearMonthContextType>({
  fiscalYear: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  setYearMonth: () => {}
});

interface YearMonthProviderProps {
  children: ReactNode;
  initialYear?: number;
  initialMonth?: number;
}

export const YearMonthProvider: React.FC<YearMonthProviderProps> = ({ 
  children, 
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth() + 1
}) => {
  const [fiscalYear, setFiscalYear] = useState<number>(initialYear);
  const [month, setMonth] = useState<number>(initialMonth);

  const setYearMonth = (year: number, month: number) => {
    setFiscalYear(year);
    setMonth(month);
  };

  return (
    <YearMonthContext.Provider value={{ fiscalYear, month, setYearMonth }}>
      {children}
    </YearMonthContext.Provider>
  );
};

// フックとしてコンテキストを使用するためのヘルパー
export const useYearMonth = () => useContext(YearMonthContext);

export default YearMonthContext;