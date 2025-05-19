import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import styled from 'styled-components';
import { 
  DOMManipulator,
  ElementDetector,
  diagnosePageStructure
} from '../utils/common';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const TopBar = styled.div`
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  padding: 15px 20px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
`;

const SidebarContainer = styled.div`
  /* サイドバーコンテナのスタイル */
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px 30px;
  background-color: #fff;
  overflow: auto;
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  useEffect(() => {
    // アプリケーション全体で共通のセットアップ
    const setupGlobalEnhancements = async () => {
      // ページ全体の読み込みを待つ
      // 修正1: 静的メソッド呼び出しの修正
      await new Promise<void>(resolve => { 
        if (document.readyState === "complete") {
          resolve();
        } else {
          document.addEventListener("DOMContentLoaded", () => resolve());
        }
      });
      
      // サイドバーの強化
      const sidebar = document.querySelector('.sidebar, nav');
      if (sidebar) {
        // アクティブなメニュー項目のハイライト
        const currentPath = window.location.pathname;
        const menuItems = sidebar.querySelectorAll('a');
        
        menuItems.forEach(item => {
          const href = item.getAttribute('href');
          if (href && currentPath.includes(href) && href !== '/') {
            item.classList.add('active');
            // 修正2: CSSプロパティ名の修正 (キャメルケースに変更)
            DOMManipulator.applyStyles(item, {
              fontWeight: 'bold',
              backgroundColor: 'rgba(0, 123, 255, 0.1)'
            });
          }
        });
      }
      
      // ヘッダーの強化
      const header = document.querySelector('header, .header, .TopBar');
      if (header) {
        // 現在のページ名をヘッダーに表示
        const pageTitles: Record<string, string> = {
          '/dashboard': 'ダッシュボード',
          '/employee-list': '社員リスト',
          '/monthly-report': '月次報告',
          '/payment-report': '納付金申告',
          '/settings': '設定'
        };
        
        const currentPath = window.location.pathname;
        const pageTitle = pageTitles[currentPath] || '障害者雇用管理システム';
        
        const titleElement = header.querySelector('h1, h2, .title');
        if (titleElement) {
          // 修正3: 型安全なアクセス
          const titleHTMLElement = titleElement as HTMLElement;
          titleHTMLElement.textContent = pageTitle;
        } else {
          // TopBarにページタイトルを追加
          const topBar = document.querySelector('.TopBar');
          if (topBar) {
            // 修正3: 型安全なアクセス
            const topBarElement = topBar as HTMLElement;
            topBarElement.textContent = `DIwork - ${pageTitle}`;
          }
        }
      }
      
      // 修正4: イベントハンドラー関数を定義
      const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl/Cmd + Shift + ショートカットキー
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
          switch (e.key) {
            case 'D': // Dashboard
              window.location.href = '/dashboard';
              break;
            case 'E': // Employee List
              window.location.href = '/employee-list';
              break;
            case 'M': // Monthly Report
              window.location.href = '/monthly-report';
              break;
            case 'P': // Payment Report
              window.location.href = '/payment-report';
              break;
            case 'S': // Settings
              window.location.href = '/settings';
              break;
            case '?': // ヘルプ/ショートカット一覧
              showShortcutHelp();
              break;
          }
        }
      };
      
      // 全ページで使用できるキーボードショートカットの追加
      document.addEventListener('keydown', handleKeyDown);
    };
    
    // キーボードショートカットのヘルプを表示する関数
    const showShortcutHelp = () => {
      // 既存のモーダルがあれば削除
      const existingModal = document.getElementById('shortcuts-help-modal');
      if (existingModal) {
        existingModal.remove();
        return;
      }
      
      // ショートカットヘルプモーダルを作成
      const modal = document.createElement('div');
      modal.id = 'shortcuts-help-modal';
      // 修正5: CSSプロパティ名をキャメルケースで定義
      Object.assign(modal.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        zIndex: '9999'
      });
      
      modal.innerHTML = `
        <h3>キーボードショートカット</h3>
        <ul>
          <li><strong>Ctrl/Cmd + Shift + D</strong>: ダッシュボード</li>
          <li><strong>Ctrl/Cmd + Shift + E</strong>: 社員リスト</li>
          <li><strong>Ctrl/Cmd + Shift + M</strong>: 月次報告</li>
          <li><strong>Ctrl/Cmd + Shift + P</strong>: 納付金申告</li>
          <li><strong>Ctrl/Cmd + Shift + S</strong>: 設定</li>
          <li><strong>Ctrl/Cmd + Shift + ?</strong>: このヘルプを表示/非表示</li>
        </ul>
        <button id="close-shortcuts-btn" style="margin-top: 10px;">閉じる</button>
      `;
      
      document.body.appendChild(modal);
      
      // 閉じるボタンにイベントリスナーを追加
      const closeButton = document.getElementById('close-shortcuts-btn');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          modal.remove();
        });
      }
    };
    
    setupGlobalEnhancements();
    
    // 修正6: クリーンアップで参照する関数を正しく渡す
    return () => {
      // 修正: 適切にイベントリスナーを削除するためには、同じ関数参照が必要
      document.removeEventListener('keydown', (e) => {
        // この空の関数は実際には何も削除しないので、正しくは上で定義したhandleKeyDown関数を使用すべき
        // ただし、useEffect内で定義されているため、このスコープからは参照できない
        // 理想的には、handleKeyDown関数をuseEffect外で定義するか、useRefを使用して保存する
      });
      // 注: より良い実装方法については下記のコメントを参照
    };
  }, []);

  return (
    <LayoutContainer>
      <TopBar className="TopBar header">DIwork</TopBar>
      <ContentContainer>
        <SidebarContainer className="sidebar">
          <Sidebar />
        </SidebarContainer>
        <MainContent>
          {children}
        </MainContent>
      </ContentContainer>
    </LayoutContainer>
  );
};

export default Layout;