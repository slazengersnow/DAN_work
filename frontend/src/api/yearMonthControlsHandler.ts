/**
 * 年度・月選択コントロールの表示/非表示を制御するハンドラ
 * 
 * このスクリプトは以下の機能を提供します：
 * - APIレスポンスに含まれる表示設定をチェック
 * - 表示設定に基づいてコントロールの表示/非表示を切り替え
 * - グローバル状態としての表示設定の保持
 */

import './yearMonthControls.css';
import { CSSProperties } from 'react';

// 表示設定のグローバル状態
let showYearMonthControls = false;

// 非表示スタイルの型安全な定義
const hiddenStyle: CSSProperties = {
  display: 'none',
  visibility: 'hidden' as 'hidden',
  height: 0,
  overflow: 'hidden' as 'hidden',
  margin: 0,
  padding: 0
};

// 空のスタイル
const emptyStyle: CSSProperties = {};

/**
 * APIレスポンスヘッダーから表示設定を取得
 * 
 * @param response - APIレスポンス
 * @returns 表示設定（trueなら表示、falseなら非表示）
 */
export const checkControlVisibilityFromHeader = (response: Response): boolean => {
  // レスポンスヘッダーからフラグを取得
  if (response && response.headers) {
    const visibilityHeader = response.headers.get('X-Show-Year-Month-Controls');
    
    if (visibilityHeader !== null) {
      // ヘッダー値を解析（"true" or "false"）
      showYearMonthControls = visibilityHeader === 'true';
      console.log(`年度・月選択コントロール表示設定を更新: ${showYearMonthControls}`);
      return showYearMonthControls;
    }
  }
  
  // ヘッダーがない場合は現在の設定を維持
  return showYearMonthControls;
};

/**
 * APIレスポンスデータから表示設定を取得
 * 
 * @param data - APIレスポンスデータ
 * @returns 表示設定（trueなら表示、falseなら非表示）
 */
export const checkControlVisibilityFromData = (data: any): boolean => {
  // レスポンスデータから表示設定を取得
  if (data && typeof data.showYearMonthControls !== 'undefined') {
    showYearMonthControls = !!data.showYearMonthControls;
    console.log(`データから年度・月選択コントロール表示設定を更新: ${showYearMonthControls}`);
    return showYearMonthControls;
  }
  
  // 設定データがない場合は現在の設定を維持
  return showYearMonthControls;
};

/**
 * 設定データから表示設定を取得
 * 
 * @param settings - 設定データ
 * @returns 表示設定（trueなら表示、falseなら非表示）
 */
export const checkControlVisibilityFromSettings = (settings: any): boolean => {
  // 設定データから表示設定を取得
  if (settings && settings.ui && typeof settings.ui.showYearMonthControls !== 'undefined') {
    showYearMonthControls = !!settings.ui.showYearMonthControls;
    console.log(`設定から年度・月選択コントロール表示設定を更新: ${showYearMonthControls}`);
    return showYearMonthControls;
  }
  
  // 設定データがない場合は現在の設定を維持
  return showYearMonthControls;
};

/**
 * 現在の表示設定を取得
 * 
 * @returns 表示設定（trueなら表示、falseなら非表示）
 */
export const shouldShowYearMonthControls = (): boolean => {
  return showYearMonthControls;
};

/**
 * 表示設定を強制的に設定（主にデバッグ用）
 * 
 * @param value - 表示設定（trueなら表示、falseなら非表示）
 * @returns 設定後の表示設定値
 */
export const setShowYearMonthControls = (value: boolean): boolean => {
  showYearMonthControls = !!value;
  console.log(`年度・月選択コントロール表示設定を手動で変更: ${showYearMonthControls}`);
  return showYearMonthControls;
};

/**
 * CSSクラスを動的に管理するための関数
 * 
 * @returns 表示/非表示に対応するCSSクラス名
 */
export const getYearMonthControlClass = (): string => {
  return showYearMonthControls ? 'year-month-controls-visible' : 'year-month-controls-hidden';
};

/**
 * スタイルを動的に生成するための関数
 * 
 * @returns 表示/非表示に対応するCSSプロパティオブジェクト
 */
export const getYearMonthControlStyle = (): CSSProperties => {
  return showYearMonthControls ? emptyStyle : hiddenStyle;
};

export default {
  checkControlVisibilityFromHeader,
  checkControlVisibilityFromData,
  checkControlVisibilityFromSettings,
  shouldShowYearMonthControls,
  setShowYearMonthControls,
  getYearMonthControlClass,
  getYearMonthControlStyle
};