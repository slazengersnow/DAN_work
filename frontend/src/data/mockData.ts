// src/data/mockData.ts - モックデータ
import { Employee, EraType } from '../types/Employee';

// 社員データのモック
export const employeesData: Employee[] = [
  {
    id: 1, // 追加
    employeeId: '1001',
    name: '山田 太郎',
    nameKana: 'ヤマダ タロウ',
    gender: '1',
    disabilityType: '身体障害',
    grade: '1級',
    count: 2,
    status: '在籍中',
    address: '東京都千代田区丸の内1-1-1',
    phone: '090-1234-5678',
    email: 'taro.yamada@example.com',
    managementType: '通常',
    eraType: '昭和' as EraType,
    birthYear: '55',
    birthMonth: '5',
    birthDay: '15',
    
    // 緊急連絡先
    emergencyContactName: '山田 花子',
    emergencyContactRelation: '配偶者',
    emergencyContactPhone: '090-8765-4321',
    emergencyContactAddress: '東京都千代田区丸の内1-1-1',
    
    // 責任者情報
    supervisorName: '鈴木一郎',
    supervisorPosition: '総務部長',
    supervisorPhone: '03-1234-5678',
    
    // 障害情報
    physicalGrade: '1級',
    physicalLocation: '視覚',
    physicalCertDateEra: '令和' as EraType,
    physicalCertDateYear: '2',
    physicalCertDateMonth: '4',
    physicalCertDateDay: '1',
    
    // 手帳情報
    certificateNumber: '第A123456号',
    certificateIssuer: '東京都',
    certificateExpiryEra: '令和' as EraType,
    certificateExpiryYear: '10',
    certificateExpiryMonth: '6',
    certificateExpiryDay: '30',
    certificateRenewalEra: '令和' as EraType,
    certificateRenewalYear: '2',
    certificateRenewalMonth: '4',
    certificateRenewalDay: '1',
    
    // 配慮事項
    medicalInstructions: '長時間の作業を避け、2時間ごとに休憩を取ること',
    workplaceConsiderations: '画面拡大ソフトの使用、照明の調整が必要',
    
    // 雇用情報
    employmentType: '正社員',
    countValue: '2.0',
    hireDateEra: '令和' as EraType,
    hireDateYear: '2',
    hireDateMonth: '4',
    hireDateDay: '1',
    
    // 職務情報
    department: '総務部',
    position: '主任',
    jobDescription: 'データ入力、書類整理',
    
    // 勤務条件
    workHours: '9:00 - 17:00',
    workDaysPerWeek: '5日',
    
    // 月次情報
    monthlyData: {
      standardHours: [160, 160, 160, 160, 160, 160, 160, 160, 160, 160, 160, 160],
      actualHours: [160, 160, 152, 160, 160, 160, 144, 160, 160, 160, 160, 152],
      notes: ['', '', '有給休暇', '', '', '', '診療通院(2日)', '', '', '', '', '有給休暇'],
      attendanceFlag: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      reportFlag: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      countValues: [2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0]
    }
  },
  {
    id: 2, // 追加
    employeeId: '1002',
    name: '鈴木 花子',
    disabilityType: '精神障害',
    grade: '2級',
    count: 1,
    status: '在籍中'
  },
  {
    id: 3, // 追加
    employeeId: '1003',
    name: '佐藤 一郎',
    disabilityType: '知的障害',
    grade: 'B',
    count: 1,
    status: '在籍中'
  },
  {
    id: 4, // 追加
    employeeId: '1004',
    name: '田中 健太',
    disabilityType: '身体障害',
    grade: '3級',
    count: 0.5,
    status: '在籍中'
  },
  {
    id: 5, // 追加
    employeeId: '1005',
    name: '伊藤 由美',
    disabilityType: '精神障害',
    grade: '3級',
    count: 1,
    status: '在籍中'
  },
  {
    id: 6, // 追加
    employeeId: '1006',
    name: '渡辺 隆',
    disabilityType: '身体障害',
    grade: '2級',
    count: 1,
    status: '退職'
  },
  {
    id: 7, // 追加
    employeeId: '1007',
    name: '高橋 恵子',
    disabilityType: '知的障害',
    grade: 'A',
    count: 1,
    status: '在籍中'
  }
];