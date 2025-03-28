// src/pages/MonthlyReport/types.ts

export interface Employee {
    no?: number;
    id: number;
    employee_id: number;
    name: string;
    disability_type?: string;
    disability?: string;
    grade?: string;
    hire_date: string;
    status: string;
    count: number;
    monthlyStatus?: number[];
    memo?: string;
    monthlyWork?: {
      scheduled_hours: number;
      actual_hours: number;
      exception_reason?: string;
    };
  }
  
  export interface MonthlyTotal {
    id?: number;
    year: number;
    month: number;
    total_employees: number;
    full_time_employees: number;
    part_time_employees: number;
    disabled_employees: number;
    actual_rate: number;
    legal_rate: number;
    legal_count: number;
    shortage: number;
    status: string;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface MonthlyDetailDataRow {
    id: number;
    item: string;
    values: number[];
    suffix?: string;
    isDisability?: boolean;
    isRatio?: boolean;
    isCalculated?: boolean;
    isNegative?: boolean;
  }
  
  export interface MonthlyDetailData {
    months: string[];
    data: MonthlyDetailDataRow[];
  }
  
  export interface HistoryItem {
    yearMonth: string;
    totalEmployees: number;
    disabledCount: number;
    physical: number;
    intellectual: number;
    mental: number;
    employmentCount: number;
    actualRate: number;
    status: string;
  }