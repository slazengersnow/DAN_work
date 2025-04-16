// src/pages/Settings/BasicSettings.tsx

import React, { useState } from 'react';
import { CompanySettings } from '../../api/settingsApi';
import './BasicSettings.css';

interface BasicSettingsProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

const BasicSettings: React.FC<BasicSettingsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [bulkRate, setBulkRate] = useState<string>('2.5');
  const [selectedYear, setSelectedYear] = useState<string>('2024年度');
  
  // 初期の月別法定雇用率を設定
  const [monthlyRates, setMonthlyRates] = useState<{ [key: string]: { [key: string]: string } }>(
    settings.legalRates || {
      '2024年度': {
        '4月': '2.5', '5月': '2.5', '6月': '2.5', '7月': '2.5', '8月': '2.5', '9月': '2.5',
        '10月': '2.5', '11月': '2.5', '12月': '2.5', '1月': '2.5', '2月': '2.5', '3月': '2.5'
      }
    }
  );

  // 一括設定を適用
  const applyBulkRate = () => {
    const updatedRates = { ...monthlyRates };
    const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
    
    months.forEach(month => {
      updatedRates[selectedYear][month] = bulkRate;
    });
    
    setMonthlyRates(updatedRates);
  };

  // 月別の雇用率を更新
  const handleRateChange = (year: string, month: string, value: string) => {
    setMonthlyRates(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [month]: value
      }
    }));
  };

  // 入力フィールドの変更を処理
  const handleInputChange = (field: keyof CompanySettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 設定を保存
  const handleSave = () => {
    const updatedSettings = {
      ...localSettings,
      legalRates: monthlyRates // 月別の法定雇用率を保存
    };
    onSave(updatedSettings);
  };

  return (
    <div className="basic-settings">
      <div className="card">
        <h2>基本的な法規制・計算関連設定</h2>
        
        <div className="setting-section">
          <h3>法定雇用率</h3>
          <p className="description">年月ごとに適用される法定雇用率を設定できます。2026年7月から2.7%に変更されます。</p>
          
          <div className="year-selector">
            <div className="field-group">
              <label>年度</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="2024年度">2024年度</option>
                <option value="2025年度">2025年度</option>
              </select>
            </div>
            
            <div className="field-group">
              <label>一括設定</label>
              <input 
                type="text" 
                value={bulkRate} 
                onChange={(e) => setBulkRate(e.target.value)}
              />
              <button className="apply-btn" onClick={applyBulkRate}>適用</button>
            </div>
          </div>
          
          <div className="monthly-rates-table">
            <table>
              <thead>
                <tr>
                  <th className="header-cell">項目</th>
                  <th className="month-cell">4月</th>
                  <th className="month-cell">5月</th>
                  <th className="month-cell">6月</th>
                  <th className="month-cell">7月</th>
                  <th className="month-cell">8月</th>
                  <th className="month-cell">9月</th>
                  <th className="month-cell">10月</th>
                  <th className="month-cell">11月</th>
                  <th className="month-cell">12月</th>
                  <th className="month-cell">1月</th>
                  <th className="month-cell">2月</th>
                  <th className="month-cell">3月</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label-cell">法定雇用率 (%)</td>
                  {['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'].map(month => (
                    <td key={month} className="data-cell">
                      <input
                        type="text"
                        value={monthlyRates[selectedYear][month] || '2.5'}
                        onChange={(e) => handleRateChange(selectedYear, month, e.target.value)}
                        className="rate-input"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="setting-section payment-settings">
          <h3>納付金等単価設定</h3>
          <p className="description">障害者雇用納付金・調整金などの金額単価を設定します。</p>
          
          <div className="payment-row">
            <div className="payment-column">
              <div className="field-row">
                <label>納付金額単価</label>
                <div className="field-content">
                  <input 
                    type="text" 
                    value={localSettings.paymentAmount || 50000} 
                    onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                  />
                  <span className="unit">円/月</span>
                  <p className="help-text">法定雇用率未達成の場合の1人あたり月額</p>
                </div>
              </div>
            </div>
            
            <div className="payment-column">
              <div className="field-row">
                <label>調整金額単価</label>
                <div className="field-content">
                  <input 
                    type="text" 
                    value={localSettings.subsidyAmount || 27000} 
                    onChange={(e) => handleInputChange('subsidyAmount', e.target.value)}
                  />
                  <span className="unit">円/月</span>
                  <p className="help-text">法定雇用率達成の場合の1人あたり月額</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="field-row">
            <label>報奨金額単価</label>
            <div className="field-content">
              <input 
                type="text" 
                value={localSettings.rewardAmount || 21000} 
                onChange={(e) => handleInputChange('rewardAmount', e.target.value)}
              />
              <span className="unit">円/月</span>
              <p className="help-text">特例子会社等への報奨金</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="actions">
        <button className="cancel-btn">キャンセル</button>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>
    </div>
  );
};

export default BasicSettings;