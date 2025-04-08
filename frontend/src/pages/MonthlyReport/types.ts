// src/pages/MonthlyReport/types.ts

/**
 * 月次レポートのサマリー（合計）データ型
 * APIから取得する基本データに対応
 */
export interface MonthlyTotal {
    id?: number;                    // ID（DB主キーなど）
    fiscal_year: number;            // 会計年度
    month: number;                  // 対象月
    employees_count: number;        // 常用労働者数
    fulltime_count: number;         // フルタイム従業員数
    parttime_count: number;         // パートタイム従業員数
    level1_2_count: number;         // 障害レベル1+2の人数
    other_disability_count: number; // その他障害者数
    level1_2_parttime_count: number;// 障害レベル1+2パートタイム人数
    other_parttime_count: number;   // その他障害者パートタイム人数
    total_disability_count: number; // 障害者実人数合計
    employment_rate: number;        // 実雇用率
    legal_employment_rate: number;  // 法定雇用率
    required_count: number;         // 法定雇用障害者数
    over_under_count: number;       // 不足数（負数の場合）または超過数（正数の場合）
    status: string;                 // ステータス（例: '未確定', '確定済')
    created_at?: string;            // 作成日時
    updated_at?: string;            // 更新日時
    
    // 互換性のためのエイリアス（非推奨、将来的に削除予定）
    year?: number;                  // fiscal_year のエイリアス
    total_employees?: number;       // employees_count のエイリアス
    full_time_employees?: number;   // fulltime_count のエイリアス
    part_time_employees?: number;   // parttime_count のエイリアス
    disabled_employees?: number;    // total_disability_count のエイリアス
    actual_rate?: number;           // employment_rate のエイリアス
    legal_rate?: number;            // legal_employment_rate のエイリアス
    legal_count?: number;           // required_count のエイリアス
    shortage?: number;              // over_under_count のエイリアス
}

/**
 * 従業員の詳細情報 (UI表示や計算で使用する整形後のデータ型)
 */
export interface Employee {
    no: number;                     // 表示順序番号
    id: number;                     // 従業員マスターのID (DB等)
    employee_id: number | string;   // 社員番号（表示用、数値または文字列）
    name: string;                   // 氏名
    disability_type?: string;       // 障害区分 (例: '身体障害', '知的障害', '精神障害')
    disability?: string;            // 障害内容の詳細 (例: '視覚障害', '肢体不自由', '統合失調症')
    grade?: string;                 // 等級 (例: '1級', 'A', '2級')
    hire_date: string;              // 雇用日 (YYYY-MM-DD形式)
    status: string;                 // 在籍状態 (例: '在籍', '休職', '退職')
    count: number;                  // 法定雇用カウント (例: 1.0, 0.5, 2.0)
    monthlyStatus?: number[];       // 各月(4月~3月)の在籍/カウント状況 (例: 1=在籍/カウント対象, 0=対象外) [12要素]
    workStatus?: number;            // 当月の主な勤務状況（1: フルタイム相当, 0.5: 短時間相当, 0: カウント対象外）※月次で変動する可能性
    memo?: string;                  // 備考
    monthlyWork?: {                 // 当月の労働時間情報 (APIから取得する場合)
      scheduled_hours?: number;     // 予定労働時間
      actual_hours?: number;        // 実労働時間
      exception_reason?: string;    // 労働時間差異の理由など
    };
    
    // 互換性のため残すプロパティ (非推奨、将来的に削除予定)
    employeeId?: number;            // 旧 employee_id (number only)
    disabilityType?: string;        // 旧 disability_type
}

/**
 * 月次詳細データの行
 */
export interface MonthlyDetailRow {
    id: number;                     // 行ID (一意の識別子)
    item: string;                   // 項目名 (例: '従業員数', '実雇用率')
    values: number[];               // 各月(4月~3月)の値 + 合計値 [13要素]
    suffix?: string;                // 値の後につける単位など (例: '%', '人')
    isDisability?: boolean;         // 障害者数に関連する行か（UIでの強調表示等に利用）
    isRatio?: boolean;              // 値が比率であるか（%表示や計算方法の識別に利用）
    isCalculated?: boolean;         // この行の値が他の行から自動計算されるものか
    isNegative?: boolean;           // 負の値の場合に特別な表示（例：赤字）をするか (不足数など)
}

/**
 * 月次詳細データの行（既存の型との互換性のため別名も維持）
 * @deprecated MonthlyDetailRow を使用してください
 */
