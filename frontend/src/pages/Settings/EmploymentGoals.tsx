// src/pages/Settings/EmploymentGoals.tsx

import React, { useState } from 'react';
import { CompanySettings } from '../../api/settingsApi';
import './EmploymentGoals.css';

interface EmploymentGoalsProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

const EmploymentGoals: React.FC<EmploymentGoalsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [yearlyGoals, setYearlyGoals] = useState<{ [key: string]: number }>(
    settings.employmentGoals || {
      '2023年度': 10,
      '2024年度': 12,
      '2025年度': 15
    }
  );

  // 目標数値の変更を処理
  const handleGoalChange = (year: string, value: number) => {
    setYearlyGoals(prev => ({
      ...prev,
      [year]: value
    }));
  };

  // 目標年度の追加
  const addYearlyGoal = () => {
    const years = Object.keys(yearlyGoals);
    const lastYear = years[years.length - 1] || '2024年度';
    const nextYear = parseInt(lastYear.replace('年度', '')) + 1 + '年度';
    
    setYearlyGoals(prev => ({
      ...prev,
      [nextYear]: prev[lastYear] || 0
    }));
  };

  // 目標年度の削除
  const removeYearlyGoal = (year: string) => {
    const updatedGoals = { ...yearlyGoals };
    delete updatedGoals[year];
    setYearlyGoals(updatedGoals);
  };

  // 設定を保存
  const handleSave = () => {
    const updatedSettings = {
      ...localSettings,
      employmentGoals: yearlyGoals
    };
    onSave(updatedSettings);
  };

  return (
    <div className="employment-goals">
      <div className="card">
        <h2>雇用目標設定</h2>
        <p className="description">年度ごとの障害者雇用目標数を設定します。実績と比較して達成率が計算されます。</p>
        
        <div className="goals-table">
          <table>
            <thead>
              <tr>
                <th>年度</th>
                <th>雇用目標数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(yearlyGoals).map(([year, goal]) => (
                <tr key={year}>
                  <td>{year}</td>
                  <td>
                    <input 
                      type="number" 
                      value={goal} 
                      onChange={(e) => handleGoalChange(year, parseInt(e.target.value) || 0)}
                    />
                    <span className="unit">名</span>
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => removeYearlyGoal(year)}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button className="add-goal-btn" onClick={addYearlyGoal}>
            + 目標年度追加
          </button>
        </div>
      </div>
      
      <div className="actions">
        <button className="cancel-btn">キャンセル</button>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>
    </div>
  );
};

export default EmploymentGoals;