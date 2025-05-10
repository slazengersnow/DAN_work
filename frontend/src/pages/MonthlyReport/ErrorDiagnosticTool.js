/**
 * ErrorDiagnosticTool.js - CSVインポートエラー診断ツール
 * 
 * このツールはCSVインポート処理中に発生するエラーを診断・記録し、
 * 根本原因の特定と解決策の提案を行います。
 * 
 * 主な機能:
 * 1. web-client-content-script.js のエラー診断
 * 2. クライアント側のエラーログを記録・分析
 * 3. エラーパターンの特定と解決策の提案
 * 4. 開発者向けデバッグ情報の提供
 * 
 * 使用方法:
 * ブラウザコンソールから直接実行するか、アプリケーションに統合して使用。
 * 
 * 作成: 2025年5月
 */

/**
 * エラー診断ツールクラス
 */
class ErrorDiagnosticTool {
  constructor(options = {}) {
    this.options = {
      logToConsole: true,
      logToStorage: true,
      maxStoredLogs: 100,
      captureGlobalErrors: true,
      captureAjaxErrors: true,
      captureReactErrors: true,
      logStorageKey: 'csv_import_error_logs',
      ...options
    };
    
    this.initialized = false;
    this.errorLogs = [];
    this.ajaxInterceptors = [];
    this.errorPatterns = this.initErrorPatterns();
    
    // 状態カウンター
    this.stats = {
      totalErrors: 0,
      ajaxErrors: 0,
      scriptErrors: 0,
      reactErrors: 0,
      diagnosticRuns: 0
    };
  }
  
