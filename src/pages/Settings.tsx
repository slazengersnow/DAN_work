import React, { useState, useEffect } from 'react';
import { 
  ElementDetector,
  DOMManipulator,
  diagnosePageStructure
} from '../utils/common';

const Settings: React.FC = () => {
  const [theme, setTheme] = useState<string>('light');
  const [notifications, setNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('ja');

  // 設定ページ専用の診断と最適化機能
  const runSettingsDiagnostics = async () => {
    // 基本的な診断を実行
    const basicReport = await diagnosePageStructure({
      includeStyles: true,
      maxDepth: 3
    });
    
    // フォーム要素の検出
    const inputFields = ElementDetector.findFormElements(['input', 'select', 'textarea']);
    
    // ボタン要素の検出用のヘルパー関数
    const findButtonsByText = (textPatterns: string[]): HTMLElement[] => {
      const allButtons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
      return allButtons.filter(button => {
        const buttonText = (button as HTMLElement).innerText || (button as HTMLInputElement).value || '';
        return textPatterns.some(pattern => buttonText.includes(pattern));
      }) as HTMLElement[];
    };
    
    // ボタン要素の検出
    const saveButtons = findButtonsByText(['保存', '適用', '更新', '変更', 'Save', 'Apply']);
    const resetButtons = findButtonsByText(['リセット', 'キャンセル', 'Reset', 'Cancel']);
    
    // 設定ページに特化した診断項目を追加
    const settingsReport = {
      ...basicReport,
      settingsSpecific: {
        formCount: document.querySelectorAll('form').length,
        inputFields: inputFields && inputFields.elements ? inputFields.elements.length : 0,
        saveButtons: saveButtons.length,
        resetButtons: resetButtons.length
      }
    };
    
    return settingsReport;
  };

  // beforeunloadのイベントハンドラを定義
  const handleBeforeUnload = (e: BeforeUnloadEvent, formChanged: boolean) => {
    if (formChanged) {
      // 標準的な離脱警告を表示
      e.preventDefault();
      e.returnValue = '変更が保存されていません。ページを離れますか？';
      return e.returnValue;
    }
  };

  // 設定の最適化機能
  const optimizeSettings = () => {
    // 設定フォームを自動検出
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // フォームに変更検知機能を追加
      const inputs = form.querySelectorAll('input, select, textarea');
      let formChanged = false;
      
      // 各入力フィールドに変更検知リスナーを追加
      inputs.forEach(input => {
        input.addEventListener('change', () => {
          formChanged = true;
          
          // 保存ボタンを強調表示
          // ボタン要素の検出用のヘルパー関数
          const findButtonsByText = (textPatterns: string[]): HTMLElement[] => {
            const allButtons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
            return allButtons.filter(button => {
              const buttonText = (button as HTMLElement).innerText || (button as HTMLInputElement).value || '';
              return textPatterns.some(pattern => buttonText.includes(pattern));
            }) as HTMLElement[];
          };
          
          const saveButtons = findButtonsByText(['保存', '適用', '更新', '変更', 'Save', 'Apply']);
          if (saveButtons.length > 0) {
            saveButtons.forEach((button: HTMLElement) => {
              // CSSプロパティをキャメルケースで指定
              DOMManipulator.applyStyles(button, {
                backgroundColor: '#28a745',
                color: '#ffffff',
                fontWeight: 'bold',
                transform: 'scale(1.05)',
                transition: 'all 0.3s ease'
              });
            });
          }
        });
      });
      
      // ページ離脱時の警告（変更が保存されていない場合）
      const beforeUnloadHandler = (e: BeforeUnloadEvent) => handleBeforeUnload(e, formChanged);
      window.addEventListener('beforeunload', beforeUnloadHandler);
      
      // 保存ボタンクリック時のハンドラ
      // ボタン要素の検出用のヘルパー関数（再利用）
      const findButtonsByText = (textPatterns: string[]): HTMLElement[] => {
        const allButtons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
        return allButtons.filter(button => {
          const buttonText = (button as HTMLElement).innerText || (button as HTMLInputElement).value || '';
          return textPatterns.some(pattern => buttonText.includes(pattern));
        }) as HTMLElement[];
      };
      
      const saveButtons = findButtonsByText(['保存', '適用', '更新', '変更', 'Save', 'Apply']);
      saveButtons.forEach((button: HTMLElement) => {
        button.addEventListener('click', () => {
          // 保存成功後に変更フラグをリセット（既存コードを尊重）
          setTimeout(() => {
            formChanged = false;
          }, 500);
        });
      });
    });
  };

  useEffect(() => {
    // 設定ページのセットアップ
    const setupSettings = async () => {
      // 要素を待機するためのヘルパー関数
      const waitForElement = async (selector: string, timeout: number = 2000): Promise<Element | null> => {
        return new Promise(resolve => {
          // 要素がすでに存在するか確認
          const element = document.querySelector(selector);
          if (element) {
            resolve(element);
            return;
          }
          
          // 要素が見つからない場合は、MutationObserverを設定
          const observer = new MutationObserver(mutations => {
            const element = document.querySelector(selector);
            if (element) {
              observer.disconnect();
              resolve(element);
            }
          });
          
          // 監視設定
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          // タイムアウト設定
          setTimeout(() => {
            observer.disconnect();
            resolve(document.querySelector(selector));
          }, timeout);
        });
      };
      
      // 設定フォームが読み込まれるのを待つ
      const settingsContainer = await waitForElement('.settings-container, form, .chart-container', 2000);
      
      if (settingsContainer) {
        // 設定フォームの最適化
        optimizeSettings();
        
        // 開発モードでのみ診断機能を追加
        if (process.env.NODE_ENV === 'development') {
          // 診断ボタンを動的に追加
          const settingsHeader = document.querySelector('h1, h2, .settings-header, .page-title');
          if (settingsHeader) {
            const diagButton = document.createElement('button');
            diagButton.textContent = '設定診断';
            diagButton.style.marginLeft = '10px';
            diagButton.style.fontSize = '0.8rem';
            diagButton.style.padding = '4px 8px';
            
            diagButton.addEventListener('click', async () => {
              const report = await runSettingsDiagnostics();
              console.log('設定ページ診断レポート:', report);
            });
            
            // 親要素に追加する前に型チェック
            if (settingsHeader instanceof HTMLElement) {
              settingsHeader.appendChild(diagButton);
            }
          }
        }
      }
    };
    
    setupSettings();
    
    // イベントリスナーの参照を保持するための配列
    const eventListeners: {element: EventTarget, event: string, handler: EventListener}[] = [];
    
    // クリーンアップ
    return () => {
      // 登録されたイベントリスナーをクリーンアップ
      eventListeners.forEach(item => {
        item.element.removeEventListener(item.event, item.handler);
      });
      
      // その他のイベントリスナーもクリーンアップ
      window.removeEventListener('beforeunload', () => {});
    };
  }, []);

  return (
    <div className="page-container settings-container">
      <h1 className="page-title">設定</h1>
      
      <form className="chart-container">
        <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>アプリケーション設定</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>テーマ</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              className={theme === 'light' ? 'active' : 'secondary'} 
              onClick={() => setTheme('light')}
            >
              ライトモード
            </button>
            <button 
              type="button"
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

        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <button type="button" className="secondary" style={{ marginRight: '10px' }}>キャンセル</button>
          <button type="button" className="primary save-button">保存</button>
        </div>
      </form>
      
      <form className="chart-container">
        <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>アカウント設定</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>パスワード変更</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
            <input type="password" placeholder="現在のパスワード" />
            <input type="password" placeholder="新しいパスワード" />
            <input type="password" placeholder="新しいパスワード (確認)" />
          </div>
          <button type="button" className="primary" style={{ marginTop: '10px' }}>変更</button>
        </div>
      </form>
      
      <form className="chart-container">
        <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>法定雇用率設定</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>現在の法定雇用率</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="text" 
              defaultValue="2.3" 
              style={{ width: '100px' }}
            />
            <span>%</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
            ※ 法定雇用率は変更される場合があります。最新の法定雇用率を設定してください。
          </div>
          <button type="button" className="primary" style={{ marginTop: '10px' }}>更新</button>
        </div>
      </form>
    </div>
  );
};

export default Settings;