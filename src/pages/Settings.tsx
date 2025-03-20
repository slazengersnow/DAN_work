import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [theme, setTheme] = useState<string>('light');
  const [notifications, setNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('ja');

  return (
    <div className="page-container">
      <h1 className="page-title">設定</h1>
      
      <div className="chart-container">
        <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>アプリケーション設定</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>テーマ</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={theme === 'light' ? 'active' : 'secondary'} 
              onClick={() => setTheme('light')}
            >
              ライトモード
            </button>
            <button 
              className={theme === 'dark' ? 'active' : 'secondary'} 
              onClick={() => setTheme('dark')}
            >
              ダークモード
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>言語</div>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
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
              checked={notifications} 
              onChange={() => setNotifications(!notifications)}
              style={{ marginRight: '10px' }}
            />
            システム通知を受け取る
          </label>
        </div>
      </div>
      
      <div className="chart-container">
        <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>アカウント設定</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>パスワード変更</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
            <input type="password" placeholder="現在のパスワード" />
            <input type="password" placeholder="新しいパスワード" />
            <input type="password" placeholder="新しいパスワード (確認)" />
          </div>
          <button style={{ marginTop: '10px' }}>変更</button>
        </div>
      </div>
      
      <div className="chart-container">
        <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>法定雇用率設定</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>現在の法定雇用率</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="text" 
              value="2.3" 
              style={{ width: '100px' }}
            />
            <span>%</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
            ※ 法定雇用率は変更される場合があります。最新の法定雇用率を設定してください。
          </div>
          <button style={{ marginTop: '10px' }}>更新</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;