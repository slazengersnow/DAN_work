import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsApi } from '../api/settingsApi';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';

// 型定義
interface CompanySettings {
  company_name: string;
  company_code: string;
  company_address: string;
  legal_rate: number;
  fiscal_year_start: string;
  fiscal_year_end: string;
  monthly_report_reminder: boolean;
  legal_rate_alert: boolean;
  employment_end_notice: boolean;
  theme: string;
  language?: string;
  notifications?: boolean;
}

interface User {
  id: number;
  username: string;
  role: string;
  created_at?: string;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('application');
  const queryClient = useQueryClient();
  
  // React Query: 設定データの取得
  const { 
    data: companySettings, 
    isLoading: isLoadingSettings, 
    error: settingsError 
  } = useQuery(
    'companySettings',
    settingsApi.getCompanySettings,
    {
      // エラー時にフォールバックデータを提供
      onError: () => {
        return {
          company_name: '',
          company_code: '',
          company_address: '',
          legal_rate: 2.3,
          fiscal_year_start: '',
          fiscal_year_end: '',
          monthly_report_reminder: true,
          legal_rate_alert: true,
          employment_end_notice: false,
          theme: 'light',
          language: 'ja',
          notifications: true
        };
      }
    }
  );
  
  // React Query: ユーザーデータの取得（accountタブでのみ使用）
  const { 
    data: users, 
    isLoading: isLoadingUsers, 
    error: usersError 
  } = useQuery(
    'users',
    settingsApi.getUsers,
    { enabled: activeTab === 'account' } // accountタブが選択されている場合のみクエリを実行
  );
  
  // フォームステート
  const [formData, setFormData] = useState<CompanySettings>({
    company_name: '',
    company_code: '',
    company_address: '',
    legal_rate: 2.3,
    fiscal_year_start: '',
    fiscal_year_end: '',
    monthly_report_reminder: true,
    legal_rate_alert: true,
    employment_end_notice: false,
    theme: 'light',
    language: 'ja',
    notifications: true
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // データが読み込まれたらフォームを初期化
  useEffect(() => {
    if (companySettings) {
      setFormData({
        ...companySettings,
        language: companySettings.language || 'ja',
        notifications: companySettings.notifications !== undefined 
          ? companySettings.notifications 
          : true
      });
    }
  }, [companySettings]);
  
  // Mutation: 設定更新
  const updateSettingsMutation = useMutation(
    (newSettings: CompanySettings) => settingsApi.updateCompanySettings(newSettings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companySettings');
        alert('設定を保存しました');
      },
      onError: () => {
        alert('設定の保存に失敗しました');
      }
    }
  );
  
  // Mutation: パスワード変更
  const changePasswordMutation = useMutation(
    (passwordData: any) => settingsApi.changePassword(passwordData),
    {
      onSuccess: () => {
        alert('パスワードを変更しました');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      },
      onError: () => {
        alert('パスワード変更に失敗しました');
      }
    }
  );
  
  // 入力値の変更ハンドラー
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    // チェックボックスの場合
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    // 法定雇用率の場合は数値に変換
    if (name === 'legal_rate') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
      return;
    }
    
    // その他の通常フィールド
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // パスワードフォームの変更ハンドラー
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // アプリケーション設定の保存
  const handleAppSettingsSave = () => {
    // テーマ、言語、通知設定のみ更新
    const appSettings = {
      ...companySettings,
      theme: formData.theme,
      language: formData.language,
      notifications: formData.notifications
    };
    
    updateSettingsMutation.mutate(appSettings as CompanySettings);
  };
  
  // 法定雇用率の更新
  const handleLegalRateUpdate = () => {
    // 法定雇用率のみ更新
    const legalRateSettings = {
      ...companySettings,
      legal_rate: formData.legal_rate
    };
    
    updateSettingsMutation.mutate(legalRateSettings as CompanySettings);
  };
  
