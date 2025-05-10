/**
 * 従業員詳細画面の年度セレクタ改善スクリプト
 * - タイトル横の年度セレクタの色を黒に変更
 * - 年度切替機能を実装し、データを実際に更新
 * - 「年度:」ラベルを削除
 */
(function() {
  // デバッグログ用の関数
  function logDebug(message) {
    console.log('[EmployeeDetailFix] ' + message);
  }

  logDebug('従業員詳細画面の改善スクリプトを開始します');

  // 既存のObserverを停止（存在する場合）
  if (window._existingEmployeeFixObserver && typeof window._existingEmployeeFixObserver.disconnect === 'function') {
    window._existingEmployeeFixObserver.disconnect();
    logDebug('既存のObserverを停止しました');
  }

  // 年度ラベル削除関数
  function removeYearLabels() {
    // 「年度:」というラベルを検索
    const yearLabels = Array.from(document.querySelectorAll('label')).filter(el => 
      el.textContent && el.textContent.includes('年度:')
    );
    
    let removed = false;
    yearLabels.forEach(label => {
      // スタイル属性を確認
      if (label.style && 
          (label.style.marginRight === '8px' || label.style.fontSize === '0.9rem' || 
           label.getAttribute('style')?.includes('margin-right: 8px'))) {
        label.parentNode.removeChild(label);
        logDebug('「年度:」ラベルを削除しました');
        removed = true;
      }
    });

    // 属性セレクタを使用した特定
    const styleLabels = document.querySelectorAll('label[style*="margin-right: 8px"][style*="font-size: 0.9rem"]');
    styleLabels.forEach(label => {
      if (label.textContent.includes('年度')) {
        label.parentNode.removeChild(label);
        logDebug('スタイル指定のある年度ラベルを削除しました');
        removed = true;
      }
    });

    return removed;
  }

  // タイトル横の年度セレクタのフォントカラーを黒に変更
  function updateYearSelectorStyle() {
    // タイトル要素を取得
    const titleElements = document.querySelectorAll('h1, h2, h3, h4, .title, [class*="title"]');
    let yearSelector = null;
    
    for (const title of titleElements) {
      if (title.textContent && title.textContent.includes('従業員詳細')) {
        // 「年度 ▼」というテキストを含むスパンを探す
        const spans = title.querySelectorAll('span');
        for (const span of spans) {
          if (span.textContent && (span.textContent.includes('年度') || span.textContent.includes('▼'))) {
            yearSelector = span;
            break;
          }
        }
        break;
      }
    }
    
    if (!yearSelector) {
      logDebug('年度セレクタが見つかりませんでした');
      return false;
    }
    
    // スタイルを更新
    yearSelector.style.color = '#000000';
    yearSelector.style.fontWeight = 'normal';
    
    logDebug('年度セレクタのフォントカラーを黒に変更しました');
    return true;
  }

  // 年度変更時のデータ再取得関数
  function implementYearChangeFunction() {
    // タイトル要素を取得
    const titleElements = document.querySelectorAll('h1, h2, h3, h4, .title, [class*="title"]');
    let yearSelector = null;
    
    for (const title of titleElements) {
      if (title.textContent && title.textContent.includes('従業員詳細')) {
        // 「年度 ▼」というテキストを含むスパンを探す
        const spans = title.querySelectorAll('span');
        for (const span of spans) {
          if (span.textContent && (span.textContent.includes('年度') || span.textContent.includes('▼'))) {
            yearSelector = span;
            break;
          }
        }
        break;
      }
    }
    
    if (!yearSelector) {
      logDebug('年度セレクタが見つかりませんでした');
      return false;
    }
    
    // 既存のドロップダウンメニュー要素を取得
    const dropdownMenu = document.querySelector('.year-dropdown-menu');
    if (!dropdownMenu) {
      logDebug('ドロップダウンメニューが見つかりませんでした');
      return false;
    }
    
    // ドロップダウンメニュー内の年度オプションを取得
    const yearOptions = dropdownMenu.querySelectorAll('.year-option');
    
    // 各年度オプションに対して、クリックイベントを上書き
    yearOptions.forEach(option => {
      // 既存のイベントリスナーを削除（可能な限り）
      const newOption = option.cloneNode(true);
      option.parentNode.replaceChild(newOption, option);
      
      // 新しいイベントリスナーを追加
      newOption.addEventListener('click', function(e) {
        e.stopPropagation();
        const selectedYear = this.dataset.year;
        logDebug(`年度を${selectedYear}に変更します`);
        
        // 年度表示テキストを更新
        const yearText = selectedYear + '年度 ▼';
        yearSelector.textContent = '(' + yearText + ')';
        
        // ドロップダウンを閉じる
        dropdownMenu.style.display = 'none';
        
        // 年度変更に伴うデータ更新処理
        updateDataForYear(selectedYear);
      });
    });
    
    logDebug('年度変更機能を実装しました');
    return true;
  }

  // 年度変更時のデータ更新処理
  function updateDataForYear(year) {
    logDebug(`${year}年度のデータを取得中...`);
    
    // 1. URLパラメータの変更
    updateUrlParam('year', year);
    
    // 2. 隠しフィールドの更新
    const yearInputs = document.querySelectorAll('input[name*="year"], input[name*="fiscal"]');
    yearInputs.forEach(input => {
      input.value = year;
      logDebug(`隠しフィールド ${input.name} の値を ${year} に更新しました`);
    });
    
    // 3. セレクトボックスの更新
    const yearSelects = document.querySelectorAll('select[name*="year"], select[name*="fiscal"]');
    yearSelects.forEach(select => {
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value == year) {
          select.selectedIndex = i;
          // 変更イベントを発火
          const event = new Event('change', { bubbles: true });
          select.dispatchEvent(event);
          logDebug(`セレクトボックス ${select.name} の値を ${year} に更新しました`);
          break;
        }
      }
    });
    
    // 4. 「更新」または「適用」ボタンの自動クリック
    setTimeout(() => {
      const updateButtons = Array.from(document.querySelectorAll('button, input[type="button"], a.btn'))
        .filter(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('更新') || text.includes('適用') || text.includes('表示') || 
                 text.includes('検索') || text.includes('update') || text.includes('apply');
        });
      
      if (updateButtons.length > 0) {
        logDebug('データ更新ボタンをクリックします');
        updateButtons[0].click();
      } else {
        // 5. API直接呼び出しによるデータ更新
        reloadEmployeeData(year);
      }
    }, 100);
  }

  // URLパラメータ更新関数
  function updateUrlParam(key, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url.toString());
    logDebug(`URLパラメータ ${key} を ${value} に更新しました`);
  }

  // 従業員データ再読み込み関数
  function reloadEmployeeData(year) {
    logDebug(`${year}年度の従業員データを再読み込みします`);
    
    // 現在のページパスを取得
    const currentPath = window.location.pathname;
    
    // 従業員一覧テーブルを取得
    const employeeTable = document.querySelector('table, [class*="table"]');
    if (!employeeTable) {
      logDebug('従業員テーブルが見つかりませんでした');
      
      // ページ全体をリロードする（最終手段）
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('year', year);
      window.location.href = currentUrl.toString();
      return;
    }
    
    // ローディング表示を追加
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;';
    loadingDiv.innerHTML = '<div style="padding: 20px; background-color: white; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.2);">データ読み込み中...</div>';
    document.body.appendChild(loadingDiv);
    
    // 年度変更イベントを発火
    const yearChangeEvent = new CustomEvent('fiscalYearChanged', { 
      detail: { year: year },
      bubbles: true
    });
    document.dispatchEvent(yearChangeEvent);
    
    // ページをリロード
    setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('year', year);
      window.location.href = url.toString();
    }, 500);
  }

  // UI改善の実行
  function applyUIImprovements() {
    // 1. 「年度:」ラベルの削除
    const labelsRemoved = removeYearLabels();
    
    // 2. 年度セレクタの色を黒に変更
    const styleUpdated = updateYearSelectorStyle();
    
    // 3. 年度変更機能の実装
    const functionImplemented = implementYearChangeFunction();
    
    return labelsRemoved || styleUpdated || functionImplemented;
  }

  // 初回実行
  const initialResult = applyUIImprovements();
  logDebug(`初回実行結果: ${initialResult ? '変更を適用しました' : '変更はありませんでした'}`);

  // MutationObserverの設定
  // デバウンス処理用の変数
  let debounceTimer = null;
  
  const observer = new MutationObserver(function(mutations) {
    // 処理を間引く（デバウンス）
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      logDebug('DOM変更を検出しました - UI改善を再適用します');
      applyUIImprovements();
    }, 500); // 500ms以内の連続した変更をまとめて処理
  });

  // 監視設定（ページ全体、子要素の追加と属性変更を監視）
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true // 属性変更も監視する
  });

  // グローバル変数に保存（後で停止できるように）
  window._existingEmployeeFixObserver = observer;
  
  // タブ切り替えイベントでの処理
  document.addEventListener('click', function(e) {
    // タブのクリックを検出
    if (e.target.classList.contains('nav-link') || 
        (e.target.closest && e.target.closest('.nav-link'))) {
      logDebug('タブ切り替えを検出しました');
      // タブ切り替え後に少し遅延させて実行
      setTimeout(applyUIImprovements, 300);
    }
  });

  logDebug('従業員詳細画面の改善スクリプトを設定しました');
})();