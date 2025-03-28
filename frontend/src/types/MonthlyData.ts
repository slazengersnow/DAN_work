// 月次データの型定義
export interface MonthlyData {
  year: number;
  month: number;
  total_employees: number;
  disabled_employees: number;
  actual_rate: number;
  legal_rate: number;
  status?: string;
}

// 月次従業員データの型定義
export interface MonthlyEmployee {
  id: number;
  employee_id: string;
  name: string;
  disability_type?: string;
  status: string;
  count: number;
  hire_date: string;
  monthlyWork?: MonthlyWork[] | MonthlyWorkSingle;
}

// 月次業務詳細（配列形式）
export interface MonthlyWork {
  year: number;
  month: number;
  scheduled_hours: number;
  actual_hours: number;
  exception_reason?: string;
}

// 月次業務詳細（単一オブジェクト形式）
export interface MonthlyWorkSingle {
  scheduled_hours: number;
  actual_hours: number;
  exception_reason?: string;
}