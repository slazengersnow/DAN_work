/**
 * 月次報告の下部にある年月選択コントロールを非表示にするスクリプト
 * - 特定のスタイルや構造を持つコントロールを非表示
 * - 従業員詳細や月次詳細のタブに影響を与えないように配慮
 * - 実際の機能には影響しないよう慎重に実装
 */
(function() {
  // デバッグログ用の関数
  function logDebug(message) {
    console.log('[MonthlyControlHider] ' + message);
  }

  logDebug('月次報告の下部コントロール非表示スクリプトを開始します');

  // 既存のObserverを停止（存在する場合）
  if (window._existingMonthlyControlObserver && typeof window._existingMonthlyControlObserver.disconnect === 'function') {
    window._existingMonthlyControlObserver.disconnect();
    logDebug('既存のObserverを停止しました');
  }

  /**
   * 非表示にすべき年月コントロールを特定して非表示にする
   * 複数の特定方法を組み合わせて確実に対象のみを検出
   */
  function hideMonthlyControls() {
    // 結果を追跡
    let foundAndHidden = false;
    
    // 方法1: スタイル属性に基づいた特定
    const flexContainers = document.querySelectorAll('div[style*="display: flex"][style*="gap: 20px"][style*="margin-bottom: 20px"]');
    for (const container of flexContainers) {
      // 内部に「年度:」と「月:」ラベルが両方あるか確認
      const hasYearLabel = Array.from(container.querySelectorAll('label')).some(label => 
        label.textContent.includes('年度:'));
      const hasMonthLabel = Array.from(container.querySelectorAll('label')).some(label => 
        label.textContent.includes('月:'));
      
      // 更新ボタンがあるか確認
      const hasUpdateButton = Array.from(container.querySelectorAll('button')).some(button => 
        button.textContent.includes('更新'));
      
      if (hasYearLabel && hasMonthLabel && hasUpdateButton) {
        // これが対象のコントロール
        logDebug('方法1: フレックスコンテナスタイルから年月コントロールを特定しました');
        
        // 該当要素のイベントリスナーを削除せずに非表示にする
        container.style.cssText += '; display: none !important; visibility: hidden !important;';
        foundAndHidden = true;
      }
    }
    
    // 方法2: 構造に基づいた特定
    if (!foundAndHidden) {
      // 年度と月のラベルと選択ボックスを含むコンテナを検索
      const containers = document.querySelectorAll('div, section, article');
      for (const container of containers) {
        // 小さめのコンテナに限定（大きなセクションを非表示にしないため）
        if (container.children.length >= 2 && container.children.length <= 6) {
          const yearLabelSelect = hasLabelAndSelect(container, '年度');
          const monthLabelSelect = hasLabelAndSelect(container, '月');
          const updateButton = container.querySelector('button') && 
                              Array.from(container.querySelectorAll('button')).some(btn => 
                                btn.textContent.includes('更新'));
          
          if (yearLabelSelect && monthLabelSelect && updateButton) {
            logDebug('方法2: 構造から年月コントロールを特定しました');
            container.style.cssText += '; display: none !important; visibility: hidden !important;';
            foundAndHidden = true;
            break;
          }
        }
      }
    }
    
    // 方法3: 特定のHTMLパターンをテキストで検索
    if (!foundAndHidden) {
      const html = document.body.innerHTML;
      const patterns = [
        /<div[^>]*style="[^"]*display:\s*flex[^"]*gap:\s*20px[^"]*>/i,
        /<label[^>]*>年度:<\/label>[\s\S]*?<label[^>]*>月:<\/label>/i,
        /<select[^>]*>[\s\S]*?<option[^>]*>\d{4}<\/option>[\s\S]*?<\/select>[\s\S]*?<select[^>]*>[\s\S]*?<option[^>]*>\d{1,2}月<\/option>/i
      ];
      
      if (patterns.every(pattern => pattern.test(html))) {
        // パターンに一致する要素を探す
        const labels = document.querySelectorAll('label');
        const yearLabels = Array.from(labels).filter(label => label.textContent.includes('年度:'));
        const monthLabels = Array.from(labels).filter(label => label.textContent.includes('月:'));
        
        for (const yearLabel of yearLabels) {
          for (const monthLabel of monthLabels) {
            // 同じ親要素内にあるか確認
            let yearParent = yearLabel.parentElement;
            let monthParent = monthLabel.parentElement;
            
            while (yearParent && !yearParent.contains(monthLabel) && yearParent !== document.body) {
              yearParent = yearParent.parentElement;
            }
            
            if (yearParent && yearParent.contains(monthLabel)) {
              // 親要素内に更新ボタンがあるか確認
              const hasUpdateButton = Array.from(yearParent.querySelectorAll('button')).some(btn => 
                btn.textContent.includes('更新'));
              
              if (hasUpdateButton) {
                logDebug('方法3: HTMLパターンから年月コントロールを特定しました');
                yearParent.style.cssText += '; display: none !important; visibility: hidden !important;';
                foundAndHidden = true;
                break;
              }
            }
          }
          if (foundAndHidden) break;
        }
      }
    }
    
    // 方法4: 最も具体的なセレクタを使用
    if (!foundAndHidden) {
      const specificContainer = document.querySelector('div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px 15px"][style*="border-radius: 4px"]');
      if (specificContainer) {
        // 年度と月のラベルが両方含まれているか確認
        const labels = specificContainer.querySelectorAll('label');
        let hasYearLabel = false;
        let hasMonthLabel = false;
        
        for (const label of labels) {
          if (label.textContent.includes('年度:')) hasYearLabel = true;
          if (label.textContent.includes('月:')) hasMonthLabel = true;
        }
        
        if (hasYearLabel && hasMonthLabel) {
          logDebug('方法4: 具体的なスタイルから年月コントロールを特定しました');
          specificContainer.style.cssText += '; display: none !important; visibility: hidden !important;';
          foundAndHidden = true;
        }
      }
    }
    
    // 注意深いセレクタでより正確に判断
    if (!foundAndHidden) {
      // 「年度: 2024, 月: 5」のようなテキストを含む要素を探す
      const infoElements = Array.from(document.querySelectorAll('div')).filter(el => {
        const text = el.textContent;
        return /年度:\s*\d{4},\s*月:\s*\d{1,2}/.test(text);
      });
      
      for (const infoEl of infoElements) {
        // この情報要素を含む親コンテナを探す
        let container = infoEl.parentElement;
        while (container && container.querySelectorAll('select').length < 2) {
          container = container.parentElement;
          if (!container || container === document.body) break;
        }
        
        if (container && container.querySelectorAll('select').length >= 2) {
          logDebug('方法5: 情報テキストから年月コントロールを特定しました');
          container.style.cssText += '; display: none !important; visibility: hidden !important;';
          foundAndHidden = true;
          break;
        }
      }
    }
    
    return foundAndHidden;
  }
  
  /**
   * 指定されたコンテナ内に特定のテキストを含むラベルと
   * それに関連する選択ボックスがあるかを確認する補助関数
   */
  function hasLabelAndSelect(container, labelText) {
    // ラベルを探す
    const labels = Array.from(container.querySelectorAll('label')).filter(label => 
      label.textContent.includes(labelText));
    
    if (labels.length === 0) return false;
    
    // 選択ボックスを探す
    const selects = container.querySelectorAll('select');
    return selects.length > 0;
  }

  /**
   * 実際の機能に影響しないよう、表示のみを制御する追加処理
   */
  function preserveFunctionality() {
    // hidden要素で元の値を保持
    const yearSelects = document.querySelectorAll('div[style*="display: none"] select:first-child');
    const monthSelects = document.querySelectorAll('div[style*="display: none"] select:nth-child(2)');
    
    if (yearSelects.length > 0 && monthSelects.length > 0) {
      // 現在の選択値を取得
      const yearValue = yearSelects[0].value;
      const monthValue = monthSelects[0].value;
      
      // 必要な場合、値をグローバル変数に保存
      if (!window._preservedMonthlyValues) {
        window._preservedMonthlyValues = {
          year: yearValue,
          month: monthValue
        };
        logDebug(`年月の値を保存しました: 年度=${yearValue}, 月=${monthValue}`);
      }
    }
  }

  // 初回実行
  const initialResult = hideMonthlyControls();
  if (initialResult) {
    logDebug('年月コントロールの非表示化に成功しました');
    preserveFunctionality();
  } else {
    logDebug('対象の年月コントロールが見つかりませんでした');
  }

  // MutationObserverの設定（控えめな監視設定）
  let debounceTimer = null;
  
  const observer = new MutationObserver(function(mutations) {
    // 処理を間引く（デバウンス）
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      // 年月コントロールが表示されているか確認
      const visibleControl = document.querySelector('div[style*="display: flex"][style*="gap: 20px"] label:contains("年度:")');
      if (visibleControl) {
        logDebug('DOM変更後に年月コントロールを検出しました');
        hideMonthlyControls();
        preserveFunctionality();
      }
    }, 500);
  });

  // 監視設定（ページ全体、子要素の追加のみを監視）
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });

  // グローバル変数に保存（後で停止できるように）
  window._existingMonthlyControlObserver = observer;
  
  // タブ切り替えなどのイベントでも再適用
  document.addEventListener('click', function(e) {
    // タブやメニュー項目のクリックっぽい要素
    if (e.target.classList.contains('nav-link') || 
        e.target.classList.contains('nav-item') ||
        (e.target.closest && (e.target.closest('.nav-link') || e.target.closest('.nav-item')))) {
      
      // 少し遅延させて実行
      setTimeout(() => {
        const result = hideMonthlyControls();
        if (result) {
          logDebug('タブ切り替え後に年月コントロールを非表示にしました');
          preserveFunctionality();
        }
      }, 300);
    }
  });

  logDebug('月次報告の下部コントロール非表示スクリプトの設定が完了しました');
})();