  /**
   * 既知のエラーパターンとその解決策を初期化
   */
  initErrorPatterns() {
    return [
      {
        id: 'csv_format_error',
        signature: /csv.*format|unexpected.*token|parse.*error/i,
        diagnosis: 'CSVファイルの形式に問題があります。',
        solutions: [
          'BOMヘッダーが含まれているか確認してください。',
          'CSVファイルの文字コードがUTF-8であることを確認してください。',
          'CSVファイルの行末がCRLFまたはLFのいずれかで統一されているか確認してください。',
          'ダブルクォートで囲まれた値に問題がないか確認してください。'
        ],
        severity: 'high'
      },
      {
        id: 'api_404_error',
        signature: /404|not found|endpoint.*not.*exist/i,
        diagnosis: 'APIエンドポイントが見つかりません。',
        solutions: [
          'URLに "monthly-report" と "monthly-reports" のどちらが使用されているか確認してください。',
          'APIサーバーが実行されていることを確認してください。',
          'エンドポイントのパスに年度と月の値が正しく含まれているか確認してください。'
        ],
        severity: 'high'
      },
      {
        id: 'api_validation_error',
        signature: /validation|invalid.*data|required.*field|schema/i,
        diagnosis: 'データバリデーションに失敗しました。',
        solutions: [
          'CSVファイルに必須フィールドがすべて含まれているか確認してください。',
          '数値フィールドに無効な文字が含まれていないか確認してください。',
          'データ型が正しいか確認してください（文字列、数値など）。'
        ],
        severity: 'medium'
      },
      {
        id: 'network_error',
        signature: /network|connection|timeout|failed.*to.*fetch/i,
        diagnosis: 'ネットワーク接続に問題があります。',
        solutions: [
          'インターネット接続を確認してください。',
          'APIサーバーが実行されていることを確認してください。',
          'CORS設定が正しいか確認してください。',
          'リクエストタイムアウトの値を増やしてみてください。'
        ],
        severity: 'medium'
      },
      {
        id: 'state_update_error',
        signature: /cannot.*update.*component|state.*update|unmounted.*component/i,
        diagnosis: 'Reactコンポーネントの状態更新に問題があります。',
        solutions: [
          'アンマウントされたコンポーネントの状態を更新しようとしていないか確認してください。',
          'useEffectのクリーンアップ関数で非同期処理をキャンセルしているか確認してください。',
          'コンポーネントのマウント状態を追跡するフラグを使用してください。'
        ],
        severity: 'medium'
      },
      {
        id: 'memory_error',
        signature: /out.*of.*memory|heap.*size|stack.*overflow/i,
        diagnosis: 'メモリ関連の問題が発生しています。',
        solutions: [
          '大きなCSVファイルを分割して処理してください。',
          'メモリリークの可能性があるイベントリスナーを確認してください。',
          '無限ループや無限再帰がないか確認してください。'
        ],
        severity: 'high'
      },
      {
        id: 'script_error',
        signature: /script.*error|undefined.*is.*not.*function|type.*error/i,
        diagnosis: 'JavaScriptコードの実行中にエラーが発生しています。',
        solutions: [
          'ブラウザコンソールで詳細なエラーメッセージを確認してください。',
          'undefined値やnull値に対してメソッドを呼び出していないか確認してください。',
          'オブジェクトのプロパティにアクセスする前に存在確認をしてください。'
        ],
        severity: 'high'
      },
      {
        id: 'content_script_error',
        signature: /web-client-content-script|content.*script.*error/i,
        diagnosis: 'CSVインポート処理中にコンテンツスクリプトでエラーが発生しています。',
        solutions: [
          'ブラウザを再起動してキャッシュをクリアしてみてください。',
          'スクリプトロードの順序に問題がないか確認してください。',
          'ブラウザの拡張機能との競合がないか確認してください。'
        ],
        severity: 'high'
      },
      {
        id: 'cors_error',
        signature: /cors|cross.*origin|origin.*not.*allowed/i,
        diagnosis: 'CORS (Cross-Origin Resource Sharing) エラーが発生しています。',
        solutions: [
          'APIサーバーのCORS設定を確認してください。',
          'リクエストヘッダーに不適切な値がないか確認してください。',
          'APIのURL設定が正しいか確認してください。'
        ],
        severity: 'high'
      },
      {
        id: 'auth_error',
        signature: /unauthorized|forbidden|auth.*token|permission/i,
        diagnosis: '認証または権限に関するエラーが発生しています。',
        solutions: [
          'セッションが有効か確認してください。',
          'ログインして再試行してください。',
          '必要な権限があるか確認してください。'
        ],
        severity: 'medium'
      },
      {
        id: 'data_transform_error',
        signature: /transform|convert|parse|invalid.*format/i,
        diagnosis: 'データ変換中にエラーが発生しています。',
        solutions: [
          'CSVデータのフォーマットを確認してください。',
          '日付や数値の形式が正しいか確認してください。',
          '特殊文字やエスケープが適切に処理されているか確認してください。'
        ],
        severity: 'medium'
      },
      {
        id: 'year_state_error',
        signature: /year.*state|fiscal.*year.*error|invalid.*year/i,
        diagnosis: '年度状態の管理に問題があります。',
        solutions: [
          'YearStateManager.jsが正しく統合されているか確認してください。',
          'インポート前の年度が正しく記録されているか確認してください。',
          'インポート後に年度が正しく復元されているか確認してください。'
        ],
        severity: 'medium'
      }
    ];
  }
  
  /**
   * ツールを初期化
   */
  initialize() {
    if (this.initialized) return;
    
    console.log('CSV Import Error Diagnostic Tool を初期化しています...');
    
    // ストレージからエラーログを復元
    if (this.options.logToStorage) {
      this.restoreLogsFromStorage();
    }
    
    // グローバルエラーハンドラを設定
    if (this.options.captureGlobalErrors && typeof window !== 'undefined') {
      this.setupGlobalErrorHandling();
    }
    
    // Ajaxエラー監視を設定
    if (this.options.captureAjaxErrors && typeof window !== 'undefined') {
      this.setupAjaxErrorCapture();
    }
    
    // Reactエラー境界のサポートを追加
    if (this.options.captureReactErrors && typeof window !== 'undefined') {
      this.setupReactErrorCapture();
    }
    
    this.initialized = true;
    console.log('CSV Import Error Diagnostic Tool の初期化が完了しました');
  }
  
