import React, { useState } from 'react';

// プロパティの型定義
interface SettingsProps {
  theme: string;
  onChangeTheme: (newTheme: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, onChangeTheme }) => {
  // モックデータ
  const mockCompanyData = {
    name: '株式会社サンプル',
    code: '1234567890',
    address: '東京都千代田区〇〇町1-2-3',
    legalRate: 2.3,
    fiscalYear: '2024年4月～2025年3月',
  };

  const [activeTab, setActiveTab] = useState<string>('basic');
  const [companyName, setCompanyName] = useState<string>(mockCompanyData.name);
  const [companyCode, setCompanyCode] = useState<string>(mockCompanyData.code);
  const [companyAddress, setCompanyAddress] = useState<string>(mockCompanyData.address);
  const [legalRate, setLegalRate] = useState<string>(mockCompanyData.legalRate.toString());
  const [fiscalYear, setFiscalYear] = useState<string>(mockCompanyData.fiscalYear);
  
  // 通知設定
  const [monthlyReportReminder, setMonthlyReportReminder] = useState<boolean>(false);
  const [legalRateAlert, setLegalRateAlert] = useState<boolean>(true);
  const [employmentEndNotice, setEmploymentEndNotice] = useState<boolean>(false);

  const handleSave = () => {
    // 実際のアプリではここで保存処理を行う
    alert('設定が保存されました');
  };

  return (
    <div>
      <h2 className="card-header">設定</h2>
      
      <div className="card">
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
          <div 
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer', 
              backgroundColor: activeTab === 'basic' ? '#f0f7ff' : 'transparent',
              borderBottom: activeTab === 'basic' ? '2px solid #4169e1' : 'none',
            }}
            onClick={() => setActiveTab('basic')}
          >
            基本設定
          </div>
          <div 
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer', 
              backgroundColor: activeTab === 'users' ? '#f0f7ff' : 'transparent',
              borderBottom: activeTab === 'users' ? '2px solid #4169e1' : 'none',
            }}
            onClick={() => setActiveTab('users')}
          >
            ユーザー管理
          </div>
          <div 
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer', 
              backgroundColor: activeTab === 'alerts' ? '#f0f7ff' : 'transparent',
              borderBottom: activeTab === 'alerts' ? '2px solid #4169e1' : 'none',
            }}
            onClick={() => setActiveTab('alerts')}
          >
            アラート設定
          </div>
          <div 
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer', 
              backgroundColor: activeTab === 'data' ? '#f0f7ff' : 'transparent',
              borderBottom: activeTab === 'data' ? '2px solid #4169e1' : 'none',
            }}
            onClick={() => setActiveTab('data')}
          >
            データ管理
          </div>
          <div 
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer', 
              backgroundColor: activeTab === 'theme' ? '#f0f7ff' : 'transparent',
              borderBottom: activeTab === 'theme' ? '2px solid #4169e1' : 'none',
            }}
            onClick={() => setActiveTab('theme')}
          >
            テーマ設定
          </div>
        </div>
        
        {activeTab === 'basic' && (
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>会社情報</h3>
              
              <div className="form-group">
                <label className="form-label">事業主名</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">事業主コード</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">所在地</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>
            </div>
            
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>法定雇用率設定</h3>
              
              <div className="form-group">
                <label className="form-label">法定雇用率</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ width: '100px' }}
                    value={legalRate}
                    onChange={(e) => setLegalRate(e.target.value)}
                  />
                  <span style={{ marginLeft: '10px' }}>%</span>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">対象となる事業年度</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                />
              </div>
            </div>
            
            <div className="card">
              <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>通知設定</h3>
              
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    id="monthlyReportReminder" 
                    checked={monthlyReportReminder}
                    onChange={(e) => setMonthlyReportReminder(e.target.checked)}
                    style={{ marginRight: '10px' }}
                  />
                  <label htmlFor="monthlyReportReminder">月次報告のリマインダー（毎月末日）</label>
                </div>
              </div>
              
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    id="legalRateAlert" 
                    checked={legalRateAlert}
                    onChange={(e) => setLegalRateAlert(e.target.checked)}
                    style={{ marginRight: '10px' }}
                  />
                  <label htmlFor="legalRateAlert">法定雇用率未達成のアラート</label>
                </div>
              </div>
              
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    id="employmentEndNotice" 
                    checked={employmentEndNotice}
                    onChange={(e) => setEmploymentEndNotice(e.target.checked)}
                    style={{ marginRight: '10px' }}
                  />
                  <label htmlFor="employmentEndNotice">障害者の雇用満了前のお知らせ（30日前）</label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>ユーザー管理機能</h3>
            <p>この機能は開発中です。</p>
          </div>
        )}
        
        {activeTab === 'alerts' && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>アラート設定</h3>
            <p>この機能は開発中です。</p>
          </div>
        )}
        
        {activeTab === 'data' && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>データ管理</h3>
            <p>この機能は開発中です。</p>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>テーマ設定</h3>
            <div className="form-group">
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    name="theme" 
                    value="light" 
                    checked={theme === 'light'} 
                    onChange={() => onChangeTheme('light')} 
                    style={{ marginRight: '10px' }}
                  />
                  ライトモード
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    name="theme" 
                    value="dark" 
                    checked={theme === 'dark'} 
                    onChange={() => onChangeTheme('dark')} 
                    style={{ marginRight: '10px' }}
                  />
                  ダークモード
                </label>
              </div>
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-secondary">キャンセル</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;