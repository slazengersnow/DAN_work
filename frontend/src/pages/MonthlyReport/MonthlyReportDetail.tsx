// src/pages/MonthlyReport/MonthlyReportDetail.tsx
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonthlyDetailData, MonthlyTotal } from './types';
import { updateDetailCell, handleApiError } from '../../api/reportApi';
import { YearMonthContext } from './YearMonthContext';
import { useYearMonth } from './YearMonthContext';  // カスタムフックを使用


interface MonthlyReportDetailProps {
  // タブ内に埋め込む場合に必要なprops
  monthlyDetailData?: MonthlyDetailData;
  onDetailCellChange?: (rowId: number, colIndex: number, value: string) => void;
  summaryData?: MonthlyTotal;
  isEmbedded?: boolean;
  onRefreshData?: () => void; // データ更新後にリフレッシュを親コンポーネントに通知
}

const MonthlyReportDetail: React.FC<MonthlyReportDetailProps> = (props) => {
    console.log('MonthlyReportDetail.tsx loaded at:', new Date().toISOString());
    const { monthlyDetailData, onDetailCellChange, summaryData, isEmbedded, onRefreshData } = props;
          
    // Debug logs
    console.log('MonthlyReportDetail props:', {
      isEmbedded,
      hasSummaryData: !!summaryData,
      hasMonthlyDetailData: !!monthlyDetailData,
      detailDataItemCount: monthlyDetailData?.data?.length
    });
    
    // 年月コンテキストから現在の年月を取得（カスタムフックを使用）
    const { fiscalYear, month } = useYearMonth();

    // 年月コンテキストから現在の年月を取得
    const yearMonthContext = useContext(YearMonthContext);
    // contextの実際のプロパティ名を使用
    const year = yearMonthContext.fiscalYear; // YearMonthContextの実際のプロパティに合わせて修正
    
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    // 編集モード状態
    const [isEditing, setIsEditing] = useState<boolean>(false);
    console.log("MonthlyReportDetail コンポーネントがマウントされました。isEditing初期値:", false);
    
    // ローディング状態
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // エラーメッセージ状態
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 初期データ（独立ページモードで使用）
    const initialData: MonthlyDetailData = {
      months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
      data: [
        { id: 1, item: '従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 690, 7822] },
        { id: 2, item: 'フルタイム従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 690, 7822] },
        { id: 3, item: 'パートタイム従業員数', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { 
          id: 4, 
          item: 'トータル従業員数', 
          values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 690, 7822],
          isCalculated: true 
        },
        { id: 5, item: 'Level 1 & 2', values: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 24] },
        { id: 6, item: 'その他', values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 33] },
        { id: 7, item: 'Level 1 & 2 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 8, item: 'その他 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { 
          id: 9, 
          item: 'トータル障がい者数', 
          values: [4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 57],
          isCalculated: true
        },
        { 
          id: 10, 
          item: '実雇用率', 
          values: [0.67, 0.66, 0.63, 0.78, 0.77, 0.77, 0.76, 0.75, 0.75, 0.75, 0.74, 0.72, 0.73], 
          suffix: '%', 
          isRatio: true, 
          isCalculated: true 
        },
        { 
          id: 11, 
          item: '法定雇用率', 
          values: [2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3], 
          suffix: '%', 
          isRatio: true 
        },
        { 
          id: 12, 
          item: '法定雇用者数', 
          values: [13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 15, 15, 172], 
          isCalculated: true 
        },
        { 
          id: 13, 
          item: '超過・未達', 
          values: [-9, -9, -10, -9, -9, -9, -10, -10, -10, -10, -10, -10, -115], 
          isNegative: true, 
          isCalculated: true 
        }
      ]
    };
  
    // 年度表示用（独立ページモードで使用）
    const [displayFiscalYear, setDisplayFiscalYear] = useState<string>('2024年度');
    
    // セル編集用の状態
    const [activeCell, setActiveCell] = useState<{row: number | null, col: number | null}>({row: null, col: null});
    const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
    const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);
  
    // ローカルデータ（埋め込みモードではpropsから、独立モードでは初期データから）
    const [localData, setLocalData] = useState<MonthlyDetailData>(
      isEmbedded && monthlyDetailData ? monthlyDetailData : initialData
    );
    
    // 入力参照用
    const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
    const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
      if (element) {
        inputRefs.current[key] = element;
      }
    }, []);

    // IDが与えられている場合、そこから年度を取得
    useEffect(() => {
      if (id && id.includes('-')) {
        const [year] = id.split('-');
        if (!isNaN(Number(year))) {
          setDisplayFiscalYear(`${year}年度`);
        }
      }
    }, [id]);

    // props変更に応じてローカルデータを更新
    useEffect(() => {
      if (isEmbedded && monthlyDetailData) {
        setLocalData(monthlyDetailData);
      }
    }, [monthlyDetailData, isEmbedded]);

    // 親から渡されるデータのデバッグ
    useEffect(() => {
      if (monthlyDetailData) {
        console.log("親から渡されたデータ:", monthlyDetailData.data.map(row => ({ id: row.id, item: row.item })));
      }
    }, [monthlyDetailData]);

    // 現在表示されているデータの確認
    useEffect(() => {
      console.log("表示されているデータ:", localData.data.map(row => ({ id: row.id, item: row.item })));
    }, [localData.data]);

    // 自動計算対象のフィールドかをチェック
  const isCalculatedField = (rowId: number): boolean => {
    const row = localData.data.find(r => r.id === rowId);
    return row?.isCalculated || false;
  };

  // 法定雇用率フィールドかをチェック
  const isLegalRateField = (rowId: number): boolean => {
    return rowId === 11;
  };

  // 編集モード切り替え
  const toggleEditMode = () => {
    console.log('編集モード切り替え: 現在の状態 =', isEditing, ' → 新しい状態 =', !isEditing); 
    setIsEditing(prevState => !prevState);
  };
  
  // 戻るボタンのハンドラー
  const handleBack = () => {
    navigate('/monthly-report?tab=monthly');
  };

  // CSVエクスポート
  const exportToCSV = (): void => {
    alert('CSVエクスポート機能はまだ実装されていません');
  };

  // 印刷
  const handlePrint = (): void => {
    window.print();
  };

  // 保存ボタンのハンドラー
  const handleSave = async () => {
    console.log('保存ボタンクリック'); 
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // 埋め込みモードの場合、親コンポーネントに変更を通知
      if (isEmbedded && onDetailCellChange) {
        // 変更されたセルをAPIに送信
        const updatePromises = localData.data.map(async (row) => {
          // 自動計算フィールドでなければ更新
          if (!isCalculatedField(row.id)) {
            // 各月の値を更新
            for (let colIndex = 0; colIndex < 12; colIndex++) {
              // APIを呼び出して更新
              await updateDetailCell(
                year,
                month,
                row.id,
                colIndex.toString(),  // 数値を文字列に変換
                row.values[colIndex].toString()
              );
              
              // 親コンポーネントにも変更を通知（ローカル更新用）
              onDetailCellChange(row.id, colIndex, row.values[colIndex].toString());
            }
          }
        });
        
        await Promise.all(updatePromises);
      } else {
        // 独立モードの場合、ここでAPI呼び出しを行う
        // 例: api.saveMonthlyDetail(localData);
      }
      
      // データ更新後に親コンポーネントに通知
      if (onRefreshData) {
        onRefreshData();
      }
      
      setIsEditing(false);
      alert('データを保存しました');
    } catch (error) {
      console.error('月次詳細データ保存エラー:', error);
      setErrorMessage(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  // セルクリック時のハンドラー
  const handleCellClick = (rowId: number, colIndex: number) => {
    if (colIndex >= 12) return; // 合計列はクリック不可
    if (!isEditing) return; // 編集モード時のみ処理
    
    setActiveCell({row: rowId, col: colIndex});
    
    if (!isCalculatedField(rowId)) {
      handleDetailCellEdit(rowId, colIndex);
    }
  };

  // セル編集開始ハンドラー
  const handleDetailCellEdit = (rowId: number, colIndex: number) => {
    if (isCalculatedField(rowId)) return; // 自動計算フィールドは編集不可
    if (!isEditing) return; // 編集モード時のみ処理
    
    setEditingDetailRow(rowId);
    setEditingDetailCol(colIndex);
    
    // 遅延してフォーカスを設定
    setTimeout(() => {
      const inputKey = `input-${rowId}-${colIndex}`;
      if (inputRefs.current[inputKey]) {
        inputRefs.current[inputKey]?.focus();
      }
    }, 10);
  };

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent, rowId: number, colIndex: number) => {
    if (isCalculatedField(rowId)) return; // 自動計算フィールドは編集不可
    
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDetailCellSave();
      
      // 次の編集可能なセルを探して移動
      const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
      let nextRowId = null;
      
      for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
        if (!isCalculatedField(localData.data[i].id)) {
          nextRowId = localData.data[i].id;
          break;
        }
      }
      
      if (nextRowId !== null) {
        handleDetailCellEdit(nextRowId, colIndex);
      }
    }
    else if (e.key === 'Tab') {
      e.preventDefault();
      handleDetailCellSave();
      
      // Tab + Shift キーでの移動
      if (e.shiftKey) {
        if (colIndex > 0) {
          handleDetailCellEdit(rowId, colIndex - 1);
        } else {
          const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex > 0) {
            let prevRowId = null;
            for (let i = currentRowIndex - 1; i >= 0; i--) {
              if (!isCalculatedField(localData.data[i].id)) {
                prevRowId = localData.data[i].id;
                break;
              }
            }
            if (prevRowId !== null) {
              handleDetailCellEdit(prevRowId, 11);
            }
          }
        }
      } else {
        if (colIndex < 11) {
          handleDetailCellEdit(rowId, colIndex + 1);
        } else {
          const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex < localData.data.length - 1) {
            let nextRowId = null;
            for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
              if (!isCalculatedField(localData.data[i].id)) {
                nextRowId = localData.data[i].id;
                break;
              }
            }
            if (nextRowId !== null) {
              handleDetailCellEdit(nextRowId, 0);
            }
          }
        }
      }
    }
    // 矢印キーでの移動
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleDetailCellSave();
      
      const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
      
      if (e.key === 'ArrowUp' && currentRowIndex > 0) {
        let prevRowId = null;
        for (let i = currentRowIndex - 1; i >= 0; i--) {
          if (!isCalculatedField(localData.data[i].id)) {
            prevRowId = localData.data[i].id;
            break;
          }
        }
        if (prevRowId !== null) {
          handleDetailCellEdit(prevRowId, colIndex);
        }
      }
      else if (e.key === 'ArrowDown' && currentRowIndex < localData.data.length - 1) {
        let nextRowId = null;
        for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
          if (!isCalculatedField(localData.data[i].id)) {
            nextRowId = localData.data[i].id;
            break;
          }
        }
        if (nextRowId !== null) {
          handleDetailCellEdit(nextRowId, colIndex);
        }
      }
      else if (e.key === 'ArrowLeft' && colIndex > 0) {
        handleDetailCellEdit(rowId, colIndex - 1);
      }
      else if (e.key === 'ArrowRight' && colIndex < 11) {
        handleDetailCellEdit(rowId, colIndex + 1);
      }
    }
  };

  // セル編集の完了
  const handleDetailCellSave = () => {
    setEditingDetailRow(null);
    setEditingDetailCol(null);
  };

  // セル値変更のハンドラー
  const handleLocalCellChange = (rowId: number, colIndex: number, value: string) => {
    console.log(`セル値変更: rowId=${rowId}, colIndex=${colIndex}, value=${value}`); // デバッグ用
    
    // 値の検証
    const numValue = value === '' ? 0 : Number(value);
    if (isNaN(numValue)) return;
    
    // ローカルデータの更新
    setLocalData(prevData => {
      const newData = {...prevData};
      const rowIndex = newData.data.findIndex(row => row.id === rowId);
      
      if (rowIndex !== -1 && colIndex < 12) {
        const updatedValues = [...newData.data[rowIndex].values];
        updatedValues[colIndex] = numValue;
        
        // 法定雇用率の場合、全ての月に同じ値を設定
        if (isLegalRateField(rowId)) {
          for (let i = 0; i < 12; i++) {
            updatedValues[i] = numValue;
          }
        }
        
        // 合計の再計算
        updatedValues[12] = updatedValues.slice(0, 12).reduce((a, b) => a + b, 0);
        
        newData.data[rowIndex].values = updatedValues;
        
        // 自動計算を実行
        return recalculateData(newData);
      }
      
      return newData;
    });
    
    // 埋め込みモードの場合、親コンポーネントにも変更を通知
    if (isEmbedded && onDetailCellChange) {
      onDetailCellChange(rowId, colIndex, value);
    }
  };

  // 自動計算を行う
  const recalculateData = (data: MonthlyDetailData): MonthlyDetailData => {
    const newData = {...data};
    
    // フルタイム従業員数の行
    const fullTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 2);
    // パートタイム従業員数の行
    const partTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 3);
    // トータル従業員数の行
    const totalEmployeesRowIndex = newData.data.findIndex(row => row.id === 4);
    
    // Level 1 & 2 の行
    const level1And2RowIndex = newData.data.findIndex(row => row.id === 5);
    // その他の行
    const otherRowIndex = newData.data.findIndex(row => row.id === 6);
    // Level 1 & 2 (パートタイム)の行
    const level1And2PartTimeRowIndex = newData.data.findIndex(row => row.id === 7);
    // その他 (パートタイム)の行
    const otherPartTimeRowIndex = newData.data.findIndex(row => row.id === 8);
    // トータル障がい者数の行
    const totalDisabledRowIndex = newData.data.findIndex(row => row.id === 9);
    
    // 法定雇用率の行
    const legalRateRowIndex = newData.data.findIndex(row => row.id === 11);
    
    // トータル従業員数の計算（フルタイム + パートタイム×0.5）
    if (fullTimeEmployeesRowIndex !== -1 && partTimeEmployeesRowIndex !== -1 && totalEmployeesRowIndex !== -1) {
      const fullTimeValues = newData.data[fullTimeEmployeesRowIndex].values;
      const partTimeValues = newData.data[partTimeEmployeesRowIndex].values;
      
      for (let i = 0; i < 13; i++) {
        if (i < 12) {
          // 各月のデータを計算
          newData.data[totalEmployeesRowIndex].values[i] = 
            fullTimeValues[i] + (partTimeValues[i] * 0.5);
        } else {
          // 合計値は各月の合計として再計算
          newData.data[totalEmployeesRowIndex].values[i] = 
            newData.data[totalEmployeesRowIndex].values.slice(0, 12).reduce((a, b) => a + b, 0);
        }
      }
    }
    
    // トータル障がい者数の計算（各障がい者カテゴリの合計）
    if (level1And2RowIndex !== -1 && otherRowIndex !== -1 && 
        level1And2PartTimeRowIndex !== -1 && otherPartTimeRowIndex !== -1 && 
        totalDisabledRowIndex !== -1) {
        
      const level1And2Values = newData.data[level1And2RowIndex].values;
      const otherValues = newData.data[otherRowIndex].values;
      const level1And2PartTimeValues = newData.data[level1And2PartTimeRowIndex].values;
      const otherPartTimeValues = newData.data[otherPartTimeRowIndex].values;
      
      for (let i = 0; i < 13; i++) {
        // 各月または合計の障がい者数を計算
        newData.data[totalDisabledRowIndex].values[i] = 
          level1And2Values[i] + otherValues[i] + 
          level1And2PartTimeValues[i] + otherPartTimeValues[i];
      }
    }
    
    if (totalEmployeesRowIndex !== -1 && totalDisabledRowIndex !== -1 && legalRateRowIndex !== -1) {
      const totalEmployeeValues = newData.data[totalEmployeesRowIndex].values;
      const totalDisabledValues = newData.data[totalDisabledRowIndex].values;
      const legalRateValues = newData.data[legalRateRowIndex].values;
      
      // 実雇用率の計算 (障がい者数/従業員数 * 100)
      const actualRateRowIndex = newData.data.findIndex(row => row.id === 10);
      if (actualRateRowIndex !== -1) {
        for (let i = 0; i < 13; i++) {
          if (totalEmployeeValues[i] > 0) {
            newData.data[actualRateRowIndex].values[i] = 
              Number(((totalDisabledValues[i] / totalEmployeeValues[i]) * 100).toFixed(2));
          } else {
            newData.data[actualRateRowIndex].values[i] = 0;
          }
        }
      }
      
      // 法定雇用者数の計算 (法定雇用率 * 従業員数 / 100)
      const legalCountRowIndex = newData.data.findIndex(row => row.id === 12);
      if (legalCountRowIndex !== -1) {
        for (let i = 0; i < 13; i++) {
          if (i < 12) {
            // 各月の法定雇用者数を計算（小数点以下切り捨て）
            newData.data[legalCountRowIndex].values[i] = 
              Math.floor((legalRateValues[i] * totalEmployeeValues[i]) / 100);
          } else {
            // 合計は各月の合計として再計算
            newData.data[legalCountRowIndex].values[i] = 
              newData.data[legalCountRowIndex].values.slice(0, 12).reduce((a, b) => a + b, 0);
          }
        }
      }
      
      // 超過・未達の計算 (障がい者数 - 法定雇用者数)
      const overUnderRowIndex = newData.data.findIndex(row => row.id === 13);
      if (overUnderRowIndex !== -1 && legalCountRowIndex !== -1) {
        const legalCountValues = newData.data[legalCountRowIndex].values;
        for (let i = 0; i < 13; i++) {
          newData.data[overUnderRowIndex].values[i] = 
            totalDisabledValues[i] - legalCountValues[i];
        }
      }
    }
    
    return newData;
  };

  // スタイル定義
  const cellStyle = {
    width: '100%',
    height: '22px',
    border: 'none',
    textAlign: 'center' as const,
    background: 'transparent',
    fontSize: '12px',
    padding: '0'
  };

  const readonlyCellStyle = {
    ...cellStyle,
    backgroundColor: '#f8f9fa'
  };

  // ステータスの取得（埋め込みモードではpropsから、独立モードでは固定値）
  const currentStatus = isEmbedded && summaryData?.status ? summaryData.status : '未確定';
  let isConfirmed = currentStatus === '確定済';
  console.log('元のisConfirmed:', isConfirmed);
  // 強制的にfalseに設定
  isConfirmed = false;

  // エラーメッセージ要素を事前に作成（TypeScriptエラー回避のため）
  const errorMessageElement = errorMessage ? (
    <div style={{ 
      backgroundColor: '#f8d7da', 
      color: '#721c24', 
      padding: '10px', 
      borderRadius: '4px', 
      marginBottom: '15px' 
    }}>
      {errorMessage}
    </div>
  ) : null;

  // ローディングインジケーター要素を事前に作成
  const loadingElement = isLoading ? (
    <div style={{ 
      backgroundColor: '#e9ecef', 
      padding: '10px', 
      borderRadius: '4px', 
      marginBottom: '15px',
      textAlign: 'center'
    }}>
      データを処理中...
    </div>
  ) : null;

  return (
    <div className="monthly-report-detail" style={{ padding: isEmbedded ? '0' : '20px' }}>
      {/* 独立ページモードの場合のみ表示 */}
      {!isEmbedded && (
        <>
          <button 
            onClick={handleBack}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
          >
            ← 月次報告一覧に戻る
          </button>
          
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>月次報告詳細</h1>
          
          <div style={{ 
            backgroundColor: '#f0f8ff', 
            padding: '15px', 
            borderRadius: '4px', 
            marginBottom: '20px' 
          }}>
            <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '10px' }}>{displayFiscalYear}集計サマリー</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              <span>常用労働者数: 525名</span>
              <span>|</span>
              <span>障害者数: 5名</span>
              <span>|</span>
              <span>雇用カウント: 5</span>
              <span>|</span>
              <span>実雇用率: 2.43%</span>
              <span>|</span>
              <span>法定雇用率: 2.3%</span>
            </div>
          </div>
        </>
      )}

      {/* エラーメッセージ表示エリア */}
      {errorMessageElement}
        
      {/* ローディングインジケーター */}
      {loadingElement}

      {/* アクションボタン */}
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
        {/* 編集ボタンと保存ボタンを横に並べる */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button"
            id="editButton"
            onClick={() => {
              // 直接状態を強制的に変更
              const newEditingState = !isEditing;
              console.log(`編集状態を強制的に${newEditingState ? '有効' : '無効'}にします`);
              setIsEditing(newEditingState);
              // デバッグ用の遅延処理
              setTimeout(() => {
                console.log('現在の編集状態:', isEditing);
              }, 100);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={isLoading}
          >
            {isEditing ? '編集中止' : '編集'}
          </button>
          
          {/* 強制的に保存ボタンを表示 */}
          {isEditing && (
            <button 
              type="button"
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3a66d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          )}
        </div>
        
        {/* 独立モードの場合のみ印刷とCSVエクスポートボタンを表示 */}
        {!isEmbedded && (
          <div style={{ marginLeft: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              印刷
            </button>
            
            <button
              type="button"
              onClick={exportToCSV}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              CSVエクスポート
            </button>
          </div>
        )}
      </div>
      {/* 月次詳細テーブル */}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #dee2e6', 
        borderRadius: '4px',
        overflow: 'auto'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '12px'
        }}>
          <thead>
            <tr style={{ height: '28px', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ 
                textAlign: 'left', 
                padding: '4px 6px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: '#f8f9fa', 
                zIndex: 1,
                width: '180px'
              }}></th>
              {localData.months.map((month, index) => (
                <th key={`month-${index}`} style={{ padding: '2px', textAlign: 'center', fontWeight: 'normal' }}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 従業員数セクション */}
            <tr>
              <td colSpan={14} style={{ 
                textAlign: 'left', 
                padding: '4px 6px', 
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #dee2e6',
                borderBottom: '1px solid #dee2e6',
                fontSize: '12px'
              }}>
                従業員数
              </td>
            </tr>
            
            {/* 各データ行 */}
            {localData.data.map((row) => {
              // 特定の行の前にスペーサー行を追加
              const needsSpacerBefore = row.id === 5 || row.id === 10;
              const isHeaderRow = row.id === 5;
              
              return (
                <React.Fragment key={`row-${row.id}`}>
                  {needsSpacerBefore && (
                    <tr className="spacer-row">
                      <td colSpan={14} style={{ padding: '3px', backgroundColor: '#f8f9fa' }}></td>
                    </tr>
                  )}
                  {isHeaderRow && (
                    <tr className="header-row">
                      <th colSpan={14} style={{ 
                        textAlign: 'left', 
                        padding: '4px 6px',
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa',
                        borderTop: '1px solid #dee2e6',
                        borderBottom: '1px solid #dee2e6',
                        fontSize: '12px'
                      }}>
                        障がい者
                      </th>
                    </tr>
                  )}
                  {row.id === 10 && (
                    <tr className="header-row">
                      <th colSpan={14} style={{ 
                        textAlign: 'left', 
                        padding: '4px 6px',
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa',
                        borderTop: '1px solid #dee2e6',
                        borderBottom: '1px solid #dee2e6',
                        fontSize: '12px'
                      }}>
                        雇用率
                      </th>
                    </tr>
                  )}
                  <tr style={{ 
                    backgroundColor: 'white',
                    height: '22px'
                  }}>
                    <td style={{ 
                      textAlign: 'left', 
                      padding: '0 6px', 
                      position: 'sticky', 
                      left: 0, 
                      backgroundColor: 'white', 
                      zIndex: 1,
                      borderRight: '1px solid #f0f0f0',
                      whiteSpace: 'nowrap',
                      fontSize: '12px'
                    }}>
                      {row.item}
                    </td>
                    {row.values.map((value, colIndex) => {
                      // 法定雇用率は特別処理
                      const isLegalRate = row.id === 11;
                      const isFirstColumn = colIndex === 0;
                      const isNegativeValue = row.isNegative && value < 0;
                      
                      return (
                        <td 
                          key={`value-${row.id}-${colIndex}`} 
                          style={{ 
                            padding: '0', 
                            textAlign: 'center',
                            backgroundColor: activeCell.row === row.id && activeCell.col === colIndex ? '#e9f2ff' : 'white'
                          }}
                          onClick={() => handleCellClick(row.id, colIndex)}
                        >
                          {(editingDetailRow === row.id && editingDetailCol === colIndex && isEditing) || 
                            (isLegalRate && isFirstColumn && isEditing) ? (
                            <input
                              ref={(el: HTMLInputElement | null) => {
                                inputRefs.current[`input-${row.id}-${colIndex}`] = el;
                              }}
                              type="text"
                              style={cellStyle}
                              value={value}
                              onChange={(e) => handleLocalCellChange(row.id, colIndex, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
                              onFocus={() => setActiveCell({row: row.id, col: colIndex})}
                            />
                          ) : (
                            <input
                              type="text"
                              style={{
                                ...isCalculatedField(row.id) ? readonlyCellStyle : cellStyle,
                                color: isNegativeValue ? 'red' : 'inherit'
                              }}
                              value={row.suffix ? `${value}${row.suffix}` : value}
                              readOnly
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}

          </tbody>
        </table>
      </div>

      {/* 独立ページモードの場合のフッターボタン */}
      {!isEmbedded && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            印刷
          </button>
          <button
            onClick={exportToCSV}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            CSVエクスポート
          </button>
        </div>
      )}
    </div>
  );
};

export default MonthlyReportDetail;