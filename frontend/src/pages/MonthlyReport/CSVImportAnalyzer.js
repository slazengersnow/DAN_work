/**
 * CSVImportAnalyzer.js - 月次レポートCSVインポート処理詳細デバッグツール
 * 
 * このスクリプトは月次レポートのCSVインポート処理のデバッグを支援するための
 * ユーティリティツールです。CSVデータの処理からAPIリクエストまでの各ステップを
 * 詳細に追跡し、問題を特定するのに役立ちます。
 * 
 * 使用方法:
 * 1. このファイルをブラウザコンソールで実行するか、
 * 2. CSVImportModal.jsxに組み込んで使用します
 * 
 * 作成: 2025年5月
 */

// グローバルの設定
const ANALYZER_CONFIG = {
  enabled: true,              // 解析機能の有効化
  detailedLogging: true,      // 詳細なログ出力
  saveToLocalStorage: true,   // ローカルストレージにログを保存
  interceptAPIRequests: true, // APIリクエストをインターセプト
  logPrefix: '📊 CSV分析: '    // ログのプレフィックス
};

// ログ保存用のストレージキー
const STORAGE_KEY = 'csv_import_analysis_logs';

// 解析データを格納するグローバルオブジェクト
const analysisData = {
  sessionId: null,
  startTime: null,
  parsedData: [],
  apiRequests: [],
  errors: [],
  warnings: [],
  processingSteps: [],
  stateChanges: [],
  originalCsvContent: null
};

/**
 * CSVインポート解析マネージャークラス
 */
class CSVImportAnalyzer {
  constructor(config = {}) {
    this.config = { ...ANALYZER_CONFIG, ...config };
    this.initialized = false;
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    analysisData.sessionId = this.sessionId;
    analysisData.startTime = new Date();
  }

  /**
   * 解析機能を初期化する
   */
  initialize() {
    if (this.initialized || !this.config.enabled) return;
    
    this.log('CSVインポート解析を初期化しています');
    
    // APIインターセプターのセットアップ
    if (this.config.interceptAPIRequests) {
      this.setupAPIInterceptors();
    }
    
    this.initialized = true;
    this.addProcessingStep('initialize', 'CSVインポート解析を初期化しました');
  }

  /**
   * APIリクエストをインターセプトする設定
   */
  setupAPIInterceptors() {
    if (typeof axios !== 'undefined') {
      // リクエストインターセプター
      axios.interceptors.request.use((config) => {
        if (config.url.includes('/monthly-report') || config.url.includes('/monthly-reports')) {
          this.logAPIRequest('request', config);
        }
        return config;
      }, (error) => {
        this.logAPIRequest('request_error', error);
        return Promise.reject(error);
      });
      
      // レスポンスインターセプター
      axios.interceptors.response.use((response) => {
        if (response.config.url.includes('/monthly-report') || response.config.url.includes('/monthly-reports')) {
          this.logAPIRequest('response', response);
        }
        return response;
      }, (error) => {
        this.logAPIRequest('response_error', error);
        return Promise.reject(error);
      });
      
      this.log('APIインターセプターをセットアップしました');
    } else {
      this.logWarning('axiosが見つからないため、APIインターセプターをセットアップできません');
    }
  }

  /**
   * CSVファイルが読み込まれた時に元のコンテンツを保存
   */
  setOriginalCSVContent(content) {
    analysisData.originalCsvContent = content;
    this.addProcessingStep('csv_content', 'CSVコンテンツを記録しました', {
      size: content.length,
      preview: content.substring(0, 100) + '...'
    });
    this.log('CSVコンテンツを記録しました');
  }

  /**
   * CSVが解析された後のデータを記録
   */
  recordParsedCSVData(parsedData) {
    analysisData.parsedData = parsedData;
    this.addProcessingStep('parse_csv', 'CSVデータを解析しました', {
      rowCount: parsedData.length,
      firstRow: parsedData.length > 0 ? parsedData[0] : null
    });
  }

  /**
   * コンポーネントの状態変更を記録する
   */
  recordStateChange(component, stateName, oldValue, newValue) {
    const stateChange = {
      timestamp: new Date(),
      component,
      stateName,
      oldValue: this.safeStringify(oldValue),
      newValue: this.safeStringify(newValue)
    };
    
    analysisData.stateChanges.push(stateChange);
    
    if (this.config.detailedLogging) {
      this.log(`状態変更: ${component}.${stateName}`, { oldValue, newValue });
    }
  }

  /**
   * 処理ステップを記録する
   */
  addProcessingStep(step, description, details = {}) {
    const stepData = {
      timestamp: new Date(),
      step,
      description,
      details: this.safeStringify(details)
    };
    
    analysisData.processingSteps.push(stepData);
  }

  /**
   * APIリクエストを記録する
   */
  logAPIRequest(type, data) {
    const apiLog = {
      timestamp: new Date(),
      type,
      url: data.url || data.config?.url,
      method: data.method || data.config?.method,
      status: data.status,
      data: data.data ? this.safeStringify(data.data) : null,
      requestData: data.data ? this.safeStringify(data.data) : null,
      responseData: data.data ? this.safeStringify(data.data) : null,
      error: data.message
    };
    
    analysisData.apiRequests.push(apiLog);
    
    this.log(`APIリクエスト ${type}: ${apiLog.method} ${apiLog.url} ${apiLog.status || ''}`, data);
  }

  /**
   * エラーを記録する
   */
  logError(source, message, error) {
    const errorData = {
      timestamp: new Date(),
      source,
      message,
      error: error ? (error.message || String(error)) : null,
      stack: error?.stack
    };
    
    analysisData.errors.push(errorData);
    console.error(`${this.config.logPrefix}エラー [${source}]: ${message}`, error);
  }

  /**
   * 警告を記録する
   */
  logWarning(message, details = {}) {
    const warningData = {
      timestamp: new Date(),
      message,
      details: this.safeStringify(details)
    };
    
    analysisData.warnings.push(warningData);
    console.warn(`${this.config.logPrefix}警告: ${message}`, details);
  }

  /**
   * ログを記録する
   */
  log(message, data = null) {
    if (!this.config.enabled) return;
    
    if (data) {
      console.log(`${this.config.logPrefix}${message}`, data);
    } else {
      console.log(`${this.config.logPrefix}${message}`);
    }
  }

  /**
   * 分析結果を保存する
   */
  saveAnalysis() {
    if (!this.config.saveToLocalStorage || !this.config.enabled) return;
    
    try {
      // 既存のログを取得
      let existingLogs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      
      // 最大5セッションまで保存
      if (existingLogs.length >= 5) {
        existingLogs = existingLogs.slice(-4);
      }
      
      // 現在のセッションを追加
      existingLogs.push({
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        data: analysisData
      });
      
      // ストレージに保存
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingLogs));
      
      this.log('分析データをローカルストレージに保存しました');
    } catch (error) {
      console.error('分析データの保存中にエラーが発生しました:', error);
    }
  }

  /**
   * 保存されたすべての分析セッションを取得する
   */
  static getStoredAnalyses() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
      console.error('保存された分析の取得中にエラーが発生しました:', error);
      return [];
    }
  }

  /**
   * 保存された特定のセッションの分析結果を取得する
   */
  static getAnalysisSession(sessionId) {
    const allSessions = CSVImportAnalyzer.getStoredAnalyses();
    return allSessions.find(session => session.sessionId === sessionId);
  }

  /**
   * 保存されたすべての分析セッションをクリアする
   */
  static clearStoredAnalyses() {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  }

  /**
   * オブジェクトを安全にJSON文字列化する（循環参照対応）
   */
  safeStringify(obj) {
    if (!obj) return null;
    
    try {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch (error) {
      return `[Unstringifiable: ${error.message}]`;
    }
  }

  /**
   * 分析結果のサマリーを取得する
   */
  getAnalysisSummary() {
    return {
      sessionId: this.sessionId,
      startTime: analysisData.startTime,
      endTime: new Date(),
      duration: new Date() - analysisData.startTime,
      parsedRows: analysisData.parsedData.length,
      apiRequests: analysisData.apiRequests.length,
      errors: analysisData.errors.length,
      warnings: analysisData.warnings.length,
      processingSteps: analysisData.processingSteps.length
    };
  }

  /**
   * 完全な分析データをコンソールに表示する
   */
  printFullAnalysis() {
    console.group(`${this.config.logPrefix}CSVインポート解析レポート`);
    console.log('セッションID:', this.sessionId);
    console.log('開始時間:', analysisData.startTime);
    console.log('実行時間:', `${(new Date() - analysisData.startTime) / 1000}秒`);
    
    console.group('処理ステップ');
    analysisData.processingSteps.forEach((step, i) => {
      console.log(`${i + 1}. [${new Date(step.timestamp).toLocaleTimeString()}] ${step.step}: ${step.description}`);
    });
    console.groupEnd();
    
    console.group('APIリクエスト');
    analysisData.apiRequests.forEach((req, i) => {
      console.log(`${i + 1}. [${new Date(req.timestamp).toLocaleTimeString()}] ${req.type}: ${req.method} ${req.url} ${req.status || ''}`);
    });
    console.groupEnd();
    
    console.group('エラー');
    if (analysisData.errors.length === 0) {
      console.log('エラーはありません');
    } else {
      analysisData.errors.forEach((err, i) => {
        console.log(`${i + 1}. [${new Date(err.timestamp).toLocaleTimeString()}] ${err.source}: ${err.message}`);
      });
    }
    console.groupEnd();
    
    console.group('警告');
    if (analysisData.warnings.length === 0) {
      console.log('警告はありません');
    } else {
      analysisData.warnings.forEach((warn, i) => {
        console.log(`${i + 1}. [${new Date(warn.timestamp).toLocaleTimeString()}] ${warn.message}`);
      });
    }
    console.groupEnd();
    
    console.groupEnd();
  }
}

/**
 * CSVImportModalおよびその他のコンポーネントを拡張する
 * ヘルパー関数とモンキーパッチ
 */
function enhanceCSVImportComponents() {
  // グローバルアナライザーインスタンスの作成
  window.csvAnalyzer = new CSVImportAnalyzer();
  window.csvAnalyzer.initialize();
  
  console.log('CSV Import Analyzer がロードされました。window.csvAnalyzer でアクセスできます。');
  
  // 使用方法の表示
  console.log(`
  === CSVインポート解析ツールの使用方法 ===
  
  1. CSVインポートを実行してください
  2. 解析結果を表示するには:
     window.csvAnalyzer.printFullAnalysis()
  
  3. 解析結果を保存するには:
     window.csvAnalyzer.saveAnalysis()
  
  4. 過去の解析結果を表示するには:
     CSVImportAnalyzer.getStoredAnalyses()
  
  5. 特定のセッションの詳細を取得するには:
     CSVImportAnalyzer.getAnalysisSession('セッションID')
  
  6. すべての保存された解析をクリアするには:
     CSVImportAnalyzer.clearStoredAnalyses()
  `);
}

// ブラウザ環境で実行された場合にコンポーネント拡張を行う
if (typeof window !== 'undefined') {
  enhanceCSVImportComponents();
}

// Node.js環境でのエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CSVImportAnalyzer,
    enhanceCSVImportComponents
  };
}