export interface MonthlyDetailDataRow extends MonthlyDetailRow {}

/**
 * 月次詳細データ全体 (テーブル表示用)
 */
export interface MonthlyDetailData {
    months: string[];               // テーブルヘッダーの月名リスト (例: ['4月', '5月', ..., '3月', '合計']) [13要素]
    data: MonthlyDetailRow[];       // テーブルの各行データ
}

/**
 * 月次レポートで表示する従業員リストのデータ型 (APIレスポンス用)
 * Employee 型より情報が少ない場合など、APIの構造に合わせる
 */
export interface EmployeeMonthlyData {
    id: number;                     // レポート従業員データの一意ID
    employee_master_id: number;     // 従業員マスターテーブルへの参照ID
    name: string;                   // 氏名
    disability_type: string;        // 障害の種類
    grade: string;                  // 障害等級
    count: number;                  // 法定雇用カウント
    status: string;                 // 当月の在籍状態
    work_status: number;            // 当月の勤務状況（1: 通常, 0.5: 短時間, 0: 休職）
    memo?: string;                  // メモ
    // 必要に応じてAPIレスポンスに含まれる他のフィールドを追加
}

/**
 * 履歴表示用のデータ型 (過去の月次レポートサマリーなど)
 */
export interface HistoryItem {
    year: number;                   // 年
    month: number;                  // 月
    yearMonth?: string;             // YYYY/MM 形式の表示用文字列 (加工して生成)
    totalEmployees?: number;        // 総従業員数
    disabledCount?: number;         // 障害者実人数
    physical?: number;              // 身体障害者数 (詳細が必要な場合)
    intellectual?: number;          // 知的障害者数 (詳細が必要な場合)
    mental?: number;                // 精神障害者数 (詳細が必要な場合)
    employmentCount?: number;       // 法定雇用カウント合計
    actualRate?: number;            // 実雇用率
    status?: string;                // 確定ステータス
    
    // 互換性のため残すが非推奨（将来的に削除予定）
    // rate?: number;               // actualRate を使用
    // count?: number;              // employmentCount や disabledCount を使用
}

/**
 * 月次レポート詳細ページ用のデータモデル
 * MonthlyDetailData と役割が似ているため、特定のAPIレスポンス構造に合わせる場合に使用
 */
export interface MonthlyDetailSpecificData {
    // 各項目について、4月～3月の値を持つ配列 [12要素]
    employeeCount: number[];        // 従業員数
    fullTimeCount: number[];        // フルタイム従業員数
    partTimeCount: number[];        // パートタイム従業員数
    level1And2Count: number[];      // 重度障害者数 (身体・知的)
    otherDisabilityCount: number[]; // その他の障害者数 (精神など)
    level1And2PartTimeCount: number[]; // 重度障害者パートタイム数
    otherDisabilityPartTimeCount: number[]; // その他障害者パートタイム数
    totalDisabilityCount: number[]; // 障害者実人数合計
    actualEmploymentRate: number[]; // 実雇用率
    legalEmploymentRate: number;    // 法定雇用率
    legalEmployeeCount: number[];   // 法定雇用障害者数
    overOrUnder: number[];          // 不足数
}

/**
 * 汎用的なAPI成功レスポンスの型
 */
export interface ApiResponse<T> {
    success: true;                  // 処理成功を示すフラグ
    data: T;                        // APIから返される主要データ
    message?: string;               // 補足メッセージ（例: '処理が正常に完了しました')
}

/**
 * 汎用的なAPIエラーレスポンスの型
 */
export interface ApiError {
    success: false;                 // 処理失敗を示すフラグ
    message: string;                // エラーメッセージ本体 (例: '入力内容に誤りがあります')
    errors?: Record<string, string[]>; // バリデーションエラー等の詳細 (フィールド名: エラー内容配列)
}

export interface ProcessedData {
    months: string[];
    data: Array<{
      id: number;
      item: string;
      values: number[];
      isPercentage?: boolean;
      isDisability?: boolean;
      isRatio?: boolean;
      isNegative?: boolean;
      isCalculated?: boolean;
      suffix?: string;
    }>;
  }

export interface ProcessedData {
months: string[];
data: Array<{
    id: number;
    item: string;
    values: number[];
    isPercentage?: boolean;
    isDisability?: boolean;
    isRatio?: boolean;
    isNegative?: boolean;
    isCalculated?: boolean;
    suffix?: string;
}>;
}
