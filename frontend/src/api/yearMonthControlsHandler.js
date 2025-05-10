/**
 * 年度・月選択コントロールの表示/非表示を制御するハンドラ
 * 
 * このスクリプトは以下の機能を提供します：
 * - APIレスポンスに含まれる表示設定をチェック
 * - 表示設定に基づいてコントロールの表示/非表示を切り替え
 * - グローバル状態としての表示設定の保持
 */

import './yearMonthControls.css';
import React from 'react';

// 表示設定のグローバル状態
let showYearMonthControls = false;

/**
 * APIレスポンスヘッダーから表示設定を取得
 * 
 * @param {Response} response - APIレスポンス
 * @returns {boolean} 表示設定（trueなら表示、falseなら非表示）
 */
export const checkControlVisibilityFromHeader = (response) => {
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
 * @param {Object} data - APIレスポンスデータ
 * @returns {boolean} 表示設定（trueなら表示、falseなら非表示）
 */
export const checkControlVisibilityFromData = (data) => {
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
 * @param {Object} settings - 設定データ
 * @returns {boolean} 表示設定（trueなら表示、falseなら非表示）
 */
export const checkControlVisibilityFromSettings = (settings) => {
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
 * @returns {boolean} 表示設定（trueなら表示、falseなら非表示）
 */
export const shouldShowYearMonthControls = () => {
  return showYearMonthControls;
};

/**
 * 表示設定を強制的に設定（主にデバッグ用）
 * 
 * @param {boolean} value - 表示設定（trueなら表示、falseなら非表示）
 */
export const setShowYearMonthControls = (value) => {
  showYearMonthControls = !!value;
  console.log(`年度・月選択コントロール表示設定を手動で変更: ${showYearMonthControls}`);
  return showYearMonthControls;
};

// CSSクラスを動的に管理するための関数
export const getYearMonthControlClass = () => {
  return showYearMonthControls ? 'year-month-controls-visible' : 'year-month-controls-hidden';
};

// スタイルを動的に生成するための関数
export const getYearMonthControlStyle = () => {
  // 表示設定に基づいて適切なスタイルを返す
  if (showYearMonthControls) {
    // 表示する場合は空のオブジェクトを返す
    return {};
  } else {
    // 非表示にする場合は非表示スタイルを返す
    return {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0
    };
  }
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