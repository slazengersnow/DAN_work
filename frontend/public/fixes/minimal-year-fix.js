/**
 * minimal-year-fix.js
 * 
 * CSVインポート年度問題を解決する超シンプルな実装
 * - 監視機構や自動検出機能を排除
 * - 一度だけ実行されるコードで年度維持を実現
 * - パフォーマンスへの影響を最小限に抑制
 */

(function() {
  // 安全なエラーログ出力（エラー時のみ使用）
  function logError(message) {
    try {
      console.error('[最小年度修正] ' + message);
    } catch (e) {
      // エラーハンドリングのエラーは無視
    }
  }

  // 年度情報を検出して保存
  function detectAndSaveYear() {
    try {
      // セレクタ配列から最初に見つかった年度選択要素を取得
      const yearSelectors = [
        'select[name="fiscalYear"]',
        'select[data-testid="fiscal-year"]',
        'select[name*="year"]',
        'select[id*="year"]'
      ];
      
      // 年度選択要素を検索
      let yearElement = null;
      for (const selector of yearSelectors) {
        const el = document.querySelector(selector);
        if (el && el.value) {
          yearElement = el;
          break;
        }
      }
      
      // 年度が見つかれば保存
      if (yearElement && yearElement.value) {
        const year = yearElement.value;
        localStorage.setItem('minimal_year_fix', year);
        
        // URL内の年度パラメータをチェック
        const currentUrl = window.location.href;
        const yearParam = currentUrl.match(/[?&]year=(\d+)/);
        if (yearParam && yearParam[1] !== year) {
          // URLを更新（最小限の操作）
          window.history.replaceState(null, '', 
            currentUrl.replace(`year=${yearParam[1]}`, `year=${year}`)
          );
        }
        
        return year;
      }
      
      return null;
    } catch (e) {
      logError('年度検出エラー: ' + e.message);
      return null;
    }
  }

  // 初期実行 - スクリプトロード時に一度だけ実行
  try {
    // 年度を検出して保存
    const year = detectAndSaveYear();
    
    // CSVインポート完了後の年度復元用の関数を定義
    window.restoreYear = function() {
      try {
        // 保存された年度を取得
        const savedYear = localStorage.getItem('minimal_year_fix') || year;
        if (!savedYear) return;
        
        // 年度選択要素を検索して値を設定
        const yearSelectors = [
          'select[name="fiscalYear"]',
          'select[data-testid="fiscal-year"]',
          'select[name*="year"]',
          'select[id*="year"]'
        ];
        
        for (const selector of yearSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            if (el && el.value !== savedYear) {
              el.value = savedYear;
              // 変更イベントを発火
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }
      } catch (e) {
        logError('年度復元エラー: ' + e.message);
      }
    };
    
    // DOMContentLoadedイベントで保存された年度を確認
    if (document.readyState !== 'loading') {
      window.restoreYear();
    } else {
      document.addEventListener('DOMContentLoaded', window.restoreYear);
    }
    
    // CSVインポート後に外部から呼び出せるようにグローバルオブジェクトを作成
    window.MinimalYearFix = {
      restore: window.restoreYear,
      detect: detectAndSaveYear
    };
  } catch (e) {
    logError('初期化エラー: ' + e.message);
  }
})();