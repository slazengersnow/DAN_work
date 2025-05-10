/**
 * 視覚的フィードバック強化
 * 
 * CSVインポート成功時やエラー時に控えめながらも明確な
 * 視覚的フィードバックを提供します。
 */

(function() {
  // ================ 設定 ================
  const config = {
    debug: true,               // デバッグログの有効化
    importSuccessPatterns: [   // インポート成功を示すパターン
      'インポート成功',
      'インポート完了',
      'データをインポートしました',
      'CSVデータをインポート'
    ],
    importErrorPatterns: [     // インポートエラーを示すパターン
      'インポートエラー',
      'インポートに失敗',
      'エラーが発生しました',
      'Could not', 
      'Cannot find',
      'Error:'
    ],
    notificationDuration: 5000, // 通知表示時間（ms）
    toastPosition: 'top-right', // 通知の位置
    sounds: {
      success: true,           // 成功音の有効化
      error: true              // エラー音の有効化
    },
    animation: {
      duration: 300,           // アニメーション時間（ms）
      successColor: '#4CAF50', // 成功色
      errorColor: '#F44336'    // エラー色
    }
  };

  // ================ 内部状態 ================
  const state = {
    notificationCount: 0,
    lastNotificationTime: 0,
    activeNotifications: [],
    importStats: {
      success: 0,
      error: 0,
      lastImport: null
    }
  };

  // ================ ユーティリティ ================
  
  /**
   * 安全なログ出力
   */
  function safeLog(message, level = 'log') {
    if (!config.debug && level === 'debug') return;
    
    const prefix = '[視覚フィードバック]';
    const boundConsole = {
      log: window.console.log.bind(window.console),
      error: window.console.error.bind(window.console),
      warn: window.console.warn.bind(window.console),
      info: window.console.info.bind(window.console),
      debug: window.console.debug.bind(window.console)
    };
    
    boundConsole[level](`${prefix} ${message}`);
  }
  
  /**
   * HTMLエスケープ
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 通知ID生成
   */
  function generateId() {
    return `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  // ================ 主要機能 ================
  
  /**
   * トースト通知表示
   */
  function showToast(message, type = 'info', options = {}) {
    // 通知コンテナの取得または作成
    let container = document.getElementById('visual-feedback-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'visual-feedback-container';
      
      // 位置の設定
      Object.assign(container.style, {
        position: 'fixed',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '100%',
        pointerEvents: 'none' // クリックイベントを透過
      });
      
      // 位置の調整
      switch (config.toastPosition) {
        case 'top-left':
          Object.assign(container.style, {
            top: '20px',
            left: '20px'
          });
          break;
        case 'top-right':
          Object.assign(container.style, {
            top: '20px',
            right: '20px'
          });
          break;
        case 'bottom-left':
          Object.assign(container.style, {
            bottom: '20px',
            left: '20px'
          });
          break;
        case 'bottom-right':
          Object.assign(container.style, {
            bottom: '20px',
            right: '20px'
          });
          break;
        case 'top-center':
          Object.assign(container.style, {
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)'
          });
          break;
        case 'bottom-center':
          Object.assign(container.style, {
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)'
          });
          break;
      }
      
      document.body.appendChild(container);
    }
    
    // 前回の通知から短時間の場合はカウントアップのみ
    const now = Date.now();
    if (now - state.lastNotificationTime < 200 && 
        state.activeNotifications.length > 0 &&
        type === state.activeNotifications[state.activeNotifications.length - 1].type) {
      
      const lastNotification = document.getElementById(state.activeNotifications[state.activeNotifications.length - 1].id);
      if (lastNotification) {
        const counter = lastNotification.querySelector('.toast-counter');
        if (counter) {
          counter.textContent = parseInt(counter.textContent || '1', 10) + 1;
          counter.style.display = 'inline-block';
        }
        return;
      }
    }
    
    state.lastNotificationTime = now;
    state.notificationCount++;
    
    // 通知ID
    const id = generateId();
    
    // アイコン設定
    let icon = '';
    switch(type) {
      case 'success':
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>`;
        break;
      case 'error':
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>`;
        break;
      case 'warning':
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>`;
        break;
      case 'info':
      default:
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>`;
    }
    
    // 背景色の設定
    let backgroundColor, textColor, progressColor;
    switch(type) {
      case 'success':
        backgroundColor = '#e8f5e9';
        textColor = '#1b5e20';
        progressColor = '#4CAF50';
        break;
      case 'error':
        backgroundColor = '#ffebee';
        textColor = '#b71c1c';
        progressColor = '#F44336';
        break;
      case 'warning':
        backgroundColor = '#fff8e1';
        textColor = '#ff6f00';
        progressColor = '#FFC107';
        break;
      case 'info':
      default:
        backgroundColor = '#e3f2fd';
        textColor = '#0d47a1';
        progressColor = '#2196F3';
    }
    
    // 通知要素を作成
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `visual-feedback-toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    
    // ベーススタイルを設定
    Object.assign(toast.style, {
      backgroundColor,
      color: textColor,
      padding: '12px 16px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      maxWidth: '320px',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      opacity: '0',
      transform: 'translateY(10px)',
      transition: `all ${config.animation.duration}ms ease-out`,
      pointerEvents: 'auto' // 通知自体はクリック可能に
    });
    
    // オプションのスタイルを適用
    if (options.styles) {
      Object.assign(toast.style, options.styles);
    }
    
    // 通知内容の構築
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-message">${escapeHtml(message)}</div>
        <span class="toast-counter" style="display:none;background:${textColor};color:${backgroundColor};border-radius:10px;padding:0 6px;font-size:11px;margin-left:4px;">1</span>
      </div>
      <button class="toast-close" style="background:none;border:none;cursor:pointer;padding:0;margin-left:auto;opacity:0.5;transition:opacity 0.2s;" aria-label="閉じる">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="toast-progress" style="position:absolute;bottom:0;left:0;height:3px;width:100%;background:${progressColor};transform:scaleX(0);transform-origin:left;transition:transform linear;"></div>
    `;
    
    // コンテナに追加
    container.appendChild(toast);
    
    // アニメーション開始
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      
      // プログレスバーのアニメーション
      const progress = toast.querySelector('.toast-progress');
      if (progress) {
        progress.style.transition = `transform ${config.notificationDuration}ms linear`;
        progress.style.transform = 'scaleX(1)';
      }
    }, 10);
    
    // 閉じるボタンのイベント
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeToast(id);
      });
    }
    
    // 非表示タイマー
    const timeoutId = setTimeout(() => {
      closeToast(id);
    }, config.notificationDuration);
    
    // 状態に追加
    state.activeNotifications.push({
      id,
      type,
      timeoutId
    });
    
    // インポート統計の更新
    if (type === 'success') {
      state.importStats.success++;
      state.importStats.lastImport = {
        type: 'success',
        time: new Date().toISOString(),
        message
      };
    } else if (type === 'error') {
      state.importStats.error++;
      state.importStats.lastImport = {
        type: 'error',
        time: new Date().toISOString(),
        message
      };
    }
    
    // 通知IDを返す
    return id;
  }
  
  /**
   * トースト通知を閉じる
   */
  function closeToast(id) {
    const toast = document.getElementById(id);
    if (!toast) return;
    
    // アニメーション
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    
    // DOM削除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      
      // 状態から削除
      const index = state.activeNotifications.findIndex(n => n.id === id);
      if (index !== -1) {
        // タイムアウトもクリア
        clearTimeout(state.activeNotifications[index].timeoutId);
        state.activeNotifications.splice(index, 1);
      }
    }, config.animation.duration);
  }
  
  /**
   * 効果音再生
   */
  function playSound(type) {
    // 効果音が無効なら何もしない
    if (!config.sounds[type]) return;
    
    try {
      let frequency, duration, gainValue, attackTime, releaseTime;
      
      // タイプ別の音設定
      switch (type) {
        case 'success':
          frequency = 1046.5; // C6
          duration = 150;
          gainValue = 0.1;
          attackTime = 0.01;
          releaseTime = 0.1;
          break;
        case 'error':
          frequency = 277.18; // C#4
          duration = 200;
          gainValue = 0.1;
          attackTime = 0.01;
          releaseTime = 0.2;
          break;
        default:
          return;
      }
      
      // AudioContextの作成
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const context = new AudioContext();
      
      // オシレーターの設定
      const oscillator = context.createOscillator();
      oscillator.type = type === 'success' ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      
      // ゲインノードの設定
      const gainNode = context.createGain();
      gainNode.gain.value = 0;
      
      // エンベロープの設定
      const now = context.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gainValue, now + attackTime);
      gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000 - releaseTime);
      
      // 接続と開始
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start(now);
      oscillator.stop(now + duration / 1000);
      
      // リソース解放
      setTimeout(() => {
        context.close();
      }, duration + 100);
    } catch (error) {
      safeLog(`効果音再生中にエラー: ${error.message}`, 'warn');
    }
  }
  
  /**
   * インポート操作の視覚的エフェクト
   */
  function showImportEffect(success = true) {
    // データテーブルの周囲にエフェクト
    const tableContainers = document.querySelectorAll(
      '.monthly-data, [class*="data-container"], [class*="table-container"]'
    );
    
    if (tableContainers.length === 0) return;
    
    const color = success ? config.animation.successColor : config.animation.errorColor;
    
    tableContainers.forEach(container => {
      // 一時的なオーバーレイを作成
      const overlay = document.createElement('div');
      Object.assign(overlay.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        pointerEvents: 'none',
        backgroundColor: 'transparent',
        border: `2px solid ${color}`,
        borderRadius: '4px',
        opacity: '0',
        transition: `opacity ${config.animation.duration}ms ease-out`,
        zIndex: '999'
      });
      
      // コンテナに相対位置を設定
      if (window.getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      
      // オーバーレイを追加
      container.appendChild(overlay);
      
      // アニメーション
      setTimeout(() => {
        overlay.style.opacity = '0.6';
        
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, config.animation.duration);
        }, config.animation.duration);
      }, 10);
    });
  }
  
  /**
   * インポート完了時の要約通知
   */
  function showImportSummary(data) {
    if (!data || typeof data !== 'object') {
      data = {};
    }
    
    const employeeCount = data.employeeCount || '複数';
    const monthCount = data.monthCount || '複数';
    
    // 成功メッセージ
    const message = `${monthCount}ヶ月分のデータを${employeeCount}名分インポートしました`;
    
    // 通知表示
    showToast(message, 'success');
    playSound('success');
    showImportEffect(true);
  }
  
  /**
   * インポートエラー時の通知
   */
  function showImportError(error) {
    const message = typeof error === 'string' ? error : 'インポート中にエラーが発生しました';
    
    // 通知表示
    showToast(message, 'error');
    playSound('error');
    showImportEffect(false);
  }
  
  /**
   * カスタムスタイルの追加
   */
  function addCustomStyles() {
    const styleId = 'visual-feedback-styles';
    
    // 既存のスタイルがあれば何もしない
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* トースト通知 */
      .visual-feedback-toast {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .visual-feedback-toast:hover .toast-close {
        opacity: 0.8 !important;
      }
      
      .toast-close:hover {
        opacity: 1 !important;
      }
      
      /* インポート進捗インジケーター */
      .import-progress-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background-color: rgba(33, 150, 243, 0.1);
        border-radius: 4px;
        margin: 8px 0;
        font-size: 13px;
      }
      
      .import-progress-indicator__success {
        background-color: rgba(76, 175, 80, 0.1);
      }
      
      .import-progress-indicator__error {
        background-color: rgba(244, 67, 54, 0.1);
      }
      
      /* 脈動アニメーション */
      @keyframes pulse-animation {
        0% { 
          box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
          transform: scale(1);
        }
        70% { 
          box-shadow: 0 0 0 6px rgba(33, 150, 243, 0);
          transform: scale(1.02);
        }
        100% { 
          box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
          transform: scale(1);
        }
      }
      
      .pulse-effect {
        animation: pulse-animation 1.5s ease-in-out;
      }
      
      .pulse-effect--success {
        animation-name: pulse-animation-success;
      }
      
      @keyframes pulse-animation-success {
        0% { 
          box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
          transform: scale(1);
        }
        70% { 
          box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
          transform: scale(1.02);
        }
        100% { 
          box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          transform: scale(1);
        }
      }
      
      .pulse-effect--error {
        animation-name: pulse-animation-error;
      }
      
      @keyframes pulse-animation-error {
        0% { 
          box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
          transform: scale(1);
        }
        70% { 
          box-shadow: 0 0 0 6px rgba(244, 67, 54, 0);
          transform: scale(1.02);
        }
        100% { 
          box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
          transform: scale(1);
        }
      }
    `;
    
    document.head.appendChild(style);
    safeLog('カスタムスタイルを追加');
  }
  
  /**
   * コンソールログインターセプター
   */
  function setupConsoleInterceptor() {
    const originalConsoleLog = console.log;
    
    console.log = function(...args) {
      // 元のログを出力
      originalConsoleLog.apply(console, args);
      
      try {
        // 自身のログはスキップ
        if (args.length > 0 && 
            typeof args[0] === 'string' && 
            args[0].includes('[視覚フィードバック]')) {
          return;
        }
        
        // インポート成功・エラー検出
        const message = args.join(' ');
        
        // 成功メッセージ検出
        const isSuccess = config.importSuccessPatterns.some(pattern => 
          message.includes(pattern)
        );
        
        if (isSuccess) {
          safeLog('インポート成功を検出: ' + message);
          
          // インポートデータの解析
          let data = {
            employeeCount: '複数',
            monthCount: '複数'
          };
          
          // 従業員数を検出
          const employeeMatch = message.match(/(\d+)名/);
          if (employeeMatch) {
            data.employeeCount = employeeMatch[1];
          }
          
          // 月数を検出
          const monthMatch = message.match(/(\d+)ヶ月/);
          if (monthMatch) {
            data.monthCount = monthMatch[1];
          }
          
          // 成功通知を表示
          showImportSummary(data);
          return;
        }
        
        // エラーメッセージ検出
        const isError = config.importErrorPatterns.some(pattern => 
          message.includes(pattern)
        );
        
        if (isError) {
          safeLog('インポートエラーを検出: ' + message);
          
          // エラー通知を表示
          showImportError(message);
        }
      } catch (error) {
        // エラーを無視
      }
    };
    
    // console.errorも監視
    const originalConsoleError = console.error;
    
    console.error = function(...args) {
      // 元のエラーログを出力
      originalConsoleError.apply(console, args);
      
      try {
        // 自身のログはスキップ
        if (args.length > 0 && 
            typeof args[0] === 'string' && 
            args[0].includes('[視覚フィードバック]')) {
          return;
        }
        
        // エラーメッセージ検出
        const message = args.join(' ');
        
        const isImportError = config.importErrorPatterns.some(pattern => 
          message.includes(pattern)
        );
        
        if (isImportError) {
          safeLog('インポートエラーを検出: ' + message);
          
          // エラー通知を表示（重複防止のため少し遅延）
          setTimeout(() => {
            showImportError(message);
          }, 100);
        }
      } catch (error) {
        // エラーを無視
      }
    };
    
    safeLog('コンソールログインターセプターを設定');
  }
  
  /**
   * カスタムイベント監視
   */
  function setupCustomEventListeners() {
    // CSVデータインポート完了イベント
    document.addEventListener('csv-data-imported', (event) => {
      safeLog('CSVデータインポート完了イベントを検出');
      
      const detail = event.detail || {};
      showImportSummary(detail);
    });
    
    // インポートエラーイベント
    document.addEventListener('csv-import-error', (event) => {
      safeLog('CSVインポートエラーイベントを検出');
      
      const detail = event.detail || {};
      const message = detail.message || 'インポート中にエラーが発生しました';
      
      showImportError(message);
    });
    
    safeLog('カスタムイベントリスナーを設定');
  }
  
  /**
   * インポートボタン強化
   */
  function enhanceImportButtons() {
    // ボタンのセレクタ
    const buttonSelectors = [
      'button:contains("インポート")',
      'button:contains("読み込み")',
      'button:contains("CSV")',
      'button[class*="import"]',
      'button[id*="import"]',
      'input[type="file"][accept*="csv"]'
    ];
    
    // jQuery風のcontainsセレクタ
    const getElementsContainingText = (selector, text) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).filter(el => el.textContent.includes(text));
    };
    
    // ボタンを検索
    let importButtons = [];
    
    // 各セレクタでボタンを探す
    getElementsContainingText('button', 'インポート').forEach(el => importButtons.push(el));
    getElementsContainingText('button', '読み込み').forEach(el => importButtons.push(el));
    getElementsContainingText('button', 'CSV').forEach(el => importButtons.push(el));
    
    // classやidでボタンを探す
    document.querySelectorAll('button[class*="import"], button[id*="import"]').forEach(el => importButtons.push(el));
    
    // ファイル入力フィールドも対象に
    document.querySelectorAll('input[type="file"][accept*="csv"]').forEach(el => importButtons.push(el));
    
    // 重複を削除
    importButtons = [...new Set(importButtons)];
    
    if (importButtons.length === 0) {
      safeLog('インポートボタンが見つかりません');
      return;
    }
    
    safeLog(`${importButtons.length}個のインポートボタンを検出`);
    
    // 各ボタンにエフェクトを追加
    importButtons.forEach(button => {
      // click イベントのリスナーを追加
      button.addEventListener('click', () => {
        safeLog('インポートボタンのクリックを検出');
        
        // 控えめなパルスエフェクトを追加
        button.classList.add('pulse-effect');
        
        // イベント発火
        const importStartEvent = new CustomEvent('csv-import-start', { 
          detail: { 
            timestamp: Date.now() 
          } 
        });
        document.dispatchEvent(importStartEvent);
        
        // クラスを削除
        setTimeout(() => {
          button.classList.remove('pulse-effect');
        }, 1500);
      });
    });
    
    safeLog('インポートボタンの強化完了');
  }
  
  /**
   * 進捗インジケーター表示
   */
  function showProgressIndicator(isActive = true, type = 'progress') {
    // 既存のインジケーターを探す
    let indicator = document.getElementById('import-progress-indicator');
    
    // インジケーターが不要なら削除して終了
    if (!isActive && indicator) {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
      return;
    }
    
    // すでに存在し、同じタイプならそのまま
    if (indicator && indicator.dataset.type === type) {
      return;
    }
    
    // インポートボタンまたはCSVセクションの近くに配置
    let targetLocation = null;
    
    // ボタンを探す
    const importButtons = document.querySelectorAll('button:contains("インポート"), button:contains("CSV")');
    if (importButtons.length > 0) {
      const button = importButtons[0];
      targetLocation = button.parentNode;
    }
    
    // ターゲットが見つからない場合はデータコンテナを探す
    if (!targetLocation) {
      const dataContainers = document.querySelectorAll(
        '.monthly-data, [class*="data-container"], [class*="table-container"]'
      );
      
      if (dataContainers.length > 0) {
        targetLocation = dataContainers[0].parentNode;
      }
    }
    
    // それでも見つからない場合はボディに直接追加
    if (!targetLocation) {
      targetLocation = document.body;
    }
    
    // 既存のインジケーターがあれば削除
    if (indicator) {
      indicator.parentNode.removeChild(indicator);
    }
    
    // 新しいインジケーターを作成
    indicator = document.createElement('div');
    indicator.id = 'import-progress-indicator';
    indicator.className = 'import-progress-indicator';
    indicator.dataset.type = type;
    
    // タイプ別のクラスを追加
    if (type === 'success') {
      indicator.classList.add('import-progress-indicator__success');
    } else if (type === 'error') {
      indicator.classList.add('import-progress-indicator__error');
    }
    
    // アイコンとメッセージ
    let icon, message;
    
    switch (type) {
      case 'success':
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>`;
        message = 'インポートが完了しました';
        break;
      case 'error':
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F44336" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>`;
        message = 'インポート中にエラーが発生しました';
        break;
      case 'progress':
      default:
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2196F3" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>`;
        message = 'CSVデータをインポート中...';
    }
    
    // コンテンツの設定
    indicator.innerHTML = `
      <div class="indicator-icon">${icon}</div>
      <div class="indicator-message">${message}</div>
    `;
    
    // スタイル
    indicator.style.opacity = '0';
    indicator.style.transition = 'opacity 0.3s ease';
    
    // 要素を追加
    targetLocation.appendChild(indicator);
    
    // アニメーション
    setTimeout(() => {
      indicator.style.opacity = '1';
    }, 10);
    
    // 進行中以外は一定時間後に自動的に削除
    if (type !== 'progress') {
      setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        }, 300);
      }, 5000);
    }
    
    return indicator;
  }
  
  /**
   * 初期化処理
   */
  function init() {
    try {
      safeLog('視覚的フィードバック強化を初期化');
      
      // カスタムスタイルの追加
      addCustomStyles();
      
      // コンソールログインターセプターを設定
      setupConsoleInterceptor();
      
      // カスタムイベントリスナーを設定
      setupCustomEventListeners();
      
      // インポートボタンを強化
      setTimeout(() => {
        enhanceImportButtons();
      }, 1000);
      
      safeLog('初期化完了');
      
      // テスト通知
      if (config.debug) {
        setTimeout(() => {
          showToast('視覚的フィードバック機能が有効になりました', 'info');
        }, 1500);
      }
    } catch (error) {
      safeLog(`初期化中にエラー: ${error.message}`, 'error');
    }
  }
  
  // グローバルアクセス用オブジェクト
  window.VisualFeedback = {
    showToast,
    closeToast,
    playSound,
    showImportSummary,
    showImportError,
    showProgressIndicator,
    getState: () => ({...state})
  };
  
  // DOMの準備ができたら初期化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();