// src/pages/Settings/CompanyInfo.tsx

import React, { useState, useEffect } from 'react';
import { CompanySettings, Office } from '../../api/settingsApi';
import './CompanyInfo.css';

interface CompanyInfoProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

// 除外率のマッピングデータ
interface IndustryExclusionRate {
  rate: number;
  industries: string[];
}

const exclusionRates: IndustryExclusionRate[] = [
  { 
    rate: 5, 
    industries: ['非鉄金属第一次製錬・精製業', '貨物運送取扱業（集配利用運送業を除く）'] 
  },
  { 
    rate: 10, 
    industries: ['建設業', '鉄鋼業', '道路貨物運送業', '郵便業（信書便事業を含む）'] 
  },
  { 
    rate: 15, 
    industries: ['港湾運送業', '警備業'] 
  },
  { 
    rate: 20, 
    industries: ['鉄道業', '医療業', '高等教育機関', '介護老人保健施設', '介護医療院'] 
  },
  { 
    rate: 25, 
    industries: ['林業（狩猟業を除く）'] 
  },
  { 
    rate: 30, 
    industries: ['金属鉱業', '児童福祉事業'] 
  },
  { 
    rate: 35, 
    industries: ['特別支援学校（専ら視覚障害者に対する教育を行う学校を除く）'] 
  },
  { 
    rate: 40, 
    industries: ['石炭・亜炭鉱業'] 
  },
  { 
    rate: 45, 
    industries: ['道路旅客運送業', '小学校'] 
  },
  { 
    rate: 50, 
    industries: ['幼稚園', '幼保連携型認定こども園'] 
  },
  { 
    rate: 70, 
    industries: ['船員等による船舶運航等の事業'] 
  }
];

// すべての業種を一覧にフラット化
const allIndustryTypes = exclusionRates.flatMap(item => item.industries);

const CompanyInfo: React.FC<CompanyInfoProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [offices, setOffices] = useState<Office[]>(settings.offices || []);
  const [selectedIndustryType, setSelectedIndustryType] = useState<string>(
    settings.industryType || ''
  );
  const [exclusionRate, setExclusionRate] = useState<number>(
    settings.exclusionRate || 0
  );

  // 業種が変更されたときに除外率を自動設定
  useEffect(() => {
    if (selectedIndustryType) {
      // 選択された業種に対応する除外率を探す
      const foundRate = exclusionRates.find(item => 
        item.industries.includes(selectedIndustryType)
      );
      
      if (foundRate) {
        setExclusionRate(foundRate.rate);
        handleInputChange('exclusionRate', foundRate.rate);
      } else {
        setExclusionRate(0);
        handleInputChange('exclusionRate', 0);
      }
    } else {
      setExclusionRate(0);
      handleInputChange('exclusionRate', 0);
    }
  }, [selectedIndustryType]);

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
        employeeCount: 0,
        serialNumber: '' // 事業所別連番の初期値
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
      offices,
      industryType: selectedIndustryType,
      exclusionRate: exclusionRate
    };
    onSave(updatedSettings);
  };

  // 産業分類の変更を処理
  const handleIndustryTypeChange = (value: string) => {
    setSelectedIndustryType(value);
    handleInputChange('industryType', value);
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

        <div className="field-row">
          <label>産業分類</label>
          <div className="field-content">
            <select
              value={selectedIndustryType}
              onChange={(e) => handleIndustryTypeChange(e.target.value)}
              className="industry-select"
            >
              <option value="">選択してください</option>
              {allIndustryTypes.map((industry, index) => (
                <option key={index} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            <p className="help-text">除外率が適用される業種を選択してください</p>
          </div>
        </div>

        <div className="field-row">
          <label>除外率</label>
          <div className="field-content">
            <input
              type="text"
              value={`${exclusionRate}%`}
              readOnly
              className="exclusion-rate-input"
            />
            <p className="help-text">産業分類から自動的に設定されます</p>
          </div>
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
              <th>事業所別連番</th>
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
                  <select
                    value={office.serialNumber || ''}
                    onChange={(e) => handleOfficeChange(index, 'serialNumber', e.target.value)}
                    className="serial-number-select"
                  >
                    <option value="">指定なし</option>
                    <option value="001">001: 特例子会社等の認定を受けた事業所</option>
                    <option value="002">002: 就労継続支援A型</option>
                  </select>
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