  /**
   * ストレージからエラーログを復元
   */
  restoreLogsFromStorage() {
    try {
      const storedLogs = localStorage.getItem(this.options.logStorageKey);
      if (storedLogs) {
        this.errorLogs = JSON.parse(storedLogs);
        this.stats.totalErrors = this.errorLogs.length;
        
        // カテゴリ別カウントを更新
        this.errorLogs.forEach(log => {
          if (log.category === 'ajax') this.stats.ajaxErrors++;
          else if (log.category === 'script') this.stats.scriptErrors++;
          else if (log.category === 'react') this.stats.reactErrors++;
        });
        
        console.log(`${this.errorLogs.length}件のエラーログを復元しました`);
      }
    } catch (error) {
      console.warn('エラーログの復元に失敗しました:', error);
    }
  }
  
  /**
   * エラーログをストレージに保存
   */
  saveLogsToStorage() {
    if (!this.options.logToStorage) return;
    
    try {
      // 最大件数を超える場合は古いログを削除
      const logsToSave = this.errorLogs.slice(-this.options.maxStoredLogs);
      localStorage.setItem(this.options.logStorageKey, JSON.stringify(logsToSave));
    } catch (error) {
      console.warn('エラーログの保存に失敗しました:', error);
    }
  }
  
  /**
   * グローバルエラーハンドリングを設定
   */
  setupGlobalErrorHandling() {
    const originalErrorHandler = window.onerror;
    
    window.onerror = (message, source, lineno, colno, error) => {
      this.logError({
        message: message,
        source: source,
        lineno: lineno,
        colno: colno,
        error: error,
        category: 'script',
        timestamp: new Date()
      });
      
      // 元のハンドラも呼び出す
      if (typeof originalErrorHandler === 'function') {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      
      return false;
    };
    
    // Promiseエラーの捕捉
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        error: event.reason,
        category: 'promise',
        timestamp: new Date()
      });
    });
  }
  
  /**
   * AjaxエラーキャプチャをXHRとFetchで設定
   */
  setupAjaxErrorCapture() {
    // XMLHttpRequestのインターセプト
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;
    const self = this;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._diagnosticMethod = method;
      this._diagnosticUrl = url;
      this._diagnosticStartTime = Date.now();
      return originalXhrOpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      
      xhr.addEventListener('error', function(e) {
        self.logError({
          message: `XHR Error: ${xhr._diagnosticMethod} ${xhr._diagnosticUrl}`,
          method: xhr._diagnosticMethod,
          url: xhr._diagnosticUrl,
          status: xhr.status,
          duration: Date.now() - xhr._diagnosticStartTime,
          requestBody: body,
          responseText: xhr.responseText,
          category: 'ajax',
          timestamp: new Date()
        });
      });
      
      xhr.addEventListener('load', function() {
        if (xhr.status >= 400) {
          self.logError({
            message: `XHR Error: ${xhr.status} ${xhr.statusText} - ${xhr._diagnosticMethod} ${xhr._diagnosticUrl}`,
            method: xhr._diagnosticMethod,
            url: xhr._diagnosticUrl,
            status: xhr.status,
            statusText: xhr.statusText,
            duration: Date.now() - xhr._diagnosticStartTime,
            requestBody: body,
            responseText: xhr.responseText,
            category: 'ajax',
            timestamp: new Date()
          });
        }
      });
      
      return originalXhrSend.apply(this, [body]);
    };
    
    // Fetchのインターセプト
    const originalFetch = window.fetch;
    
    window.fetch = function(input, init) {
      const startTime = Date.now();
      const method = init?.method || 'GET';
      const url = typeof input === 'string' ? input : input.url;
      
      return originalFetch.apply(this, [input, init])
        .then(response => {
          if (!response.ok) {
            // レスポンスをクローンして本文を取得（元のレスポンスストリームは消費される）
            const clonedResponse = response.clone();
            
            // レスポンス本文をテキストで取得しようと試みる
            clonedResponse.text().then(responseText => {
              self.logError({
                message: `Fetch Error: ${response.status} ${response.statusText} - ${method} ${url}`,
                method: method,
                url: url,
                status: response.status,
                statusText: response.statusText,
                duration: Date.now() - startTime,
                requestBody: init?.body,
                responseText: responseText,
                category: 'ajax',
                timestamp: new Date()
              });
            }).catch(e => {
              // レスポンス本文の取得に失敗した場合
              self.logError({
                message: `Fetch Error: ${response.status} ${response.statusText} - ${method} ${url}`,
                method: method,
                url: url,
                status: response.status,
                statusText: response.statusText,
                duration: Date.now() - startTime,
                requestBody: init?.body,
                category: 'ajax',
                timestamp: new Date()
              });
            });
          }
          return response;
        })
        .catch(error => {
          self.logError({
            message: `Fetch Error: ${error.message} - ${method} ${url}`,
            method: method,
            url: url,
            error: error,
            duration: Date.now() - startTime,
            requestBody: init?.body,
            category: 'ajax',
            timestamp: new Date()
          });
          
          throw error; // エラーを再スロー
        });
    };
  }
  
  /**
   * Reactエラーキャプチャをセットアップ
   */
  setupReactErrorCapture() {
    if (typeof window.__REACT_ERROR_OVERLAY__ !== 'undefined') {
      const originalReportBuildError = window.__REACT_ERROR_OVERLAY__.reportBuildError;
      const originalReportRuntimeError = window.__REACT_ERROR_OVERLAY__.reportRuntimeError;
      const self = this;
      
      if (typeof originalReportBuildError === 'function') {
        window.__REACT_ERROR_OVERLAY__.reportBuildError = function(error) {
          self.logError({
            message: `React Build Error: ${error.message}`,
            error: error,
            category: 'react',
            timestamp: new Date()
          });
          return originalReportBuildError(error);
        };
      }
      
      if (typeof originalReportRuntimeError === 'function') {
        window.__REACT_ERROR_OVERLAY__.reportRuntimeError = function(error) {
          self.logError({
            message: `React Runtime Error: ${error.message}`,
            error: error,
            category: 'react',
            timestamp: new Date()
          });
          return originalReportRuntimeError(error);
        };
      }
    }
  }
  
  /**
   * エラーを診断して解決策を提案
   */
  diagnoseError(error) {
    const errorString = typeof error === 'string' ? error : 
      error.message || 
      error.responseText || 
      JSON.stringify(error);
    
    // マッチするエラーパターンを検索
    const matchingPatterns = this.errorPatterns.filter(pattern => {
      return pattern.signature.test(errorString);
    });
    
    if (matchingPatterns.length === 0) {
      return {
        error: error,
        diagnosis: '不明なエラーです。詳細な診断ができません。',
        solutions: [
          'ブラウザのデベロッパーツールでエラーの詳細を確認してください。',
          'ブラウザのキャッシュをクリアしてページを再読み込みしてみてください。',
          'サーバーのログを確認してバックエンドの問題がないか確認してください。'
        ],
        confidence: 'low'
      };
    }
    
    // 最も適切なパターンを選択（複数ある場合は最初のものを使用）
    const bestMatch = matchingPatterns[0];
    
    return {
      error: error,
      patternId: bestMatch.id,
      diagnosis: bestMatch.diagnosis,
      solutions: bestMatch.solutions,
      severity: bestMatch.severity,
      confidence: matchingPatterns.length === 1 ? 'high' : 'medium'
    };
  }
  
  /**
   * エラーを記録
   */
  logError(errorData) {
    // 診断を実行
    const diagnosis = this.diagnoseError(errorData);
    
    // エラーログエントリを作成
    const logEntry = {
      ...errorData,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      diagnosis: diagnosis
    };
    
    // ログに追加
    this.errorLogs.push(logEntry);
    this.stats.totalErrors++;
    
    // カテゴリ別カウンターを更新
    if (errorData.category === 'ajax') this.stats.ajaxErrors++;
    else if (errorData.category === 'script') this.stats.scriptErrors++;
    else if (errorData.category === 'react') this.stats.reactErrors++;
    
    // コンソールに出力
    if (this.options.logToConsole) {
      console.group('CSV Import Error Detected:');
      console.error(errorData.message);
      console.info('Diagnosis:', diagnosis.diagnosis);
      console.info('Possible solutions:', diagnosis.solutions);
      if (errorData.error) console.error(errorData.error);
      console.groupEnd();
    }
    
    // ストレージに保存
    this.saveLogsToStorage();
    
    return logEntry;
  }
  
  /**
   * エラーログを取得
   */
  getLogs(filter = {}) {
    let filteredLogs = [...this.errorLogs];
    
    // フィルタリング
    if (filter.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category);
    }
    
    if (filter.severity) {
      filteredLogs = filteredLogs.filter(log => {
        return log.diagnosis?.severity === filter.severity;
      });
    }
    
    if (filter.search) {
      const searchRegex = new RegExp(filter.search, 'i');
      filteredLogs = filteredLogs.filter(log => {
        return searchRegex.test(log.message) || 
               searchRegex.test(log.url) || 
               searchRegex.test(log.responseText);
      });
    }
    
    // ソート
    if (filter.sortBy) {
      filteredLogs.sort((a, b) => {
        if (filter.sortBy === 'timestamp') {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return 0;
      });
    } else {
      // デフォルトは時間順
      filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // ページング
    if (filter.limit) {
      const start = filter.offset || 0;
      filteredLogs = filteredLogs.slice(start, start + filter.limit);
    }
    
    return filteredLogs;
  }
  
  /**
   * エラーログをクリア
   */
  clearLogs() {
    this.errorLogs = [];
    this.stats = {
      totalErrors: 0,
      ajaxErrors: 0,
      scriptErrors: 0,
      reactErrors: 0,
      diagnosticRuns: 0
    };
    
    if (this.options.logToStorage) {
      localStorage.removeItem(this.options.logStorageKey);
    }
    
    console.log('エラーログをクリアしました');
  }
  
  /**
   * 診断サマリーを生成
   */
  generateDiagnosticSummary() {
    this.stats.diagnosticRuns++;
    
    // エラーの種類ごとにカウント
    const errorsByType = {};
    const errorsBySeverity = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    this.errorLogs.forEach(log => {
      // パターンIDによるカウント
      const patternId = log.diagnosis?.patternId || 'unknown';
      errorsByType[patternId] = (errorsByType[patternId] || 0) + 1;
      
      // 重要度によるカウント
      const severity = log.diagnosis?.severity || 'low';
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1;
    });
    
    // 最も頻繁に発生しているエラーを特定
    let mostFrequentError = { id: 'none', count: 0 };
    for (const [id, count] of Object.entries(errorsByType)) {
      if (count > mostFrequentError.count) {
        mostFrequentError = { id, count };
      }
    }
    
    // 最新のエラー
    const latestError = this.errorLogs.length > 0 ? 
      this.errorLogs[this.errorLogs.length - 1] : null;
    
    // 解決策を提案
    const suggestions = [];
    
    // 最も頻繁なエラーに対する解決策
    if (mostFrequentError.id !== 'none') {
      const pattern = this.errorPatterns.find(p => p.id === mostFrequentError.id);
      if (pattern) {
        suggestions.push({
          title: `最も頻繁なエラー (${mostFrequentError.count}回): ${pattern.diagnosis}`,
          solutions: pattern.solutions
        });
      }
    }
    
    // 高重要度のエラーがある場合
    if (errorsBySeverity.high > 0) {
      const highSeverityPatterns = new Set();
      this.errorLogs.forEach(log => {
        if (log.diagnosis?.severity === 'high') {
          highSeverityPatterns.add(log.diagnosis.patternId);
        }
      });
      
      Array.from(highSeverityPatterns).forEach(patternId => {
        const pattern = this.errorPatterns.find(p => p.id === patternId);
        if (pattern) {
          suggestions.push({
            title: `高重要度のエラー: ${pattern.diagnosis}`,
            solutions: pattern.solutions
          });
        }
      });
    }
    
    // content-scriptエラーに特化した解決策
    if (errorsByType.content_script_error > 0) {
      suggestions.push({
        title: 'web-client-content-scriptエラーに対する特定の解決策:',
        solutions: [
          'CSVImportModal.tsxのコンポーネントライフサイクルを確認してください。',
          'インポートプロセス中にアンマウントされたコンポーネントの状態更新がないか確認してください。',
          'YearStateManager.jsを統合して年度の状態管理を改善してください。',
          'ImportNotificationEnhancer.jsを使用してユーザーへのフィードバックを改善してください。'
        ]
      });
    }
    
    return {
      timestamp: new Date(),
      totalErrors: this.stats.totalErrors,
      errorsByCategory: {
        ajax: this.stats.ajaxErrors,
        script: this.stats.scriptErrors,
        react: this.stats.reactErrors
      },
      errorsByType,
      errorsBySeverity,
      mostFrequentError,
      latestError,
      suggestions,
      diagnosticRuns: this.stats.diagnosticRuns
    };
  }
  
  /**
   * 診断レポートをHTMLで表示
   */
  showDiagnosticReport() {
    const summary = this.generateDiagnosticSummary();
    const timestamp = new Date(summary.timestamp).toLocaleString();
    
    const reportHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
      <h2 style="color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px;">
        CSV Import Error Diagnostic Report
      </h2>
      <p style="color: #666;">Generated at: ${timestamp}</p>
      
      <div style="background: #fff; padding: 15px; border-radius: 6px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #333; margin-top: 0;">Error Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
          <div style="padding: 10px; background: #e8f4fd; border-radius: 4px;">
            <div style="font-size: 24px; font-weight: bold; color: #0077cc;">${summary.totalErrors}</div>
            <div style="font-size: 14px; color: #666;">Total Errors</div>
          </div>
          <div style="padding: 10px; background: #fff2f0; border-radius: 4px;">
            <div style="font-size: 24px; font-weight: bold; color: #cf1322;">${summary.errorsBySeverity.high}</div>
            <div style="font-size: 14px; color: #666;">High Severity</div>
          </div>
          <div style="padding: 10px; background: #fffbe6; border-radius: 4px;">
            <div style="font-size: 24px; font-weight: bold; color: #d48806;">${summary.errorsBySeverity.medium}</div>
            <div style="font-size: 14px; color: #666;">Medium Severity</div>
          </div>
          <div style="padding: 10px; background: #f6ffed; border-radius: 4px;">
            <div style="font-size: 24px; font-weight: bold; color: #52c41a;">${summary.errorsBySeverity.low}</div>
            <div style="font-size: 14px; color: #666;">Low Severity</div>
          </div>
        </div>
      </div>
      
      <div style="background: #fff; padding: 15px; border-radius: 6px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #333; margin-top: 0;">Error Categories</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">
          <div style="padding: 10px; background: #e6f7ff; border-radius: 4px;">
            <div style="font-size: 20px; font-weight: bold; color: #1890ff;">${summary.errorsByCategory.ajax}</div>
            <div style="font-size: 14px; color: #666;">AJAX Errors</div>
          </div>
          <div style="padding: 10px; background: #e6f7ff; border-radius: 4px;">
            <div style="font-size: 20px; font-weight: bold; color: #1890ff;">${summary.errorsByCategory.script}</div>
            <div style="font-size: 14px; color: #666;">Script Errors</div>
          </div>
          <div style="padding: 10px; background: #e6f7ff; border-radius: 4px;">
            <div style="font-size: 20px; font-weight: bold; color: #1890ff;">${summary.errorsByCategory.react}</div>
            <div style="font-size: 14px; color: #666;">React Errors</div>
          </div>
        </div>
      </div>
      
      ${summary.mostFrequentError.id !== 'none' ? `
      <div style="background: #fff; padding: 15px; border-radius: 6px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #333; margin-top: 0;">Most Frequent Error</h3>
        <div style="background: #fffbe6; padding: 12px; border-radius: 4px; border-left: 4px solid #faad14;">
          <p style="margin: 0; font-weight: bold;">
            ${summary.mostFrequentError.id} (${summary.mostFrequentError.count} occurrences)
          </p>
          <p style="margin: 5px 0 0;">
            ${this.errorPatterns.find(p => p.id === summary.mostFrequentError.id)?.diagnosis || 'Unknown error'}
          </p>
        </div>
      </div>
      ` : ''}
      
      ${summary.latestError ? `
      <div style="background: #fff; padding: 15px; border-radius: 6px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #333; margin-top: 0;">Latest Error</h3>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-family: monospace; overflow-x: auto;">
          <div style="color: #cf1322; font-weight: bold;">${summary.latestError.message}</div>
          <div style="margin-top: 5px; color: #666; font-size: 12px;">
            ${new Date(summary.latestError.timestamp).toLocaleString()} | 
            Category: ${summary.latestError.category} | 
            ${summary.latestError.url ? `URL: ${summary.latestError.url}` : ''}
          </div>
        </div>
      </div>
      ` : ''}
      
      <div style="background: #fff; padding: 15px; border-radius: 6px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #333; margin-top: 0;">Recommended Solutions</h3>
        
        ${summary.suggestions.length > 0 ? summary.suggestions.map(suggestion => `
          <div style="margin-bottom: 15px;">
            <h4 style="color: #1890ff; margin: 0 0 8px;">${suggestion.title}</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${suggestion.solutions.map(solution => `
                <li style="margin-bottom: 5px;">${solution}</li>
              `).join('')}
            </ul>
          </div>
        `).join('') : `
          <p style="color: #666;">No specific solutions to suggest at this time.</p>
        `}
      </div>
      
      <div style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
        Generated by ErrorDiagnosticTool | Diagnostic runs: ${summary.diagnosticRuns}
      </div>
    </div>
    `;
    
    // レポートを表示するためのモーダルを作成
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.padding = '20px';
    
    // モーダルのコンテンツ
    const content = document.createElement('div');
    content.style.maxWidth = '90%';
    content.style.maxHeight = '90%';
    content.style.overflow = 'auto';
    content.style.borderRadius = '8px';
    content.style.backgroundColor = '#fff';
    content.innerHTML = reportHtml;
    
    // 閉じるボタン
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.padding = '8px 16px';
    closeButton.style.backgroundColor = '#f5f5f5';
    closeButton.style.border = '1px solid #ddd';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => document.body.removeChild(modal);
    
    // 要素を追加
    modal.appendChild(content);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);
    
    return summary;
  }
  
  /**
   * 最新のエラーを表示
   */
  showLatestError() {
    if (this.errorLogs.length === 0) {
      console.log('エラーログが空です');
      return null;
    }
    
    const latestError = this.errorLogs[this.errorLogs.length - 1];
    
    console.group('最新のエラー:');
    console.error(latestError.message);
    console.info('診断:', latestError.diagnosis.diagnosis);
    console.info('解決策:', latestError.diagnosis.solutions);
    console.groupEnd();
    
    return latestError;
  }
}

/**
 * CSVインポートのエラーを分析するコンポーネント用のカスタムフック
 */
export const useErrorDiagnostics = () => {
  const diagnosticToolRef = React.useRef(null);
  
  // 初期化
  React.useEffect(() => {
    if (!diagnosticToolRef.current) {
      diagnosticToolRef.current = new ErrorDiagnosticTool();
      diagnosticToolRef.current.initialize();
    }
    
    return () => {
      // クリーンアップコードが必要であれば追加
    };
  }, []);
  
  // エラーを手動でログに記録する関数
  const logError = React.useCallback((error, category = 'custom') => {
    if (diagnosticToolRef.current) {
      return diagnosticToolRef.current.logError({
        message: error.message || String(error),
        error: error,
        category: category,
        timestamp: new Date()
      });
    }
    return null;
  }, []);
  
  // 診断レポートを表示する関数
  const showDiagnosticReport = React.useCallback(() => {
    if (diagnosticToolRef.current) {
      return diagnosticToolRef.current.showDiagnosticReport();
    }
    return null;
  }, []);
  
  // エラーの診断を取得する関数
  const diagnoseError = React.useCallback((error) => {
    if (diagnosticToolRef.current) {
      return diagnosticToolRef.current.diagnoseError(error);
    }
    return null;
  }, []);
  
  // ログをクリアする関数
  const clearLogs = React.useCallback(() => {
    if (diagnosticToolRef.current) {
      diagnosticToolRef.current.clearLogs();
    }
  }, []);
  
  // 最新のエラーを表示する関数
  const showLatestError = React.useCallback(() => {
    if (diagnosticToolRef.current) {
      return diagnosticToolRef.current.showLatestError();
    }
    return null;
  }, []);
  
  return {
    logError,
    showDiagnosticReport,
    diagnoseError,
    clearLogs,
    showLatestError,
    // 直接ツールにアクセスする方法も提供（必要な場合）
    getDiagnosticTool: () => diagnosticToolRef.current
  };
};

/**
 * Reactのエラー境界コンポーネント
 * エラーをキャプチャしてErrorDiagnosticToolに記録
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.diagnosticTool = new ErrorDiagnosticTool();
    this.diagnosticTool.initialize();
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // エラーを診断ツールに記録
    this.diagnosticTool.logError({
      message: error.message,
      error: error,
      errorInfo: errorInfo,
      component: this.props.componentName || 'Unknown',
      category: 'react',
      timestamp: new Date()
    });
  }
  
  render() {
    if (this.state.hasError) {
      // エラー発生時のフォールバックUI
      return this.props.fallback || (
        <div style={{ 
          padding: '20px', 
          border: '1px solid #f5222d',
          borderRadius: '4px',
          margin: '10px 0',
          backgroundColor: '#fff2f0'
        }}>
          <h3 style={{ color: '#cf1322', margin: '0 0 10px' }}>
            コンポーネントエラーが発生しました
          </h3>
          <p style={{ margin: '0 0 10px' }}>
            {this.state.error?.message || 'エラーの詳細情報がありません'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '5px 12px',
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            再試行
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

/**
 * ブラウザ環境で直接実行された場合に診断ツールをグローバルに公開
 */
if (typeof window !== 'undefined') {
  // 既存のインスタンスがなければ新規作成
  if (!window.csvErrorDiagnostics) {
    window.csvErrorDiagnostics = new ErrorDiagnosticTool();
    window.csvErrorDiagnostics.initialize();
    
    console.log(`
    CSV Import Error Diagnostic Tool がロードされました。
    使い方:
      - window.csvErrorDiagnostics.showDiagnosticReport() - 診断レポートを表示
      - window.csvErrorDiagnostics.showLatestError() - 最新のエラーを表示
      - window.csvErrorDiagnostics.getLogs() - すべてのエラーログを取得
      - window.csvErrorDiagnostics.clearLogs() - エラーログをクリア
    `);
  }
}

export default ErrorDiagnosticTool;