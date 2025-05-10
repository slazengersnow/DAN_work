// src/components/JobAnalysis/JobAnalysis.tsx

import React, { useState, useEffect } from 'react';
import { JobCategory, Skill } from '../../../frontend/src/api/settingsApi';
import './JobAnalysis.css';

interface JobAnalysisProps {
  jobCategories: JobCategory[];
  onSave?: (updatedCategories: JobCategory[]) => void;
  readOnly?: boolean;
}

const JobAnalysis: React.FC<JobAnalysisProps> = ({ 
  jobCategories = [], 
  onSave,
  readOnly = false
}) => {
  const [localCategories, setLocalCategories] = useState<JobCategory[]>(jobCategories);
  
  useEffect(() => {
    setLocalCategories(jobCategories);
  }, [jobCategories]);

  // 職種カテゴリーの変更を処理
  const handleCategoryChange = (index: number, field: keyof JobCategory, value: any) => {
    if (readOnly) return;
    
    const updatedCategories = [...localCategories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value
    };
    setLocalCategories(updatedCategories);
  };

  // 職種カテゴリーを追加
  const addJobCategory = () => {
    if (readOnly) return;
    
    setLocalCategories([
      ...localCategories,
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
    if (readOnly) return;
    
    const updatedCategories = [...localCategories];
    updatedCategories.splice(index, 1);
    setLocalCategories(updatedCategories);
  };

  // スキルを追加
  const addSkill = (categoryIndex: number) => {
    if (readOnly) return;
    
    const updatedCategories = [...localCategories];
    updatedCategories[categoryIndex].requiredSkills = [
      ...(updatedCategories[categoryIndex].requiredSkills || []),
      { name: '', level: 1 }
    ];
    setLocalCategories(updatedCategories);
  };

  // スキルを削除
  const removeSkill = (categoryIndex: number, skillIndex: number) => {
    if (readOnly) return;
    
    const updatedCategories = [...localCategories];
    updatedCategories[categoryIndex].requiredSkills.splice(skillIndex, 1);
    setLocalCategories(updatedCategories);
  };

  // スキルの変更を処理
  const handleSkillChange = (categoryIndex: number, skillIndex: number, field: keyof Skill, value: any) => {
    if (readOnly) return;
    
    const updatedCategories = [...localCategories];
    updatedCategories[categoryIndex].requiredSkills[skillIndex] = {
      ...updatedCategories[categoryIndex].requiredSkills[skillIndex],
      [field]: value
    };
    setLocalCategories(updatedCategories);
  };

  // 変更を保存
  const handleSave = () => {
    if (readOnly || !onSave) return;
    onSave(localCategories);
  };

  // 適性スコアに応じた色を返す関数
  const getSuitabilityColor = (score: number) => {
    if (score >= 4) return '#4caf50'; // 良い (緑)
    if (score >= 3) return '#2196f3'; // 普通 (青)
    if (score >= 2) return '#ff9800'; // やや低い (オレンジ)
    return '#f44336'; // 低い (赤)
  };

  return (
    <div className="job-analysis-component">
      <div className="job-analysis-header">
        <h2>業務分析・適性評価</h2>
        <p className="job-analysis-description">障害者雇用に適した業務カテゴリーと必要なスキルの定義</p>
      </div>
      
      {localCategories.length === 0 ? (
        <div className="job-analysis-empty">
          <p>定義された職種カテゴリーはありません</p>
          {!readOnly && (
            <button className="job-analysis-add-btn" onClick={addJobCategory}>
              + 職種カテゴリー追加
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="job-categories-list">
            {localCategories.map((category, index) => (
              <div key={index} className="job-category-card">
                <div 
                  className="category-header" 
                  style={{ 
                    borderLeft: `4px solid ${getSuitabilityColor(category.suitabilityScore)}` 
                  }}
                >
                  <div className="category-title">
                    <h3>{category.name || '名称未設定'}</h3>
                    <div className="suitability-badge" style={{ backgroundColor: getSuitabilityColor(category.suitabilityScore) }}>
                      適性: {category.suitabilityScore}/5
                    </div>
                  </div>
                  {!readOnly && (
                    <button className="delete-btn" onClick={() => removeJobCategory(index)}>削除</button>
                  )}
                </div>
                
                <div className="category-content">
                  {!readOnly ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      {category.description && (
                        <div className="description-text">
                          {category.description}
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="skills-section">
                    <h4>必要なスキル</h4>
                    
                    {category.requiredSkills && category.requiredSkills.length > 0 ? (
                      <table className="skills-table">
                        <thead>
                          <tr>
                            <th>スキル名</th>
                            <th>レベル (1-5)</th>
                            {!readOnly && <th>操作</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {category.requiredSkills.map((skill, skillIndex) => (
                            <tr key={skillIndex}>
                              <td>
                                {readOnly ? (
                                  skill.name
                                ) : (
                                  <input 
                                    type="text" 
                                    value={skill.name} 
                                    onChange={(e) => handleSkillChange(index, skillIndex, 'name', e.target.value)}
                                  />
                                )}
                              </td>
                              <td>
                                {readOnly ? (
                                  <div className="skill-level-display">
                                    <div 
                                      className="skill-level-bar" 
                                      style={{ width: `${(skill.level / 5) * 100}%` }}
                                    ></div>
                                    <span>{skill.level}</span>
                                  </div>
                                ) : (
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max="5" 
                                    value={skill.level} 
                                    onChange={(e) => handleSkillChange(index, skillIndex, 'level', parseInt(e.target.value))}
                                  />
                                )}
                              </td>
                              {!readOnly && (
                                <td>
                                  <button className="delete-btn" onClick={() => removeSkill(index, skillIndex)}>削除</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-skills-message">スキルは定義されていません</div>
                    )}
                    
                    {!readOnly && (
                      <button className="add-skill-btn" onClick={() => addSkill(index)}>
                        + スキル追加
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {!readOnly && (
            <>
              <button className="add-category-btn" onClick={addJobCategory}>
                + 職種カテゴリー追加
              </button>
              
              <div className="actions">
                <button className="save-btn" onClick={handleSave}>変更を保存</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default JobAnalysis;