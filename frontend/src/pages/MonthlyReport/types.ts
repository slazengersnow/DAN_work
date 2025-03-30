// src/pages/MonthlyReport/types.ts

/**
 * 従業員の詳細情報
 */
export interface Employee {
    no: number;                     // 表示順序番号
    id: number;                     // 社員ID
    employee_id: number | string;   // 社員番号（数値または文字列）
    employeeId?: number;            // 新しい型との互換性のために追加
    name: string;                   // 氏名
    disability_type: string;        // 障害の種類
    disabilityType?: string;        // 新しい型との互換性のために追加
    disability: string;             // 障害の詳細
    grade: string;                  // 障害等級
    hire_date: string;              // 雇用日
    status: string;                 // 在籍状態
    count: number;                  // 雇用カウント
    monthlyStatus?: number[];       // 各月のステータス
    workStatus?: number;            // 月次の勤務状況（1: 通常, 0.5: 短時間, 0: 休職）
    memo?: string;                  // メモ
    monthlyWork?: {
      scheduled_hours: number;      // 予定労働時間
      actual_hours: number;         // 実際の労働時間
      exception_reason?: string;    // 例外理由
    };
}

/**
 * 月次報告の基本データ型
 */
export interface MonthlyReportData {
    year: number;                   // 年
    month: number;                  // 月
    totalEmployees: number;         // 総従業員数
    disabledEmployees: number;      // 障害者数
    employmentCount: number;        // 雇用カウント
    actualRate: number;             // 実雇用率
    legalRate: number;              // 法定雇用率
    status?: string;                // ステータス
}

/**
 * 月次合計データ
 */
export interface MonthlyTotal {
    id?: number;                    // ID（DB主キー）
    year: number;                   // 年
    month: number;                  // 月
    total_employees: number;        // 総従業員数
    full_time_employees?: number;   // フルタイム従業員数
    part_time_employees?: number;   // パートタイム従業員数
    disabled_employees?: number;    // 障害者数
    employment_count?: number;      // 雇用カウント (提案コードとの互換性)
    actual_rate: number;            // 実雇用率
    legal_rate: number;             // 法定雇用率
    legal_count?: number;           // 法定雇用人数
    shortage?: number;              // 不足数
    status: string;                 // ステータス（'未確定' | '確定済'）
    created_at?: string;            // 作成日時
    updated_at?: string;            // 更新日時
    total_disabled?: number;        // 総障害者数 (提案コードとの互換性)
}

/**
 * 月次詳細のデータ行
 */
export interface MonthlyDetailRow {
    id: number;                     // 行ID
    item: string;                   // 項目名
    values: number[];               // 各月の値
    suffix?: string;                // 単位など（%など）
    isDisability?: boolean;         // 障害者関連の行かどうか
    isRatio?: boolean;              // 比率を表す行かどうか
    isCalculated?: boolean;         // 自動計算される行かどうか
    isNegative?: boolean;           // 負の値を取りうる行かどうか
}

/**
 * 月次詳細データの行（既存の型との互換性のため別名も維持）
 */
export interface MonthlyDetailDataRow extends MonthlyDetailRow {}

/**
 * 月次詳細データ
 */
export interface MonthlyDetailData {
    months: string[];               // 月の一覧
    data: MonthlyDetailRow[];       // 詳細データの行
}

/**
 * 従業員の月次データ
 */
export interface EmployeeMonthlyData {
    id: number;                     // ID
    employeeId: number;             // 社員番号
    name: string;                   // 氏名
    disabilityType: string;         // 障害の種類
    grade: string;                  // 障害等級
    count: number;                  // 雇用カウント
    status: string;                 // 在籍状態
    workStatus: number;             // 月次の勤務状況（1: 通常, 0.5: 短時間, 0: 休職）
    memo?: string;                  // メモ
}

/**
 * 履歴項目
 */
export interface HistoryItem {
    yearMonth?: string;             // YYYY/MM形式
    totalEmployees?: number;        // 総従業員数
    disabledCount?: number;         // 障害者数
    physical?: number;              // 身体障害者数
    intellectual?: number;          // 知的障害者数
    mental?: number;                // 精神障害者数
    employmentCount?: number;       // 雇用カウント合計
    actualRate?: number;            // 実雇用率
    status?: string;                // ステータス
    month?: string;                 // 月表示 (提案コードとの互換性)
    count?: number;                 // カウント (提案コードとの互換性)
    rate?: number;                  // 比率 (提案コードとの互換性)
}

/**
 * 月次レポート詳細ページ用のモデル
 * 独立したページでのデータ管理用
 */
export interface MonthlyData {
    employeeCount: number[];        // 従業員数
    fullTimeCount: number[];        // フルタイム従業員数
    partTimeCount: number[];        // パートタイム従業員数
    totalEmployeeCount: number[];   // 総従業員数
    level1And2Count: number[];      // 重度障害者数
    otherDisabilityCount: number[]; // その他障害者数
    level1And2PartTimeCount: number[]; // 重度障害者パートタイム数
    otherDisabilityPartTimeCount: number[]; // その他障害者パートタイム数
    totalDisabilityCount: number[]; // 障害者合計
    actualEmploymentRate: number[]; // 実雇用率
    legalEmploymentRate: number;    // 法定雇用率
    legalEmployeeCount: number[];   // 法定雇用者数
    overOrUnder: number[];          // 超過・未達
}