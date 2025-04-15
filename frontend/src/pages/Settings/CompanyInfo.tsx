// src/pages/Settings/CompanyInfo.tsx

import React, { useState } from 'react';
import { CompanySettings, Office } from '../../api/settingsApi';
import './CompanyInfo.css';

interface CompanyInfoProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

const CompanyInfo: React.FC<CompanyInfoProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [offices, setOffices] = useState<Office[]>(settings.offices || []);

  // 入力フィールドの変更を処理
  const handleInputChange = (field: keyof CompanySettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 事業所の編集
  const handleOfficeChange = (index: number, field: keyof Office, value: any) => {
    const updatedOffices = [...offices];
    updatedOffices[index] = {
      ...updatedOffices[index],
      [field]: value
    };
    setOffices(updatedOffices);
  };

  // 事業所を追加
  const addOffice = () => {
    setOffices([
      ...offices,
      {
        name: '',
        address: '',
        employeeCount: 0
      }
    ]);
  };

  // 事業所を削除
  const removeOffice = (index: number) => {
    const updatedOffices = [...offices];
    updatedOffices.splice(index, 1);
    setOffices(updatedOffices);
  };

  // 設定を保存
  const handleSave = () => {
    const updatedSettings = {
      ...localSettings,
      offices
    };
    onSave(updatedSettings);
  };

  return (
    <div className="company-info">
      <div className="card">
        <h2>会社基本情報</h2>
        
        <div className="field-row">
          <label>会社名</label>
          <input 
            type="text" 
            value={localSettings.company_name || ''} 
            onChange={(e) => handleInputChange('company_name', e.target.value)}
          />
        </div>
        
        <div className="field-row">
          <label>所在地</label>
          <input 
            type="text" 
            value={localSettings.company_address || ''} 
            onChange={(e) => handleInputChange('company_address', e.target.value)}
          />
        </div>
        
        <div className="field-row">
          <label>代表者名</label>
          <input 
            type="text" 
            value={localSettings.representativeName || ''} 
            onChange={(e) => handleInputChange('representativeName', e.target.value)}
          />
        </div>
        
        <div className="field-row">
          <label>事業内容</label>
          <input 
            type="text" 
            value={localSettings.businessContent || ''} 
            onChange={(e) => handleInputChange('businessContent', e.target.value)}
          />
        </div>
        
        <div className="field-row">
          <label>業種コード</label>
          <input 
            type="text" 
            value={localSettings.industryCode || ''} 
            onChange={(e) => handleInputChange('industryCode', e.target.value)}
          />
        </div>
      </div>
      
      <div className="card">
        <h2>事業所情報</h2>
        
        <table className="office-table">
          <thead>
            <tr>
              <th>事業所名</th>
              <th>所在地</th>
              <th>従業員数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {offices.map((office, index) => (
              <tr key={index}>
                <td>
                  <input 
                    type="text" 
                    value={office.name} 
                    onChange={(e) => handleOfficeChange(index, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={office.address} 
                    onChange={(e) => handleOfficeChange(index, 'address', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={office.employeeCount} 
                    onChange={(e) => handleOfficeChange(index, 'employeeCount', parseInt(e.target.value))}
                  />
                  <span>名</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="edit-btn">編集</button>
                    <button className="delete-btn" onClick={() => removeOffice(index)}>削除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button className="add-office-btn" onClick={addOffice}>
          + 事業所追加
        </button>
      </div>
      
      <div className="actions">
        <button className="cancel-btn">キャンセル</button>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>
    </div>
  );
};

export default CompanyInfo;