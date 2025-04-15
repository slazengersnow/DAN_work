// src/pages/Settings/JobAnalysis.tsx

import React, { useState } from 'react';
import { CompanySettings, JobCategory } from '../../api/settingsApi';
import './JobAnalysis.css';

interface JobAnalysisProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

const JobAnalysis: React.FC<JobAnalysisProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [jobCategories, setJobCategories] = useState<JobCategory[]>(
    settings.jobCategories || []
  );

  // 職種カテゴリーの変更を処理
  const handleCategoryChange = (index: number, field: keyof JobCategory, value: any) => {
    const updatedCategories = [...jobCategories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value
    };
    setJobCategories(updatedCategories);
  };

  // 職種カテゴリーを追加
  const addJobCategory = () => {
    setJobCategories([
      ...jobCategories,
      {
        name: '',
        description: '',
        suitabilityScore: 3,
        requiredSkills: []
      }
    ]);
  };

  // 職種カテゴリーを削除
  const removeJobCategory = (index: number) => {
    const updatedCategories = [...jobCategories];
    updatedCategories.splice(index, 1);
    setJobCategories(updatedCategories);
  };

  // スキルを追加
  const addSkill = (categoryIndex: number) => {
    const updatedCategories = [...jobCategories];
    updatedCategories[categoryIndex].requiredSkills = [
      ...(updatedCategories[categoryIndex].requiredSkills || []),
      { name: '', level: 1 }
    ];
    setJobCategories(updatedCategories);
  };

  // スキルを削除
  const removeSkill = (categoryIndex: number, skillIndex: number) => {
    const updatedCategories = [...jobCategories];
    updatedCategories[categoryIndex].requiredSkills.splice(skillIndex, 1);
    setJobCategories(updatedCategories);
  };

  // スキルの変更を処理
  const handleSkillChange = (categoryIndex: number, skillIndex: number, field: string, value: any) => {
    const updatedCategories = [...jobCategories];
    updatedCategories[categoryIndex].requiredSkills[skillIndex] = {
      ...updatedCategories[categoryIndex].requiredSkills[skillIndex],
      [field]: value
    };
    setJobCategories(updatedCategories);
  };

  // 設定を保存
  const handleSave = () => {
    const updatedSettings = {
      ...localSettings,
      jobCategories
    };
    onSave(updatedSettings);
  };

  return (
    <div className="job-analysis">
      <div className="card">
        <h2>業務分析・適性評価</h2>
        <p className="description">障害者雇用に適した業務カテゴリーと必要なスキルを定義します。これにより業務と人材のマッチング精度が向上します。</p>
        
        {jobCategories.map((category, index) => (
          <div key={index} className="job-category">
            <div className="category-header">
              <h3>職種カテゴリー {index + 1}</h3>
              <button className="delete-btn" onClick={() => removeJobCategory(index)}>削除</button>
            </div>
            
            <div className="category-content">
              <div className="field-row">
                <label>カテゴリー名</label>
                <input 
                  type="text" 
                  value={category.name} 
                  onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                />
              </div>
              
              <div className="field-row">
                <label>説明</label>
                <textarea 
                  value={category.description} 
                  onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                />
              </div>
              
              <div className="field-row">
                <label>適性評価 (1-5)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={category.suitabilityScore} 
                  onChange={(e) => handleCategoryChange(index, 'suitabilityScore', parseInt(e.target.value))}
                />
              </div>
              
              <div className="skills-section">
                <h4>必要なスキル</h4>
                
                <table className="skills-table">
                  <thead>
                    <tr>
                      <th>スキル名</th>
                      <th>レベル (1-5)</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.requiredSkills && category.requiredSkills.map((skill, skillIndex) => (
                      <tr key={skillIndex}>
                        <td>
                          <input 
                            type="text" 
                            value={skill.name} 
                            onChange={(e) => handleSkillChange(index, skillIndex, 'name', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="1" 
                            max="5" 
                            value={skill.level} 
                            onChange={(e) => handleSkillChange(index, skillIndex, 'level', parseInt(e.target.value))}
                          />
                        </td>
                        <td>
                          <button className="delete-btn" onClick={() => removeSkill(index, skillIndex)}>削除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <button className="add-skill-btn" onClick={() => addSkill(index)}>
                  + スキル追加
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <button className="add-category-btn" onClick={addJobCategory}>
          + 職種カテゴリー追加
        </button>
      </div>
      
      <div className="actions">
        <button className="cancel-btn">キャンセル</button>
        <button className="save-btn" onClick={handleSave}>保存</button>
      </div>
    </div>
  );
};

export default JobAnalysis;