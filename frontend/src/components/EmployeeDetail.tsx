// EmployeeDetail.tsx
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
  const [isEditing, setIsEditing] = useState<boolean>(false);

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
  };

  // 保存ボタンのクリック処理
  const handleSave = (): void => {
    // APIでデータ保存処理など
    alert('保存しました');
    setIsEditing(false);
  };

  return (
    <div className="employee-detail-container">
      <div className="employee-detail-header">
        <h2 className="employee-detail-title">社員詳細</h2>
        <div className="employee-id-name">{employeeData.name} ({employeeData.employeeId})</div>
        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onBack}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            戻る
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isEditing ? '編集中止' : '編集'}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3a66d4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: isEditing ? 'block' : 'none'
            }}
          >
            保存
          </button>
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
            isEditing={isEditing}
          />
        )}
        {activeTab === 'disabilityInfo' && (
          <DisabilityInfo 
            employeeData={employeeData} 
            onUpdate={handleDataUpdate}
            isEditing={isEditing}
          />
        )}
        {activeTab === 'employmentInfo' && (
          <EmploymentInfo 
            employeeData={employeeData} 
            onUpdate={handleDataUpdate}
            isEditing={isEditing}
          />
        )}
        {activeTab === 'monthlyInfo' && (
          <MonthlyInfo 
            employeeData={employeeData} 
            onUpdate={handleDataUpdate}
            isEditing={isEditing}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeDetail;