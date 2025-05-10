/**
 * notification-helper.js
 * 
 * 軽量なユーザー通知機能を提供するモジュール
 * - 控えめでわかりやすい通知UI
 * - 自動的に消える機能付き
 * - 複数の通知タイプ（成功、警告、エラー）をサポート
 */

(function() {
  // デバッグモード設定
  const DEBUG_MODE = localStorage.getItem('debug_mode') === 'true';
  
  /**
   * デバッグログを出力（デバッグモードがオンの場合のみ）
   * @param {string} message - ログメッセージ
   * @param {string} level - ログレベル（'log', 'info', 'warn', 'error'）
   */
  function debugLog(message, level = 'log') {
    if (!DEBUG_MODE) return;
    
    try {
      const prefix = '[通知ヘルパー]';
      const consoleMethods = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
      };
      
      if (consoleMethods[level]) {
        consoleMethods[level](`${prefix} ${message}`);
      } else {
        consoleMethods.log(`${prefix} ${message}`);
      }
    } catch (e) {
      // ログエラーは無視
    }
  }
  
  /**
   * 通知コンテナを取得または作成
   * @returns {HTMLElement} 通知コンテナ要素
   */
  function getNotificationContainer() {
    let container = document.getElementById('minimal-fix-notifications');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'minimal-fix-notifications';
      
      // コンテナスタイル設定
      Object.assign(container.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '350px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      });
      
      document.body.appendChild(container);
      debugLog('通知コンテナを作成しました');
    }
    
    return container;
  }
  
  /**
   * 通知を表示
   * @param {string} message - 表示するメッセージ
   * @param {Object} options - 通知オプション
   * @param {string} options.type - 通知タイプ ('success', 'warning', 'error', 'info')
   * @param {number} options.duration - 表示時間（ミリ秒）
   * @param {string} options.title - 通知タイトル（オプション）
   * @returns {HTMLElement} 作成された通知要素
   */
  function showNotification(message, options = {}) {
    const defaultOptions = {
      type: 'info',
      duration: 3000,
      title: null
    };
    
    const settings = {...defaultOptions, ...options};
    debugLog(`通知表示: ${message} (type: ${settings.type}, duration: ${settings.duration}ms)`);
    
    // 通知コンテナを取得
    const container = getNotificationContainer();
    
    // 通知要素の作成
    const notification = document.createElement('div');
    notification.className = `notification notification-${settings.type}`;
    
    // スタイル設定
    Object.assign(notification.style, {
      backgroundColor: getBackgroundColor(settings.type),
      color: getTextColor(settings.type),
      padding: '12px 16px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '8px',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      lineHeight: '1.5',
      border: `1px solid ${getBorderColor(settings.type)}`
    });
    
    // アイコンを取得
    const icon = getIcon(settings.type);
    
    // 内容の構築
    let contentHtml = '';
    
    if (settings.title) {
      contentHtml += `<div style="font-weight: bold; margin-bottom: 4px;">${settings.title}</div>`;
    }
    
    contentHtml += `
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <div class="notification-icon" style="flex-shrink: 0; margin-top: 2px;">${icon}</div>
        <div class="notification-message">${escapeHtml(message)}</div>
        <button class="notification-close" style="background: none; border: none; cursor: pointer; padding: 0; margin-left: auto; opacity: 0.5; flex-shrink: 0; transform: translateY(-2px);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    
    // プログレスバー（自動的に消える視覚的インジケーター）
    contentHtml += `
      <div class="notification-progress" style="position: absolute; bottom: 0; left: 0; height: 3px; width: 100%; background: ${getProgressColor(settings.type)}; transform: scaleX(0); transform-origin: left; transition: transform linear;"></div>
    `;
    
    notification.innerHTML = contentHtml;
    
    // コンテナに追加
    container.appendChild(notification);
    
    // アニメーション開始
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
      
      // プログレスバーのアニメーション
      const progress = notification.querySelector('.notification-progress');
      if (progress) {
        progress.style.transition = `transform ${settings.duration}ms linear`;
        progress.style.transform = 'scaleX(1)';
      }
    }, 10);
    
    // 閉じるボタンのイベント設定
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        closeNotification(notification);
      });
    }
    
    // 自動的に消える設定
    if (settings.duration > 0) {
      setTimeout(() => {
        closeNotification(notification);
      }, settings.duration);
    }
    
    return notification;
  }
  
  /**
   * 通知を閉じる
   * @param {HTMLElement} notification - 閉じる通知要素
   */
  function closeNotification(notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
        debugLog('通知を閉じました');
      }
    }, 300);
  }
  
  /**
   * HTML特殊文字をエスケープ
   * @param {string} text - エスケープするテキスト
   * @returns {string} エスケープされたテキスト
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 通知タイプに応じた背景色を取得
   * @param {string} type - 通知タイプ
   * @returns {string} CSS色文字列
   */
  function getBackgroundColor(type) {
    const colors = {
      success: '#f0fdf4',  // 薄い緑
      warning: '#fffbeb',  // 薄い黄色
      error: '#fef2f2',    // 薄い赤
      info: '#f0f9ff'      // 薄い青
    };
    
    return colors[type] || colors.info;
  }
  
  /**
   * 通知タイプに応じたテキスト色を取得
   * @param {string} type - 通知タイプ
   * @returns {string} CSS色文字列
   */
  function getTextColor(type) {
    const colors = {
      success: '#166534',  // 濃い緑
      warning: '#9a3412',  // 濃いオレンジ
      error: '#991b1b',    // 濃い赤
      info: '#0c4a6e'      // 濃い青
    };
    
    return colors[type] || colors.info;
  }
  
  /**
   * 通知タイプに応じたボーダー色を取得
   * @param {string} type - 通知タイプ
   * @returns {string} CSS色文字列
   */
  function getBorderColor(type) {
    const colors = {
      success: '#dcfce7',  // もう少し濃い緑
      warning: '#fef3c7',  // もう少し濃い黄色
      error: '#fee2e2',    // もう少し濃い赤
      info: '#e0f2fe'      // もう少し濃い青
    };
    
    return colors[type] || colors.info;
  }
  
  /**
   * 通知タイプに応じたプログレスバー色を取得
   * @param {string} type - 通知タイプ
   * @returns {string} CSS色文字列
   */
  function getProgressColor(type) {
    const colors = {
      success: '#22c55e',  // 鮮やかな緑
      warning: '#f59e0b',  // 鮮やかな黄色
      error: '#ef4444',    // 鮮やかな赤
      info: '#3b82f6'      // 鮮やかな青
    };
    
    return colors[type] || colors.info;
  }
  
  /**
   * 通知タイプに応じたアイコンを取得
   * @param {string} type - 通知タイプ
   * @returns {string} SVGアイコンのHTML
   */
  function getIcon(type) {
    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>`,
      error: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>`,
      info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="12" y1="16" x2="12" y2="12"></line>
               <line x1="12" y1="8" x2="12.01" y2="8"></line>
             </svg>`
    };
    
    return icons[type] || icons.info;
  }
  
  // グローバルAPIの公開
  window.NotificationHelper = {
    show: showNotification,
    close: closeNotification,
    
    // 便利なショートカット関数
    success: (message, options = {}) => showNotification(message, {...options, type: 'success'}),
    warning: (message, options = {}) => showNotification(message, {...options, type: 'warning'}),
    error: (message, options = {}) => showNotification(message, {...options, type: 'error'}),
    info: (message, options = {}) => showNotification(message, {...options, type: 'info'})
  };
  
  // 初期化メッセージ（デバッグモード時のみ）
  debugLog('通知ヘルパーを初期化しました');
})();