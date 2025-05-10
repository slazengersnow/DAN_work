/**
 * 従業員詳細画面の年度表示を最適化するスクリプト
 * - 重複している年度表示を削除
 * - 右側に適切な対象年度セレクタを追加
 * - 月次詳細と同様のレイアウトに調整
 */
(function() {
  'use strict';
  
  // デバッグログ用の関数
  function logDebug(message) {
    console.log('[EmployeeDetailFix] ' + message);
  }

  logDebug('スクリプト実行開始');

  // 既存のObserverを停止（重複実行防止）
  if (window._employeeYearFixObserver && typeof window._employeeYearFixObserver.disconnect === 'function') {
    window._employeeYearFixObserver.disconnect();
    logDebug('既存のObserverを停止しました');
  }

  // テキスト内容で要素を検索するヘルパー関数
  function findElementByText(selector, text) {
    return Array.from(document.querySelectorAll(selector)).find(el => 
      el.textContent && el.textContent.includes(text));
  }

  // 従業員詳細画面の年度表示を修正する関数
  function fixEmployeeDetailYearDisplay() {
    // 従業員詳細画面が表示されているか確認
    const employeeDetailHeading = findElementByText('h2, h3, h4', '従業員詳細');
    
    if (!employeeDetailHeading) {
      // 従業員詳細タブが選択されているか確認（別の方法）
      const activeTab = document.querySelector('.nav-link.active');
      if (!activeTab || (activeTab.textContent && !activeTab.textContent.includes('従業員詳細'))) {
        logDebug('従業員詳細画面が表示されていません');
        return false;
      }
    }
    
    logDebug('従業員詳細画面を検出しました');
    
    // すでに修正済みかチェック
    if (document.querySelector('.employee-year-fixed')) {
      logDebug('すでに修正済みです');
      return true;
    }
    
    // 重複している年度ラベルを非表示にする
    const yearLabels = Array.from(document.querySelectorAll('label, div')).filter(el => 
      el.textContent && 
      (el.textContent.includes('年度:') || el.textContent.includes('対象年度:') || el.textContent.includes('年度')) &&
      (el.closest('.employee-detail') || 
       el.closest('[class*="employee"]') || 
       el.closest('.employee-year-selector-fixed'))
    );
    
    yearLabels.forEach(label => {
      // 他のスクリプトで追加されたセレクタも含めて確認
      const container = label.closest('.form-group') || 
                      label.closest('.row') || 
                      label.closest('.col') || 
                      label.closest('[class*="group"]') || 
                      label.closest('.employee-year-selector-fixed');
                      
      if (container) {
        // 表示されたままにしたい要素でないことを確認
        if (!container.classList.contains('employee-year-fixed')) {
          container.style.cssText = 'display: none !important;';
          logDebug('重複している年度ラベルを非表示にしました: ' + (label.textContent || '').trim());
        }
      }
    });
    
    // ツールバー領域を検出
    let toolbar = null;
    
    // 方法1: ボタングループを探す
    toolbar = document.querySelector('.btn-group, .toolbar, .action-buttons');
    
    // 方法2: 編集ボタンを探してその親を取得
    if (!toolbar) {
      const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent && (
          btn.textContent.includes('編集') || 
          btn.textContent.includes('Edit')
        )
      );
      
      if (editButtons.length > 0) {
        toolbar = editButtons[0].parentElement;
        logDebug('編集ボタンから親ツールバーを検出しました');
      }
    }
    
    // 方法3: 戻るボタンを探してその親を取得
    if (!toolbar) {
      const backButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent && (
          btn.textContent.includes('戻る') || 
          btn.textContent.includes('Back')
        )
      );
      
      if (backButtons.length > 0) {
        toolbar = backButtons[0].parentElement;
        logDebug('戻るボタンから親ツールバーを検出しました');
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
    
    if (!toolbar) {
      logDebug('ツールバー領域が見つかりませんでした');
      return false;
    }
    
    // 年度セレクタコンテナを作成
    const yearContainer = document.createElement('div');
    yearContainer.className = 'employee-year-fixed';
    yearContainer.style.cssText = 'display: flex; align-items: center; justify-content: flex-end; margin-bottom: 15px; margin-top: 5px;';
    
    // 現在の年を取得
    const currentYear = new Date().getFullYear();
    
    // 年度セレクタの内容を作成（右揃えで配置）
    yearContainer.innerHTML = `
      <div style="margin-left: auto; display: flex; align-items: center;">
        <label style="margin-right: 8px; margin-bottom: 0; font-weight: normal;">対象年度:</label>
        <select class="form-control form-control-sm" style="width: auto; display: inline-block; padding: 4px 8px; height: auto;">
          <option value="${currentYear-2}">${currentYear-2}年度</option>
          <option value="${currentYear-1}">${currentYear-1}年度</option>
          <option value="${currentYear}" selected>${currentYear}年度</option>
          <option value="${currentYear+1}">${currentYear+1}年度</option>
        </select>
      </div>
    `;
    
    // 最適な挿入位置を探す
    // 方法1: テーブルやタブセクションの前
    const insertBeforeElement = document.querySelector('.employee-detail table, .employee-list, .data-table, .tab-content, .nav-tabs');
    
    // 方法2: ツールバーの親要素の次
    const parentRow = toolbar.closest('.row, .container') || toolbar.parentElement;
    
    // 方法3: 見出しの後（テキスト内容で見出しを検索）
    const headingElement = findElementByText('h2, h3, h4', '従業員詳細');
    
    if (insertBeforeElement) {
      // テーブルやタブセクションの前に挿入
      insertBeforeElement.parentElement.insertBefore(yearContainer, insertBeforeElement);
      logDebug('テーブル/タブの前に年度セレクタを挿入しました');
    } else if (parentRow) {
      // ツールバーの後に挿入
      if (parentRow.nextSibling) {
        parentRow.parentElement.insertBefore(yearContainer, parentRow.nextSibling);
      } else {
        parentRow.parentElement.appendChild(yearContainer);
      }
      logDebug('ツールバーの後に年度セレクタを挿入しました');
    } else if (headingElement && headingElement.nextSibling) {
      // 見出しの後に挿入
      headingElement.parentElement.insertBefore(yearContainer, headingElement.nextSibling);
      logDebug('見出しの後に年度セレクタを挿入しました');
    } else {
      // 最終手段: bodyの先頭に追加
      const mainContent = document.querySelector('main, .main-content, .content');
      if (mainContent) {
        if (mainContent.firstChild) {
          mainContent.insertBefore(yearContainer, mainContent.firstChild);
        } else {
          mainContent.appendChild(yearContainer);
        }
        logDebug('メインコンテンツに年度セレクタを挿入しました');
      } else {
        // どうしても挿入先が見つからない場合
        document.body.appendChild(yearContainer);
        logDebug('ボディに年度セレクタを挿入しました');
      }
    }
    
    // イベントリスナーを追加
    const select = yearContainer.querySelector('select');
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
        
        // UIフィードバック
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
        yearContainer.querySelector('div').appendChild(yearText);
        
        // アニメーション効果
        setTimeout(() => {
          yearText.style.opacity = '1';
          
          // 3秒後にフェードアウト
          setTimeout(() => {
            yearText.style.opacity = '0';
            
            // フェードアウト後に削除
            setTimeout(() => {
              if (yearText.parentNode) yearText.parentNode.removeChild(yearText);
            }, 300);
          }, 3000);
        }, 10);
      });
    }
    
    logDebug('従業員詳細の年度表示を修正しました');
    return true;
  }

  // 初回実行
  setTimeout(() => {
    const result = fixEmployeeDetailYearDisplay();
    logDebug(`初回実行結果: ${result ? '成功' : '失敗'}`);
  }, 500);

  // MutationObserverの設定
  // デバウンス処理用の変数
  let debounceTimer = null;
  
  const observer = new MutationObserver(function(mutations) {
    // 処理を間引く（デバウンス）
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      // 重要な変更のみに反応
      let shouldUpdate = false;
      
      for (const mutation of mutations) {
        // 要素追加の場合
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 従業員詳細関連の要素か確認
              if (
                (node.textContent && node.textContent.includes('従業員詳細')) ||
                node.classList?.contains('tab-pane') ||
                node.classList?.contains('employee-detail') ||
                node.querySelector?.('.employee-detail, h2, h3, h4, button')
              ) {
                shouldUpdate = true;
                break;
              }
            }
          }
        }
        
        // タブの切り替わりなど属性変更の場合
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            mutation.target.classList?.contains('active')) {
          shouldUpdate = true;
        }
        
        if (shouldUpdate) break;
      }
      
      if (shouldUpdate) {
        logDebug('重要なDOM変更を検出しました');
        fixEmployeeDetailYearDisplay();
      }
    }, 300); // 300ms以内の連続した変更をまとめて処理
  });

  // 監視設定（ページ全体、子要素の追加と属性変更を監視）
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true, // タブの active 状態変化を検出するため属性変更も監視
    attributeFilter: ['class'] // クラス属性の変更のみ監視
  });

  // グローバル変数に保存（後で停止できるように）
  window._employeeYearFixObserver = observer;
  
  // タブ切り替えイベントでの処理
  document.addEventListener('click', function(e) {
    // タブのクリックを検出
    if (e.target.classList?.contains('nav-link') || 
        (e.target.closest && e.target.closest('.nav-link'))) {
      logDebug('タブ切り替えを検出しました');
      
      // タブ切り替え後に少し遅延させて実行
      setTimeout(() => {
        // クリックされたのが従業員詳細タブかチェック
        const targetElement = e.target.closest('.nav-link') || e.target;
        const isEmployeeTab = targetElement.textContent && 
                             (targetElement.textContent.includes('従業員詳細') || 
                              targetElement.textContent.includes('従業員'));
        
        if (isEmployeeTab) {
          logDebug('従業員詳細タブがクリックされました');
          fixEmployeeDetailYearDisplay();
        }
      }, 300);
    }
  });
  
  // URL変更の検出（ページ遷移）
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      logDebug('URL変更を検出しました');
      
      // URLが従業員詳細を含むか確認
      if (url.includes('employee') || url.includes('staff')) {
        setTimeout(fixEmployeeDetailYearDisplay, 500);
      }
    }
  }).observe(document, {subtree: true, childList: true});
  
  // ページ読み込み完了時の処理
  window.addEventListener('load', function() {
    logDebug('ページ読み込み完了');
    setTimeout(fixEmployeeDetailYearDisplay, 300);
  });

  logDebug('従業員詳細の年度表示修正スクリプトを設定しました');
})();