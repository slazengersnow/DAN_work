// frontend/src/components/EmployeeDetail.tsx
import React, { useState } from 'react';
import BasicInfo from './employee-tabs/BasicInfo';
import DisabilityInfo from './employee-tabs/DisabilityInfo';
import EmploymentInfo from './employee-tabs/EmploymentInfo';
import MonthlyInfo from './employee-tabs/MonthlyInfo';
import { Employee, EmployeeDetailProps } from '../types/Employee';
import './EmployeeDetail.css'; // CSSファイルをインポート

const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employee, onBack }) => {
  const [activeTab, setActiveTab] = useState<'basicInfo' | 'disabilityInfo' | 'employmentInfo' | 'monthlyInfo'>('basicInfo');
  const [employeeData, setEmployeeData] = useState<Employee | null>(employee);

  if (!employeeData) {
    return <div>社員データが見つかりません</div>;
  }

  // データ更新時の処理
  const handleDataUpdate = (updatedData: Partial<Employee>): void => {
    setEmployeeData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        ...updatedData
      };
    });
    // ここで実際のAPI呼び出しなどでデータ更新を行う
  };

  // 保存ボタンのクリック処理
  const handleSave = (): void => {
    // APIでデータ保存処理など
    alert('保存しました');
  };

  return (
    <div className="employee-detail-container">
      <div className="employee-detail-header">
        <h2 className="employee-detail-title">社員詳細</h2>
        <div className="employee-id-name">{employeeData.name} ({employeeData.employeeId})</div>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={onBack}>戻る</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
      
      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'basicInfo' ? 'active' : ''}`}
            onClick={() => setActiveTab('basicInfo')}
          >
            基本情報
          </button>
          <button 
            className={`tab-button ${activeTab === 'disabilityInfo' ? 'active' : ''}`}
            onClick={() => setActiveTab('disabilityInfo')}
          >
            障害情報
          </button>
          <button 
            className={`tab-button ${activeTab === 'employmentInfo' ? 'active' : ''}`}
            onClick={() => setActiveTab('employmentInfo')}
          >
            雇用情報
          </button>
          <button 
            className={`tab-button ${activeTab === 'monthlyInfo' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthlyInfo')}
          >
            月次情報
          </button>
        </div>
      </div>
      
      <div className="tab-content">
        {activeTab === 'basicInfo' && (
          <BasicInfo 
            employeeData={employeeData} 
            onUpdate={handleDataUpdate} 
          />
        )}
        {activeTab === 'disabilityInfo' && (
          <DisabilityInfo 
            employeeData={employeeData} 
            onUpdate={handleDataUpdate} 
          />
        )}
        {activeTab === 'employmentInfo' && (
          <EmploymentInfo 
            employeeData={employeeData} 
            onUpdate={handleDataUpdate} 
          />
        )}
        {activeTab === 'monthlyInfo' && (
          <MonthlyInfo 
            employeeData={employeeData} 
            onUpdate={handleDataUpdate} 
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeDetail;