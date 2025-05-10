/**
 * デバッグログユーティリティ - CSVインポート機能向け
 * localStorage.debug_mode = 'true' が設定されている場合のみログを出力
 */

// デバッグモードの状態をチェック
const isDebugMode = (): boolean => {
  try {
    return localStorage.getItem('debug_mode') === 'true';
  } catch (error) {
    return false;
  }
};

// デバッグモードの設定
export const setDebugMode = (enabled: boolean): void => {
  try {
    localStorage.setItem('debug_mode', enabled ? 'true' : 'false');
  } catch (error) {
    console.warn('デバッグモードの設定に失敗しました', error);
  }
};

// デバッグモードの取得
export const getDebugMode = (): boolean => {
  return isDebugMode();
};

// デバッグモードの切り替え
export const toggleDebugMode = (): boolean => {
  const current = isDebugMode();
  setDebugMode(!current);
  return !current;
};

// インフォメーションログ
export const logInfo = (message: string, ...args: any[]): void => {
  if (isDebugMode()) {
    console.info(`[CSV INFO] ${message}`, ...args);
  }
};

// デバッグログ
export const logDebug = (message: string, ...args: any[]): void => {
  if (isDebugMode()) {
    console.log(`[CSV DEBUG] ${message}`, ...args);
  }
};

// 警告ログ
export const logWarning = (message: string, ...args: any[]): void => {
  if (isDebugMode()) {
    console.warn(`[CSV WARNING] ${message}`, ...args);
  }
};

// エラーログ
export const logError = (message: string, ...args: any[]): void => {
  if (isDebugMode()) {
    console.error(`[CSV ERROR] ${message}`, ...args);
  }
};

// パフォーマンス計測開始
export const startPerformanceTimer = (label: string): void => {
  if (isDebugMode()) {
    console.time(`[CSV PERF] ${label}`);
  }
};

// パフォーマンス計測終了
export const endPerformanceTimer = (label: string): void => {
  if (isDebugMode()) {
    console.timeEnd(`[CSV PERF] ${label}`);
  }
};

// オブジェクトの内容をログ出力
export const logObject = (label: string, obj: any): void => {
  if (isDebugMode()) {
    console.groupCollapsed(`[CSV OBJECT] ${label}`);
    console.dir(obj);
    console.groupEnd();
  }
};

export default {
  logInfo,
  logDebug,
  logWarning,
  logError,
  startPerformanceTimer,
  endPerformanceTimer,
  logObject,
  getDebugMode,
  setDebugMode,
  toggleDebugMode
};