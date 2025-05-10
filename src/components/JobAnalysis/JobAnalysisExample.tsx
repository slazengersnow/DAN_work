// src/components/JobAnalysis/JobAnalysisExample.tsx

import React, { useState } from 'react';
import JobAnalysis from './JobAnalysis';
import { JobCategory } from '../../../frontend/src/api/settingsApi';

const JobAnalysisExample: React.FC = () => {
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([
    {
      name: 'データ入力',
      description: '正確なデータ入力とスプレッドシート操作が必要な業務です。集中力と注意力が重視されます。',
      suitabilityScore: 4,
      requiredSkills: [
        { name: 'タイピング', level: 3 },
        { name: 'Excel操作', level: 2 },
        { name: '集中力', level: 4 }
      ]
    },
    {
      name: 'ウェブサイト管理',
      description: 'コンテンツ更新や簡単なHTMLコーディングなどのウェブサイト管理業務です。',
      suitabilityScore: 3,
      requiredSkills: [
        { name: 'HTML基礎', level: 2 },
        { name: 'コンテンツ管理', level: 3 },
        { name: '画像加工', level: 2 }
      ]
    }
  ]);

  const handleSave = (updatedCategories: JobCategory[]) => {
    setJobCategories(updatedCategories);
    console.log('Updated job categories:', updatedCategories);
    
    // 実際のアプリでは、ここでAPIリクエストを送信してデータを保存
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '30px' }}>業務分析コンポーネント例</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>編集可能モード</h2>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <JobAnalysis 
            jobCategories={jobCategories} 
            onSave={handleSave} 
          />
        </div>
      </div>
      
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>閲覧専用モード</h2>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <JobAnalysis 
            jobCategories={jobCategories} 
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
};

export default JobAnalysisExample;