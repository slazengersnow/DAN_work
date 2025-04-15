// src/pages/Settings/Settings.tsx

import React, { useState, useEffect } from 'react';
import { settingsApi, CompanySettings } from '../../api/settingsApi';
import BasicSettings from './BasicSettings';
import CompanyInfo from './CompanyInfo';
import EmploymentGoals from './EmploymentGoals';
import JobAnalysis from './JobAnalysis';

import './Settings.css';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 設定の読み込み
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsApi.getCompanySettings();
        setSettings(data);
        setError(null);
      } catch (err) {
        setError('設定データの読み込み中にエラーが発生しました');
        console.error('設定読み込みエラー:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 設定の保存
  const handleSaveSettings = async (updatedSettings: CompanySettings) => {
    try {
      setLoading(true);
      await settingsApi.updateCompanySettings(updatedSettings);
      setSettings(updatedSettings);
      alert('設定を保存しました');
    } catch (err) {
      setError('設定の保存中にエラーが発生しました');
      console.error('設定保存エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="breadcrumb">ホーム &gt; 設定</div>
      
      <h1>設定</h1>
      
      <div className="tabs">
        <button 
          className={activeTab === 'basic' ? 'tab-active' : 'tab'} 
          onClick={() => setActiveTab('basic')}
        >
          基本設定
        </button>
        <button 
          className={activeTab === 'company' ? 'tab-active' : 'tab'} 
          onClick={() => setActiveTab('company')}
        >
          会社情報
        </button>
        <button 
          className={activeTab === 'employment' ? 'tab-active' : 'tab'} 
          onClick={() => setActiveTab('employment')}
        >
          雇用目標
        </button>
        <button 
          className={activeTab === 'job' ? 'tab-active' : 'tab'} 
          onClick={() => setActiveTab('job')}
        >
          業務分析
        </button>
      </div>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="tab-content">
          {activeTab === 'basic' && settings && (
            <BasicSettings 
              settings={settings} 
              onSave={handleSaveSettings} 
            />
          )}
          {activeTab === 'company' && settings && (
            <CompanyInfo 
              settings={settings} 
              onSave={handleSaveSettings} 
            />
          )}
          {activeTab === 'employment' && settings && (
            <EmploymentGoals 
              settings={settings} 
              onSave={handleSaveSettings} 
            />
          )}
          {activeTab === 'job' && settings && (
            <JobAnalysis 
              settings={settings} 
              onSave={handleSaveSettings} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;