  // パスワード変更処理
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('新しいパスワードと確認用パスワードが一致しません');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      alert('パスワードは8文字以上にしてください');
      return;
    }
    
    changePasswordMutation.mutate(passwordData);
  };
  
  // 会社情報フォームの送信
  const handleCompanyFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };
  
  // テーマ切り替え
  const handleThemeChange = (newTheme: string) => {
    setFormData(prev => ({
      ...prev,
      theme: newTheme
    }));
    
    // 実際のアプリケーションではここでテーマの適用処理を行う
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  // ローディング状態
  if (isLoadingSettings && activeTab !== 'account') {
    return <Spinner />;
  }
  
  // エラー状態
  if (settingsError && activeTab !== 'account') {
    return <ErrorMessage message="設定データの読み込み中にエラーが発生しました" />;
  }
  
  const tabItems = [
    { id: 'application', label: 'アプリケーション' },
    { id: 'account', label: 'アカウント' },
    { id: 'company', label: '会社情報' },
    { id: 'legal', label: '法定雇用率' },
    { id: 'notifications', label: '通知設定' }
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">設定</h1>
      
      <div className="tab-container" style={{ marginBottom: '20px' }}>
        <div className="tabs">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* アプリケーション設定タブ */}
      {activeTab === 'application' && (
        <div className="chart-container">
          <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>アプリケーション設定</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>テーマ</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={formData.theme === 'light' ? 'active' : 'secondary'} 
                onClick={() => handleThemeChange('light')}
              >
                ライトモード
              </button>
              <button 
                className={formData.theme === 'dark' ? 'active' : 'secondary'} 
                onClick={() => handleThemeChange('dark')}
              >
                ダークモード
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>言語</div>
            <select 
              name="language"
              value={formData.language}
              onChange={handleChange}
              style={{ width: '200px' }}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>通知設定</div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="notifications"
                checked={formData.notifications} 
                onChange={handleChange}
                style={{ marginRight: '10px' }}
              />
              システム通知を受け取る
            </label>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={handleAppSettingsSave}
              disabled={updateSettingsMutation.isLoading}
            >
              {updateSettingsMutation.isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
      
      {/* アカウント設定タブ */}
      {activeTab === 'account' && (
        <div className="chart-container">
          <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>アカウント設定</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>パスワード変更</div>
            <form onSubmit={handlePasswordChange}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="現在のパスワード" 
                  required
                />
                <input 
                  type="password" 
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="新しいパスワード" 
                  required
                />
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="新しいパスワード (確認)" 
                  required
                />
              </div>
              <button 
                type="submit" 
                style={{ marginTop: '10px' }}
                disabled={changePasswordMutation.isLoading}
              >
                {changePasswordMutation.isLoading ? '変更中...' : '変更'}
              </button>
            </form>
          </div>
          
          {/* ユーザー管理 (管理者向け) */}
          {users && users.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>ユーザー管理</h3>
              
              {isLoadingUsers ? (
                <Spinner />
              ) : usersError ? (
                <ErrorMessage message="ユーザーデータの読み込み中にエラーが発生しました" />
              ) : (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <button className="btn-primary">新規ユーザー追加</button>
                  </div>
                  
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>ユーザー名</th>
                        <th>権限</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user: User) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.username}</td>
                          <td>{user.role === 'admin' ? '管理者' : 'ユーザー'}</td>
                          <td>{user.created_at ? new Date(user.created_at).toLocaleDateString('ja-JP') : '-'}</td>
                          <td>
                            <button className="btn-secondary btn-sm" style={{ marginRight: '5px' }}>編集</button>
                            <button className="btn-danger btn-sm">削除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* 会社情報タブ */}
      {activeTab === 'company' && (
        <div className="chart-container">
          <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>会社情報</h2>
          
          <form onSubmit={handleCompanyFormSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>事業主名</div>
              <input 
                type="text" 
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                style={{ width: '100%', maxWidth: '400px' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>事業主コード</div>
              <input 
                type="text" 
                name="company_code"
                value={formData.company_code}
                onChange={handleChange}
                style={{ width: '100%', maxWidth: '400px' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>所在地</div>
              <input 
                type="text" 
                name="company_address"
                value={formData.company_address}
                onChange={handleChange}
                style={{ width: '100%', maxWidth: '400px' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>対象となる事業年度</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="date" 
                  name="fiscal_year_start"
                  value={formData.fiscal_year_start}
                  onChange={handleChange}
                />
                <span>～</span>
                <input 
                  type="date" 
                  name="fiscal_year_end"
                  value={formData.fiscal_year_end}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <button 
                type="submit"
                disabled={updateSettingsMutation.isLoading}
              >
                {updateSettingsMutation.isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 法定雇用率タブ */}
      {activeTab === 'legal' && (
        <div className="chart-container">
          <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>法定雇用率設定</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>現在の法定雇用率</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="text" 
                name="legal_rate"
                value={formData.legal_rate} 
                onChange={handleChange}
                style={{ width: '100px' }}
              />
              <span>%</span>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
              ※ 法定雇用率は変更される場合があります。最新の法定雇用率を設定してください。
            </div>
            <button 
              style={{ marginTop: '10px' }}
              onClick={handleLegalRateUpdate}
              disabled={updateSettingsMutation.isLoading}
            >
              {updateSettingsMutation.isLoading ? '更新中...' : '更新'}
            </button>
          </div>
        </div>
      )}
      
      {/* 通知設定タブ */}
      {activeTab === 'notifications' && (
        <div className="chart-container">
          <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>通知設定</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>アラート通知</div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="monthly_report_reminder"
                  checked={formData.monthly_report_reminder} 
                  onChange={handleChange}
                  style={{ marginRight: '10px' }}
                />
                月次報告のリマインダー（毎月末日）
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="legal_rate_alert"
                  checked={formData.legal_rate_alert} 
                  onChange={handleChange}
                  style={{ marginRight: '10px' }}
                />
                法定雇用率未達成のアラート
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="employment_end_notice"
                  checked={formData.employment_end_notice} 
                  onChange={handleChange}
                  style={{ marginRight: '10px' }}
                />
                障害者の雇用満了前のお知らせ（30日前）
              </label>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={handleCompanyFormSubmit}
                disabled={updateSettingsMutation.isLoading}
              >
                {updateSettingsMutation.isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

// API クライアント関数のサンプル実装
// src/api/settingsApi.ts として別ファイルに実装することを推奨
/*
import axios from 'axios';

export interface CompanySettings {
  company_name: string;
  company_code: string;
  company_address: string;
  legal_rate: number;
  fiscal_year_start: string;
  fiscal_year_end: string;
  monthly_report_reminder: boolean;
  legal_rate_alert: boolean;
  employment_end_notice: boolean;
  theme: string;
  language?: string;
  notifications?: boolean;
}

export interface User {
  id: number;
  username: string;
  role: string;
  created_at?: string;
}

export const settingsApi = {
  // 会社設定を取得
  getCompanySettings: async (): Promise<CompanySettings> => {
    try {
      const response = await axios.get('/api/settings/company');
      return response.data;
    } catch (error) {
      // 開発中はモックデータを返す
      if (process.env.NODE_ENV === 'development') {
        return {
          company_name: 'サンプル株式会社',
          company_code: 'SAMPLE-123',
          company_address: '東京都千代田区〇〇 1-1-1',
          legal_rate: 2.3,
          fiscal_year_start: '2024-04-01',
          fiscal_year_end: '2025-03-31',
          monthly_report_reminder: true,
          legal_rate_alert: true,
          employment_end_notice: false,
          theme: 'light',
          language: 'ja',
          notifications: true
        };
      }
      throw error;
    }
  },

  // 会社設定を更新
  updateCompanySettings: async (data: CompanySettings): Promise<CompanySettings> => {
    try {
      const response = await axios.put('/api/settings/company', data);
      return response.data;
    } catch (error) {
      // 開発中は成功したふりをする
      if (process.env.NODE_ENV === 'development') {
        return data;
      }
      throw error;
    }
  },

  // ユーザー一覧を取得
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await axios.get('/api/users');
      return response.data;
    } catch (error) {
      // 開発中はモックデータを返す
      if (process.env.NODE_ENV === 'development') {
        return [
          { id: 1, username: 'admin', role: 'admin', created_at: '2023-01-01T00:00:00Z' },
          { id: 2, username: 'user1', role: 'user', created_at: '2023-01-15T00:00:00Z' },
          { id: 3, username: 'user2', role: 'user', created_at: '2023-02-01T00:00:00Z' }
        ];
      }
      throw error;
    }
  },

  // パスワード変更
  changePassword: async (data: { currentPassword: string, newPassword: string }): Promise<void> => {
    try {
      await axios.post('/api/users/change-password', data);
    } catch (error) {
      // 開発中は成功したふりをする
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      throw error;
    }
  }
};
*/