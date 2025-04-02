// src/types/Employee.ts - 社員情報の型定義

// 元号の型
export type EraType = '明治' | '大正' | '昭和' | '平成' | '令和';

// 日付情報の型
export interface DateInfo {
  era: EraType;
  year: string;
  month: string;
  day: string;
}

// 障害種別の型
export type DisabilityType = '身体障害' | '精神障害' | '知的障害';

// ステータスの型
export type EmployeeStatus = '在籍中' | '退職';

// 社員基本情報の型
export interface Employee {
  // 必須プロパティ
  id: number;
  name: string;
  
  // ID両方サポート
  employee_id?: string;
  employeeId?: string;
  
  // 障害関連プロパティ
  disability_type?: string;
  disabilityType?: string;
  
  // 検証ステータス
  physical_verified?: boolean;
  physicalVerified?: boolean;
  intellectual_verified?: boolean;
  intellectualVerified?: boolean;
  mental_verified?: boolean;
  mentalVerified?: boolean;
  
  // 等級
  physical_degree_current?: string;
  physicalDegreeCurrent?: string;
  intellectual_degree_current?: string;
  intellectualDegreeCurrent?: string;
  mental_degree_current?: string;
  mentalDegreeCurrent?: string;
  
  // 基本情報
  gender?: string | '1' | '2'; // 1:男性, 2:女性
  grade?: string;
  count?: number;
  status?: string | EmployeeStatus;
  nameKana?: string;
  
  // 基本情報タブの追加情報
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  eraType?: EraType;
  address?: string;
  phone?: string;
  email?: string;
  managementType?: string;
  
  // 緊急連絡先情報
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContactAddress?: string;
  
  // 責任者情報
  supervisorName?: string;
  supervisorPosition?: string;
  supervisorPhone?: string;
  
  // 障害情報タブ
  physicalGrade?: string;
  physicalLocation?: string;
  physicalCertDateEra?: EraType;
  physicalCertDateYear?: string;
  physicalCertDateMonth?: string;
  physicalCertDateDay?: string;
  
  // 手帳情報
  certificateNumber?: string;
  certificateIssuer?: string;
  certificateExpiryEra?: EraType;
  certificateExpiryYear?: string;
  certificateExpiryMonth?: string;
  certificateExpiryDay?: string;
  certificateRenewalEra?: EraType;
  certificateRenewalYear?: string;
  certificateRenewalMonth?: string;
  certificateRenewalDay?: string;
  
  // 配慮事項
  medicalInstructions?: string;
  workplaceConsiderations?: string;
  
  // 雇用情報タブ
  employmentType?: string;
  countValue?: string;
  hireDateEra?: EraType;
  hireDateYear?: string;
  hireDateMonth?: string;
  hireDateDay?: string;
  hire_date?: string;
  
  // 職務情報
  department?: string;
  position?: string;
  jobDescription?: string;
  
  // 転入・転出情報
  transferInDate?: string;
  previousWorkplace?: string;
  transferOutDate?: string;
  nextWorkplace?: string;
  
  // 勤務条件
  workHours?: string;
  workDaysPerWeek?: string;
  exceptionalReason?: string;
  
  // 月次情報タブのデータ
  monthlyData?: {
    standardHours: number[];
    actualHours: number[];
    notes: string[];
    attendanceFlag: number[];
    reportFlag: number[];
    countValues: number[];
  } | any;
  
  // 月次勤務データ - 単一オブジェクトと配列の両方をサポート
  monthlyWork?: {
    scheduled_hours?: number;
    actual_hours?: number;
    exception_reason?: string;
    year?: number;
    month?: number;
  } | Array<{
    year: number;
    month: number;
    scheduled_hours: number;
    actual_hours: number;
    exception_reason?: string;
  }>;
  
  // 基本情報タブの一番下に配置する例外事由
  exception?: string;
  
  // 臨時的な対応として任意のプロパティを許可
  [key: string]: any;
}

// コンポーネントのProps型
export interface EmployeeListProps {
  onEmployeeSelect: (employee: Employee) => void;
}

export interface EmployeeDetailProps {
  employee: Employee | null;
  onBack: () => void;
}

// 各タブのProps型
export interface TabProps {
  employeeData: Employee;
  onUpdate: (updatedData: Partial<Employee>) => void;
  isEditing?: boolean; // isEditing プロパティを追加
}