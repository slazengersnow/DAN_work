// src/pages/MonthlyReport/types.ts

/**
 * 従業員の詳細情報
 */
export interface Employee {
    no?: number;
    id: number;
    employee_id: number;         // 社員番号
    employeeId?: number;         // 新しい型との互換性のために追加
    name: string;
    disability_type?: string;    // 障害の種類
    disabilityType?: string;     // 新しい型との互換性のために追加
    disability?: string;         // 障害の詳細
    grade?: string;              // 障害等級
    hire_date: string;           // 雇用日
    status: string;              // 在籍状態
    count: number;               // 雇用カウント
    monthlyStatus?: number[];    // 各月のステータス
    workStatus?: number;         // 月次の勤務状況（1: 通常, 0.5: 短時間, 0: 休職）
    memo?: string;               // メモ
    monthlyWork?: {
      scheduled_hours: number;   // 予定労働時間
      actual_hours: number;      // 実際の労働時間
      exception_reason?: string; // 例外理由
    };
  }
  
  /**
   * 月次報告の基本データ型
   */
  export interface MonthlyReportData {
    year: number;                // 年
    month: number;               // 月
    totalEmployees: number;      // 総従業員数
    disabledEmployees: number;   // 障害者数
    employmentCount: number;     // 雇用カウント
    actualRate: number;          // 実雇用率
    legalRate: number;           // 法定雇用率
    status?: string;             // ステータス
  }
  
  /**
   * 月次合計データ
   */
  export interface MonthlyTotal {
    id?: number;
    year: number;
    month: number;
    total_employees: number;     // 総従業員数
    full_time_employees: number; // フルタイム従業員数
    part_time_employees: number; // パートタイム従業員数
    disabled_employees: number;  // 障害者数
    actual_rate: number;         // 実雇用率
    legal_rate: number;          // 法定雇用率
    legal_count: number;         // 法定雇用人数
    shortage: number;            // 不足数
    status: string;              // ステータス（確定済など）
    created_at?: string;
    updated_at?: string;
  }
  
  /**
   * 月次詳細のデータ行
   */
  export interface MonthlyDetailRow {
    id: number;
    item: string;
    values: number[];
    suffix?: string;
    isDisability?: boolean;
    isRatio?: boolean;
    isCalculated?: boolean;
    isNegative?: boolean;
  }
  
  /**
   * 月次詳細データの行（既存の型との互換性のため別名も維持）
   */
  export interface MonthlyDetailDataRow extends MonthlyDetailRow {}
  
  /**
   * 月次詳細データ
   */
  export interface MonthlyDetailData {
    months: string[];            // 月の一覧
    data: MonthlyDetailDataRow[];  // 詳細データの行
  }
  
  /**
   * 従業員の月次データ
   */
  export interface EmployeeMonthlyData {
    id: number;
    employeeId: number;         // 社員番号
    name: string;
    disabilityType: string;     // 障害の種類
    grade: string;              // 障害等級
    count: number;              // 雇用カウント
    status: string;             // 在籍状態
    workStatus: number;         // 月次の勤務状況（1: 通常, 0.5: 短時間, 0: 休職）
    memo?: string;              // メモ
  }
  
  /**
   * 履歴項目
   */
  export interface HistoryItem {
    yearMonth: string;          // YYYY/MM形式
    totalEmployees: number;     // 総従業員数
    disabledCount: number;      // 障害者数
    physical: number;           // 身体障害者数
    intellectual: number;       // 知的障害者数
    mental: number;             // 精神障害者数
    employmentCount: number;    // 雇用カウント合計
    actualRate: number;         // 実雇用率
    status: string;             // ステータス
  }