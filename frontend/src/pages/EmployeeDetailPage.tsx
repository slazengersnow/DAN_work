// frontend/src/pages/EmployeeDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import EmployeeDetail from '../components/EmployeeDetail';
import { Employee } from '../types/Employee';

// APIからデータを取得するモック関数
const fetchEmployeeData = async (id: string): Promise<Employee> => {
  // 実際の環境ではAPIからデータを取得する
  // ここではモックデータを返す
  await new Promise(resolve => setTimeout(resolve, 500)); // 遅延を模倣
  
  return {
    id: parseInt(id),
    employeeId: `100${id}`,
    name: "山田 太郎",
    nameKana: "ヤマダ タロウ",
    gender: "1",
    eraType: "昭和",
    birthYear: "55",
    birthMonth: "5",
    birthDay: "1",
    address: "東京都千代田区丸の内1-1-1",
    phone: "090-1234-5678",
    email: "taro.yamada@example.com",
    
    emergencyContactName: "山田 花子",
    emergencyContactRelation: "妻",
    emergencyContactPhone: "090-9876-5432",
    
    supervisorName: "鈴木 部長",
    supervisorPosition: "総務部長",
    supervisorPhone: "03-1234-5678",
    
    exception: "",
    
    disabilityType: "身体障害",
    physicalVerified: true,
    physicalGrade: "1級",
    physicalLocation: "視覚",
    physicalCertDateEra: "令和",
    physicalCertDateYear: "2",
    physicalCertDateMonth: "4",
    physicalCertDateDay: "1",
    
    certificateNumber: "A-123456",
    certificateIssuer: "東京都",
    certificateExpiryEra: "令和",
    certificateExpiryYear: "7",
    certificateExpiryMonth: "3",
    certificateExpiryDay: "31",
    
    medicalInstructions: "視力障害のため、大きな文字での資料提供が必要",
    workplaceConsiderations: "PC作業時は拡大ツールの使用が必要",
    
    employmentType: "正社員",
    countValue: "2.0",
    status: "在籍中",
    count: 2,
    hireDateEra: "令和",
    hireDateYear: "2",
    hireDateMonth: "4",
    hireDateDay: "1",
    
    department: "総務部",
    position: "主任",
    jobDescription: "データ入力、書類整理",
    
    workHours: "9:00 - 17:00",
    workDaysPerWeek: "5日",
    
    // 月次データ
    monthlyData: {
      standardHours: [160, 160, 160, 160, 160, 160, 160, 160, 160, 160, 160, 160],
      actualHours: [160, 160, 152, 160, 160, 160, 144, 160, 160, 160, 160, 152],
      notes: ['', '', '有給休暇', '', '', '', '診療通院(2日)', '', '', '', '', '有給休暇'],
      attendanceFlag: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      reportFlag: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      countValues: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    }
  };
};

// 社員データを保存するモック関数
const saveEmployeeData = async (employee: Employee): Promise<void> => {
  // 実際の環境ではAPIを呼び出してデータを保存する
  console.log('保存されたデータ:', employee);
  await new Promise(resolve => setTimeout(resolve, 500)); // 遅延を模倣
  return Promise.resolve();
};

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // React Queryを使用してデータを取得
  const { data: employee, isLoading, error } = useQuery(
    ['employee', id],
    () => fetchEmployeeData(id!),
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  // 戻るボタンのハンドラ
  const handleBack = () => {
    navigate('/employee-list');
  };

  // スピナー表示
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>読み込み中...</div>
      </div>
    );
  }

  // エラー表示
  if (error || !employee) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'red'
      }}>
        <div>データの読み込み中にエラーが発生しました</div>
      </div>
    );
  }

  return <EmployeeDetail employee={employee} onBack={handleBack} />;
};

export default EmployeeDetailPage;