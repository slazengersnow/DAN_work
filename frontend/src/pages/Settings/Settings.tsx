// src/pages/Settings/Settings.tsx

import React, { useState, useEffect } from 'react';
import settingsApi, { CompanySettings } from '../../api/settingsApi';
import BasicSettings from './BasicSettings';
import CompanyInfo from './CompanyInfo';
// 不要なインポートを削除
// import EmploymentGoals from './EmploymentGoals';
// import JobAnalysis from './JobAnalysis';

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
        
        // 必須プロパティが欠けている場合は確実に含める
        const completeSettings: CompanySettings = {
          ...data,
          // 必須プロパティの存在確認とデフォルト値の設定
          payment_report_reminder: data.payment_report_reminder !== undefined ? 
            data.payment_report_reminder : true,
          monthly_report_reminder: data.monthly_report_reminder !== undefined ? 
            data.monthly_report_reminder : true,
          legal_rate_alert: data.legal_rate_alert !== undefined ? 
            data.legal_rate_alert : true
        };
        
        setSettings(completeSettings);
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
      
      // 必須プロパティが欠けている場合は追加
      const completeSettings: CompanySettings = {
        ...updatedSettings,
        // 現在の設定から復元するか、デフォルト値を設定
        payment_report_reminder: updatedSettings.payment_report_reminder !== undefined ? 
          updatedSettings.payment_report_reminder : 
          (settings?.payment_report_reminder ?? true),
        monthly_report_reminder: updatedSettings.monthly_report_reminder !== undefined ? 
          updatedSettings.monthly_report_reminder : 
          (settings?.monthly_report_reminder ?? true),
        legal_rate_alert: updatedSettings.legal_rate_alert !== undefined ? 
          updatedSettings.legal_rate_alert : 
          (settings?.legal_rate_alert ?? true)
      };
      
      await settingsApi.updateCompanySettings(completeSettings);
      setSettings(completeSettings);
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
        {/* 不要なタブを削除
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
        */}
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
          {/* 不要なタブのコンテンツを削除
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
          */}
        </div>
      )}
    </div>
  );
};

export default Settings;