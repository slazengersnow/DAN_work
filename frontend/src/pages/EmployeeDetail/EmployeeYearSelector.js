/**
 * 従業員詳細の対象年度セレクタを表示するスクリプト
 * - 従業員詳細画面のツールバーに対象年度選択ドロップダウンを追加
 * - 他の機能に影響を与えずに動作
 * - デバッグ情報を詳細に出力
 */
(function() {
  'use strict';
  
  // デバッグログ用の関数
  function logDebug(message) {
    console.log('[EmployeeYearRestorer] ' + message);
  }

  logDebug('スクリプトを開始します');

  // 既存のMutationObserverを停止（存在する場合）
  if (window._existingEmployeeObserver && typeof window._existingEmployeeObserver.disconnect === 'function') {
    window._existingEmployeeObserver.disconnect();
    logDebug('既存のObserverを停止しました');
  }

  // 従業員詳細の対象年度セレクタを追加する関数
  function addEmployeeDetailYearSelector() {
    // 従業員詳細画面が表示されているか確認（複数の方法で検出）
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    let isEmployeeDetailActive = false;
    
    // 見出しテキストで検出
    for (const heading of headings) {
      if (heading.textContent && heading.textContent.includes('従業員詳細')) {
        isEmployeeDetailActive = true;
        break;
      }
    }
    
    // クラスで検出
    if (!isEmployeeDetailActive) {
      isEmployeeDetailActive = !!document.querySelector('.employee-detail, .employee-profile, .employee-info');
    }
    
    // タブで検出
    if (!isEmployeeDetailActive) {
      const activeTabs = document.querySelectorAll('.nav-link.active, .tab-pane.active');
      for (const tab of activeTabs) {
        if (tab.textContent && tab.textContent.includes('従業員')) {
          isEmployeeDetailActive = true;
          break;
        }
      }
    }

    if (!isEmployeeDetailActive) {
      // 従業員情報フォームの有無で検出（最後の手段）
      const formElements = document.querySelectorAll('form, .form-group');
      for (const form of formElements) {
        if (form.querySelector('input[name="name"], input[name="employee_id"]')) {
          isEmployeeDetailActive = true;
          break;
        }
      }
    }

    if (!isEmployeeDetailActive) {
      logDebug('従業員詳細画面が表示されていません');
      return false;
    }

    logDebug('従業員詳細画面を検出しました');

    // すでに年度セレクタが存在する場合は処理しない
    if (document.querySelector('.employee-year-selector-fixed')) {
      logDebug('従業員詳細の年度セレクタはすでに存在します');
      return true;
    }

    // ツールバー領域を特定（複数の方法で試行）
    let toolbar = null;

    // 方法1: ボタングループを探す
    toolbar = document.querySelector('.btn-group, .button-group, .toolbar, .actions');
    if (toolbar) {
      logDebug('ボタングループをツールバーとして検出しました');
    }
    
    // 方法2: 編集ボタンの親要素を探す
    if (!toolbar) {
      const editButtons = document.querySelectorAll('button');
      for (const button of editButtons) {
        if (button.textContent && (
            button.textContent.includes('編集') || 
            button.textContent.includes('修正') ||
            button.textContent.includes('Edit')
           )) {
          toolbar = button.parentElement;
          logDebug('編集ボタンから親ツールバーを検出しました');
          break;
        }
      }
    }
    
    // 方法3: 戻るボタンの親要素を探す
    if (!toolbar) {
      const backButtons = document.querySelectorAll('button');
      for (const button of backButtons) {
        if (button.textContent && (
            button.textContent.includes('戻る') || 
            button.textContent.includes('Back')
           )) {
          toolbar = button.parentElement;
          logDebug('戻るボタンから親ツールバーを検出しました');
          break;
        }
      }
    }
    
    // 方法4: いずれかのボタンが含まれるコンテナを探す
    if (!toolbar) {
      const anyButton = document.querySelector('button');
      if (anyButton) {
        // ボタンから上に3階層まで遡って適切なコンテナを探す
        let parent = anyButton.parentElement;
        for (let i = 0; i < 3; i++) {
          if (parent && parent.querySelectorAll('button').length > 1) {
            toolbar = parent;
            logDebug(`ボタンコンテナをツールバーとして検出しました (階層: ${i+1})`);
            break;
          }
          if (parent) parent = parent.parentElement;
        }
      }
    }

    // 方法5: 最後の手段として、従業員詳細の見出しの次の要素を試す
    if (!toolbar) {
      for (const heading of headings) {
        if (heading.textContent && heading.textContent.includes('従業員詳細')) {
          if (heading.nextElementSibling) {
            toolbar = heading.nextElementSibling;
            logDebug('見出しの次の要素をツールバーとして使用します');
            break;
          }
        }
      }
    }

    if (!toolbar) {
      // 最終手段：新しいツールバーを作成して挿入
      const employeeDetailContainer = document.querySelector('.employee-detail, .employee-profile') || 
                                      document.querySelector('h2, h3, h4').parentElement;
      
      if (employeeDetailContainer) {
        toolbar = document.createElement('div');
        toolbar.className = 'employee-toolbar-created';
        toolbar.style.cssText = 'margin-bottom: 15px; padding: 8px 0;';
        
        // 最初の子要素の前に挿入
        if (employeeDetailContainer.firstChild) {
          employeeDetailContainer.insertBefore(toolbar, employeeDetailContainer.firstChild);
          logDebug('新しいツールバーを作成しました');
        } else {
          employeeDetailContainer.appendChild(toolbar);
          logDebug('新しいツールバーをコンテナの末尾に追加しました');
        }
      } else {
        logDebug('従業員詳細のツールバーを作成できる適切なコンテナが見つかりませんでした');
        return false;
      }
    }

    // 年度セレクタを作成
    const yearSelector = document.createElement('div');
    yearSelector.className = 'employee-year-selector-fixed';
    yearSelector.style.cssText = 'display: inline-block; margin-right: 15px; vertical-align: middle;';

    // 現在の年を取得
    const currentYear = new Date().getFullYear();
    
    // セレクタの内容を作成
    yearSelector.innerHTML = `
      <label style="margin-right: 5px; font-weight: normal; display: inline-block; vertical-align: middle;">対象年度:</label>
      <select class="form-control form-control-sm" style="display: inline-block; width: auto; height: 31px; padding: 0.25rem 0.5rem; vertical-align: middle;">
        <option value="${currentYear-2}">${currentYear-2}年度</option>
        <option value="${currentYear-1}">${currentYear-1}年度</option>
        <option value="${currentYear}" selected>${currentYear}年度</option>
        <option value="${currentYear+1}">${currentYear+1}年度</option>
      </select>
    `;

    // ツールバーの先頭に挿入
    if (toolbar.firstChild) {
      toolbar.insertBefore(yearSelector, toolbar.firstChild);
    } else {
      toolbar.appendChild(yearSelector);
    }

    // イベントリスナーの追加
    const select = yearSelector.querySelector('select');
    if (select) {
      select.addEventListener('change', function(e) {
        logDebug(`年度が変更されました: ${e.target.value}`);
        
        // 年度変更イベントの発行（他のコンポーネントが購読可能）
        const yearChangeEvent = new CustomEvent('employeeYearChanged', {
          detail: { 
            year: parseInt(e.target.value, 10),
            yearText: `${e.target.value}年度`
          },
          bubbles: true
        });
        document.dispatchEvent(yearChangeEvent);
        
        // UIフィードバック（選択状態を視覚的に示す）
        const yearText = document.createElement('span');
        yearText.className = 'year-change-notification';
        yearText.textContent = `${e.target.value}年度のデータを表示します`;
        yearText.style.cssText = 'color: #3a66d4; margin-left: 10px; font-weight: bold; opacity: 0; transition: opacity 0.3s;';
        
        // 既存の通知を削除
        const existingNotification = document.querySelector('.year-change-notification');
        if (existingNotification) {
          existingNotification.remove();
        }
        
        // 新しい通知を追加
        yearSelector.appendChild(yearText);
        
        // アニメーション効果
        setTimeout(() => {
          yearText.style.opacity = '1';
          
          // 3秒後にフェードアウト
          setTimeout(() => {
            yearText.style.opacity = '0';
            
            // フェードアウト後に削除
            setTimeout(() => {
              yearText.remove();
            }, 300);
          }, 3000);
        }, 10);
      });
    }

    logDebug('従業員詳細の年度セレクタを追加しました');
    return true;
  }

  // 初回実行
  const result = addEmployeeDetailYearSelector();
  logDebug(`初回実行結果: ${result ? '成功' : '要素が見つかりませんでした'}`);

  // MutationObserverの設定
  // デバウンス処理用の変数
  let debounceTimer = null;
  
  const observer = new MutationObserver(function(mutations) {
    // 処理を間引く（デバウンス）
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      // 重要な変更のみに反応するフィルタリング
      let shouldUpdate = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // タブペインや従業員関連要素の追加のみに反応
              if (
                node.classList?.contains('tab-pane') || 
                node.querySelector?.('.tab-pane') ||
                node.classList?.contains('employee-detail') ||
                node.querySelector?.('button') ||
                (node.textContent && node.textContent.includes('従業員'))
              ) {
                shouldUpdate = true;
                break;
              }
            }
          }
        }
        
        if (shouldUpdate) break;
      }
      
      if (shouldUpdate) {
        logDebug('重要なDOM変更を検出しました - 年度セレクタの追加処理を再実行します');
        addEmployeeDetailYearSelector();
      }
    }, 500); // 500ms以内の連続した変更をまとめて処理
  });

  // 監視設定（ページ全体、子要素の追加のみ監視）
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false // 属性変更は監視しない
  });

  // グローバル変数に保存（後で停止できるように）
  window._existingEmployeeObserver = observer;
  
  // タブ切り替えイベントでの処理
  document.addEventListener('click', function(e) {
    // タブのクリックを検出
    if (e.target.classList.contains('nav-link') || 
        (e.target.closest && e.target.closest('.nav-link'))) {
      logDebug('タブ切り替えを検出しました');
      // タブ切り替え後に少し遅延させて実行
      setTimeout(addEmployeeDetailYearSelector, 300);
    }
  });
  
  // URL変更の検出（ページ遷移）
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      logDebug('URL変更を検出しました - 年度セレクタの追加処理を再実行します');
      setTimeout(addEmployeeDetailYearSelector, 500);
    }
  }).observe(document, {subtree: true, childList: true});
  
  // ページ読み込み完了時の処理
  window.addEventListener('load', function() {
    logDebug('ページ読み込み完了 - 年度セレクタの追加処理を実行します');
    addEmployeeDetailYearSelector();
  });

  logDebug('従業員詳細の対象年度セレクタを表示するスクリプトを設定しました');
})();