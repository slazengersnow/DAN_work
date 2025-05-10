/**
 * 従業員詳細画面のUI修正スクリプト
 * - 従業員詳細というタイトルの横に年度選択機能を追加
 * - データ引き継ぎボタン左の年度セレクタを削除
 */
(function() {
  // デバッグログ用の関数
  function logDebug(message) {
    console.log('[EmployeeDetailEnhancer] ' + message);
  }

  logDebug('従業員詳細UI修正スクリプトを開始します');

  // 既存のObserverを停止（存在する場合）
  if (window._existingEmployeeDetailObserver && typeof window._existingEmployeeDetailObserver.disconnect === 'function') {
    window._existingEmployeeDetailObserver.disconnect();
    logDebug('既存のObserverを停止しました');
  }

  // 現在の年度を取得（既存のセレクタから、なければ現在の年）
  function getCurrentFiscalYear() {
    // 既存の年度セレクタから値を取得
    const existingYearSelector = document.querySelector('select[name*="year"], select.year-selector');
    if (existingYearSelector) {
      return existingYearSelector.value;
    }
    
    // 画面上のテキストから年度を検索
    const yearTextElements = document.querySelectorAll('*:not(script):not(style)');
    for (const el of yearTextElements) {
      if (el.textContent) {
        const match = el.textContent.match(/(\d{4})年度/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    
    // デフォルトは現在の年
    return new Date().getFullYear().toString();
  }

  // データ引き継ぎボタン左の年度セレクタを削除
  function removeExistingYearSelector() {
    // 年度セレクタの特定方法
    const yearSelectors = [
      // ラベルから特定
      ...Array.from(document.querySelectorAll('label')).filter(el => el.textContent && el.textContent.includes('年度')),
      // セレクタ自体から特定
      ...document.querySelectorAll('select[name*="year"], select.year-selector')
    ];
    
    for (const selector of yearSelectors) {
      const container = selector.closest('.form-group, .row, .control-group');
      if (container && container.parentNode) {
        // "データ引き継ぎ"ボタンを含むかチェック
        const hasDataButton = Array.from(container.querySelectorAll('button')).some(btn => 
          btn.textContent && btn.textContent.includes('データ引き継ぎ'));

        if (hasDataButton || container.querySelector('[data-continue], [data-inherit]')) {
          logDebug('データ引き継ぎボタン付近の年度セレクタを発見');
          container.removeChild(selector);
          logDebug('年度セレクタを削除しました');
          return true;
        }
      }
    }
    
    // 「年度:」ラベルを含む要素を検索
    const yearLabels = Array.from(document.querySelectorAll('label')).filter(el => 
      el.textContent && el.textContent.includes('年度:'));
    
    if (yearLabels.length > 0) {
      for (const label of yearLabels) {
        const formGroup = label.closest('.form-group, .form-inline, .row');
        if (formGroup && formGroup.querySelector('button')) {
          formGroup.removeChild(label);
          // 関連するセレクトボックスも削除
          const select = formGroup.querySelector('select');
          if (select) {
            formGroup.removeChild(select);
          }
          logDebug('年度ラベルとセレクタを削除しました');
          return true;
        }
      }
    }
    
    return false;
  }

  // 従業員詳細タイトルに年度選択機能を追加
  function enhanceEmployeeDetailTitle() {
    // 従業員詳細のタイトル要素を探す
    const titleElements = [
      ...document.querySelectorAll('h1, h2, h3, h4, h5, .title, .header'),
      ...document.querySelectorAll('*[class*="title"], *[class*="header"]')
    ];
    
    let titleElement = null;
    for (const el of titleElements) {
      if (el.textContent && el.textContent.trim() === '従業員詳細') {
        titleElement = el;
        break;
      }
    }
    
    if (!titleElement) {
      logDebug('従業員詳細タイトルが見つかりませんでした');
      return false;
    }
    
    // 既に年度セレクタが追加されていないか確認
    if (titleElement.querySelector('.year-selector-dropdown') || 
        titleElement.textContent.includes('年度)')) {
      logDebug('タイトルには既に年度セレクタが追加されています');
      return true;
    }
    
    // 現在の年度を取得
    const currentYear = getCurrentFiscalYear();
    logDebug(`現在の年度: ${currentYear}`);
    
    // 元のタイトルテキストを保存
    const originalText = titleElement.textContent.trim();
    
    // 年度セレクタのためのスパン要素を作成
    const yearSelectorSpan = document.createElement('span');
    yearSelectorSpan.className = 'year-selector-dropdown';
    yearSelectorSpan.style.cssText = 'margin-left: 10px; font-size: 0.9em; cursor: pointer; color: #007bff;';
    yearSelectorSpan.textContent = `(${currentYear}年度 ▼)`;
    
    // ドロップダウンメニューの作成
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'year-dropdown-menu';
    dropdownMenu.style.cssText = 'display: none; position: absolute; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1000;';
    
    // 年度オプションを追加 (現在の年の前後2年)
    const baseYear = parseInt(currentYear);
    for (let year = baseYear - 2; year <= baseYear + 2; year++) {
      const yearOption = document.createElement('div');
      yearOption.className = 'year-option';
      yearOption.textContent = `${year}年度`;
      yearOption.style.cssText = 'padding: 8px 12px; cursor: pointer; transition: background 0.2s;';
      yearOption.dataset.year = year;
      
      // 現在の年度ならハイライト
      if (year === baseYear) {
        yearOption.style.fontWeight = 'bold';
        yearOption.style.backgroundColor = '#f0f0f0';
      }
      
      // ホバー効果
      yearOption.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#f0f0f0';
      });
      
      yearOption.addEventListener('mouseout', function() {
        if (parseInt(this.dataset.year) !== baseYear) {
          this.style.backgroundColor = '';
        }
      });
      
      // クリックイベント
      yearOption.addEventListener('click', function() {
        const selectedYear = this.dataset.year;
        logDebug(`年度を${selectedYear}に変更しました`);
        
        // タイトルの年度表示を更新
        yearSelectorSpan.textContent = `(${selectedYear}年度 ▼)`;
        
        // ドロップダウンを閉じる
        dropdownMenu.style.display = 'none';
        
        // 年度変更イベントを発行（必要に応じて）
        const changeEvent = new CustomEvent('fiscalYearChanged', {
          detail: { year: selectedYear }
        });
        document.dispatchEvent(changeEvent);
        
        // 既存の年度セレクタの値も更新（存在する場合）
        const existingSelectors = document.querySelectorAll('select[name*="year"], select.year-selector');
        existingSelectors.forEach(selector => {
          for (let i = 0; i < selector.options.length; i++) {
            if (selector.options[i].value == selectedYear) {
              selector.selectedIndex = i;
              selector.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        });
      });
      
      dropdownMenu.appendChild(yearOption);
    }
    
    // クリックイベントでドロップダウンを表示/非表示
    yearSelectorSpan.addEventListener('click', function(e) {
      e.stopPropagation(); // イベントの伝播を停止
      
      if (dropdownMenu.style.display === 'none') {
        // ドロップダウンの位置を調整
        const rect = yearSelectorSpan.getBoundingClientRect();
        dropdownMenu.style.top = (rect.bottom + window.scrollY) + 'px';
        dropdownMenu.style.left = (rect.left + window.scrollX) + 'px';
        
        // ドロップダウンを表示
        dropdownMenu.style.display = 'block';
      } else {
        // ドロップダウンを非表示
        dropdownMenu.style.display = 'none';
      }
    });
    
    // ドキュメント内の他の場所をクリックしたらドロップダウンを閉じる
    document.addEventListener('click', function() {
      dropdownMenu.style.display = 'none';
    });
    
    // タイトルに年度セレクタを追加
    titleElement.appendChild(yearSelectorSpan);
    document.body.appendChild(dropdownMenu);
    
    logDebug('従業員詳細タイトルに年度セレクタを追加しました');
    return true;
  }

  // UI修正の実行
  function applyUIEnhancements() {
    // 「データ引き継ぎ」左の年度セレクタを削除
    const removed = removeExistingYearSelector();
    if (removed) {
      logDebug('データ引き継ぎボタン左の年度セレクタを削除しました');
    }
    
    // 従業員詳細タイトルに年度選択機能を追加
    const enhanced = enhanceEmployeeDetailTitle();
    if (enhanced) {
      logDebug('従業員詳細タイトルに年度選択機能を追加しました');
    }
    
    return removed || enhanced;
  }

  // 初回実行
  const initialResult = applyUIEnhancements();
  logDebug(`初回実行結果: ${initialResult ? '変更を適用しました' : '対象要素が見つかりませんでした'}`);

  // MutationObserverの設定
  // デバウンス処理用の変数
  let debounceTimer = null;
  
  const observer = new MutationObserver(function(mutations) {
    // 処理を間引く（デバウンス）
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      logDebug('DOM変更を検出しました - UI修正を再適用します');
      applyUIEnhancements();
    }, 500); // 500ms以内の連続した変更をまとめて処理
  });

  // 監視設定（ページ全体、子要素の追加のみ監視）
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false // 属性変更は監視しない
  });

  // グローバル変数に保存（後で停止できるように）
  window._existingEmployeeDetailObserver = observer;
  
  // タブ切り替えイベントでの処理
  document.addEventListener('click', function(e) {
    // タブのクリックを検出
    if (e.target.classList.contains('nav-link') || 
        (e.target.closest && e.target.closest('.nav-link'))) {
      logDebug('タブ切り替えを検出しました');
      // タブ切り替え後に少し遅延させて実行
      setTimeout(applyUIEnhancements, 300);
    }
  });

  logDebug('従業員詳細画面のUI修正スクリプトを設定しました');
})();