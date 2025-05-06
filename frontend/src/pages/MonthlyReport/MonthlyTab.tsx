// src/pages/MonthlyReport/MonthlyTab.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonthlyDetailData, MonthlyTotal } from './types';

interface MonthlyTabProps {
  monthlyDetailData: MonthlyDetailData;
  onDetailCellChange: (rowId: number, colIndex: number, value: string) => void;
  summaryData: MonthlyTotal;
}

const MonthlyTab: React.FC<MonthlyTabProps> = ({
  monthlyDetailData,
  onDetailCellChange,
  summaryData
}) => {
  const navigate = useNavigate();
  const [activeCell, setActiveCell] = useState<{row: number | null, col: number | null}>({row: null, col: null});
  const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
  const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);
  const [localData, setLocalData] = useState<MonthlyDetailData>(monthlyDetailData);
  
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // モンスリーデータが変更されたら、ローカルデータを更新
  useEffect(() => {
    setLocalData(monthlyDetailData);
  }, [monthlyDetailData]);

  // 入力参照用関数
  const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
    if (element) {
      inputRefs.current[key] = element;
    }
  }, []);

  // セルが計算済みかどうかをチェック
  const isCalculatedField = (rowId: number): boolean => {
    // 自動計算フィールドのID（4: トータル従業員数, 9: 障がい者合計, 10: 実雇用率, 12: 法定雇用者数, 13: 超過・未達）
    const calculatedFieldIds = [4, 9, 10, 12, 13];
    return calculatedFieldIds.includes(rowId);
  };

  // 法定雇用率フィールドかどうかチェック
  const isLegalRateField = (rowId: number): boolean => {
    return rowId === 11; // 法定雇用率のID
  };

  // 実雇用率フィールドかどうかチェック
  const isActualRateField = (rowId: number): boolean => {
    return rowId === 10; // 実雇用率のID
  };

  // トータル従業員数の行IDを特定
  const getTotalEmployeesRowId = (): number => {
    return 4; // トータル従業員数の行ID
  };

  // トータル障がい者数の行IDを特定
  const getTotalDisabledRowId = (): number => {
    return 9; // トータル障がい者数の行ID
  };

  // 法定雇用率の行IDを特定
  const getLegalRateRowId = (): number => {
    return 11; // 法定雇用率の行ID
  };

  // 自動計算を行う - 精度強化版
  const recalculateData = (updatedData: MonthlyDetailData): MonthlyDetailData => {
    const newData = {...updatedData};
    const totalEmployeesRowIndex = newData.data.findIndex(row => row.id === getTotalEmployeesRowId());
    const totalDisabledRowIndex = newData.data.findIndex(row => row.id === getTotalDisabledRowId());
    const legalRateRowIndex = newData.data.findIndex(row => row.id === getLegalRateRowId());
    
    const fullTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 2);
    const partTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 3);
    
    const level1And2RowIndex = newData.data.findIndex(row => row.id === 5);
    const otherRowIndex = newData.data.findIndex(row => row.id === 6);
    const level1And2PartTimeRowIndex = newData.data.findIndex(row => row.id === 7);
    const otherPartTimeRowIndex = newData.data.findIndex(row => row.id === 8);
    
    // 各行の合計を正しく計算
    for (let rowIndex = 0; rowIndex < newData.data.length; rowIndex++) {
      const row = newData.data[rowIndex];
      // 合計行の計算対象となる基本項目かどうか
      const isBasicRow = [1, 2, 3, 5, 6, 7, 8].includes(row.id);
      
      if (isBasicRow) {
        // 合計欄（インデックス12）の値を計算
        row.values[12] = row.values.slice(0, 12).reduce((sum, value) => {
          // 小数点以下の精度を保持するため、計算後に丸めない
          return sum + value;
        }, 0);
      }
    }
    
    // トータル従業員数の計算
    if (fullTimeEmployeesRowIndex !== -1 && partTimeEmployeesRowIndex !== -1 && totalEmployeesRowIndex !== -1) {
      const fullTimeValues = newData.data[fullTimeEmployeesRowIndex].values;
      const partTimeValues = newData.data[partTimeEmployeesRowIndex].values;
      
      for (let i = 0; i < 13; i++) {
        // パートタイム従業員は0.5でカウント
        newData.data[totalEmployeesRowIndex].values[i] = 
          fullTimeValues[i] + (partTimeValues[i] * 0.5);
      }
    }
    
    // 障がい者合計の計算 - 精度向上
    if (level1And2RowIndex !== -1 && otherRowIndex !== -1 && 
        level1And2PartTimeRowIndex !== -1 && otherPartTimeRowIndex !== -1 && 
        totalDisabledRowIndex !== -1) {
        
      const level1And2Values = newData.data[level1And2RowIndex].values;
      const otherValues = newData.data[otherRowIndex].values;
      const level1And2PartTimeValues = newData.data[level1And2PartTimeRowIndex].values;
      const otherPartTimeValues = newData.data[otherPartTimeRowIndex].values;
      
      for (let i = 0; i < 13; i++) {
        // 重度障害者のカウント精度向上
        newData.data[totalDisabledRowIndex].values[i] = 
          level1And2Values[i] * 2 + // 重度障害者はダブルカウント
          otherValues[i] + // その他障害者は通常カウント
          level1And2PartTimeValues[i] * 2 * 0.5 + // 重度障害パートタイムはダブルカウント後に0.5
          otherPartTimeValues[i] * 0.5; // その他障害パートタイムは0.5カウント
      }
    }
    
    if (totalEmployeesRowIndex !== -1 && totalDisabledRowIndex !== -1 && legalRateRowIndex !== -1) {
      const totalEmployeeValues = newData.data[totalEmployeesRowIndex].values;
      const totalDisabledValues = newData.data[totalDisabledRowIndex].values;
      const legalRateValues = newData.data[legalRateRowIndex].values;
      
      // 実雇用率の計算 (トータル障がい者数 / トータル従業員数) - 精度向上
      const actualRateRowIndex = newData.data.findIndex(row => row.id === 10);
      if (actualRateRowIndex !== -1) {
        for (let i = 0; i < 12; i++) { // 0-11は通常の月
          if (totalEmployeeValues[i] > 0) {
            // 実雇用率の計算を正確に行い、表示のみ小数点第2位で丸める
            const rawRate = (totalDisabledValues[i] / totalEmployeeValues[i]) * 100;
            // 内部的には計算精度を保持し、丸めは表示時に行う
            newData.data[actualRateRowIndex].values[i] = rawRate;
          } else {
            newData.data[actualRateRowIndex].values[i] = 0;
          }
        }
        
        // 合計欄の実雇用率も同様に精度を保持
        if (totalEmployeeValues[12] > 0) {
          const totalRawRate = (totalDisabledValues[12] / totalEmployeeValues[12]) * 100;
          newData.data[actualRateRowIndex].values[12] = totalRawRate;
        } else {
          newData.data[actualRateRowIndex].values[12] = 0;
        }
      }
      
      // 法定雇用者数の計算 (法定雇用率 * トータル従業員数 / 100) - 小数点以下切り上げ
      const legalCountRowIndex = newData.data.findIndex(row => row.id === 12);
      if (legalCountRowIndex !== -1) {
        for (let i = 0; i < 12; i++) { // 0-11は通常の月
          // 法定雇用者数を正確に計算（小数点以下切り上げ）
          newData.data[legalCountRowIndex].values[i] = 
            Math.ceil((legalRateValues[i] * totalEmployeeValues[i]) / 100);
        }
        
        // 合計欄の法定雇用者数も同様に計算
        newData.data[legalCountRowIndex].values[12] = 
          Math.ceil((legalRateValues[12] * totalEmployeeValues[12]) / 100);
      }
      
      // 超過・未達の計算 (トータル障がい者数 - 法定雇用者数)
      const overUnderRowIndex = newData.data.findIndex(row => row.id === 13);
      if (overUnderRowIndex !== -1 && legalCountRowIndex !== -1) {
        const legalCountValues = newData.data[legalCountRowIndex].values;
        
        // 0-11（4月から3月まで）のデータを個別に計算
        for (let i = 0; i < 12; i++) {
          newData.data[overUnderRowIndex].values[i] = 
            totalDisabledValues[i] - legalCountValues[i];
        }
        
        // 合計欄（12）は、合計の障害者数 - 合計の法定雇用者数
        newData.data[overUnderRowIndex].values[12] = 
          totalDisabledValues[12] - legalCountValues[12];
      }
    }
    
    return newData;
  };

  // セルの値を変更するハンドラー
  const handleLocalCellChange = (rowId: number, colIndex: number, value: string) => {
    // 法定雇用率フィールド専用の入力判定
    const isLegalRate = isLegalRateField(rowId);
    
    // 空の入力を0または0.0として扱う
    if (value === '') {
      value = isLegalRate ? '0.0' : '0';
    }
    
    // 入力パターンチェック
    const validateInput = (): boolean => {
      if (isLegalRate) {
        // 法定雇用率フィールド用のパターン - 小数点を許可
        return /^([0-9]*\.?[0-9]*)?$/.test(value);
      } else {
        // その他フィールド用のパターン - 整数のみ
        return /^[0-9]*$/.test(value);
      }
    };
    
    // 入力検証
    if (!validateInput()) {
      return;
    }
    
    // 値の処理
    let numValue: number;
    
    // 法定雇用率の特別処理
    if (isLegalRate) {
      // 小数点のみの入力
      if (value === '.') {
        numValue = 0;
      } 
      // 末尾が小数点の数値
      else if (value.endsWith('.')) {
        numValue = parseFloat(value + '0');
      } 
      // 通常の数値または小数
      else {
        numValue = parseFloat(value);
      }
    } else {
      // 通常フィールドの数値変換
      numValue = parseInt(value, 10);
      if (isNaN(numValue)) numValue = 0;
    }
    
    setLocalData(prevData => {
      const newData = {...prevData};
      const rowIndex = newData.data.findIndex(row => row.id === rowId);
      
      if (rowIndex !== -1 && colIndex < 12) {
        const updatedValues = [...newData.data[rowIndex].values];
        updatedValues[colIndex] = numValue;
        
        // 合計の再計算
        updatedValues[12] = updatedValues.slice(0, 12).reduce((a, b) => a + b, 0);
        
        newData.data[rowIndex].values = updatedValues;
        
        // 法定雇用率が変更された場合、全ての月に同じ値を設定
        if (isLegalRateField(rowId)) {
          newData.data[rowIndex].values = newData.data[rowIndex].values.map((_, idx) => 
            idx < 12 ? numValue : newData.data[rowIndex].values[idx]
          );
        }
        
        // 外部イベントを発火
        onDetailCellChange(rowId, colIndex, value);
        
        // 自動計算を実行
        return recalculateData(newData);
      }
      
      return newData;
    });
  };

  // セルクリック時のハンドラー
  const handleCellClick = (rowId: number, colIndex: number) => {
    if (colIndex >= 12) return; // 合計列はクリック不可
    if (isCalculatedField(rowId)) return; // 計算フィールドはクリック不可
    
    setActiveCell({row: rowId, col: colIndex});
    handleDetailCellEdit(rowId, colIndex);
  };

  // セル編集開始ハンドラー
  const handleDetailCellEdit = (rowId: number, colIndex: number) => {
    if (isCalculatedField(rowId)) return; // 自動計算フィールドは編集不可
    
    setEditingDetailRow(rowId);
    setEditingDetailCol(colIndex);
    
    // 遅延してフォーカスを設定
    setTimeout(() => {
      const inputKey = `input-${rowId}-${colIndex}`;
      if (inputRefs.current[inputKey]) {
        inputRefs.current[inputKey]?.focus();
        // カーソルを入力欄の末尾に配置
        const input = inputRefs.current[inputKey];
        if (input) {
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      }
    }, 10);
  };

  // キーボードナビゲーション用のハンドラー - 改良版
  const handleKeyDown = (e: React.KeyboardEvent, rowId: number, colIndex: number) => {
    if (isCalculatedField(rowId)) return; // 自動計算フィールドは移動のみ許可
    
    // Enter キーを押した場合は編集を保存して下の行へ
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDetailCellSave();
      
      // 次の編集可能なセルを探して移動
      const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
      let nextRowId: number | null = null;
      
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
    // Tab キーを押した場合は次のセルへ
    else if (e.key === 'Tab') {
      e.preventDefault();
      handleDetailCellSave();
      
      if (e.shiftKey) {
        // Shift+Tab で左へ移動
        if (colIndex > 0) {
          handleDetailCellEdit(rowId, colIndex - 1);
        } else {
          // 前の行の最後の列へ
          const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex > 0) {
            let prevRowId: number | null = null;
            for (let i = currentRowIndex - 1; i >= 0; i--) {
              if (!isCalculatedField(localData.data[i].id)) {
                prevRowId = localData.data[i].id;
                break;
              }
            }
            if (prevRowId !== null) {
              handleDetailCellEdit(prevRowId, 11); // 最後の月 (12番目のセル)
            }
          }
        }
      } else {
        // Tab で右へ移動
        if (colIndex < 11) {
          handleDetailCellEdit(rowId, colIndex + 1);
        } else {
          // 次の行の最初の列へ
          const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex < localData.data.length - 1) {
            let nextRowId: number | null = null;
            for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
              if (!isCalculatedField(localData.data[i].id)) {
                nextRowId = localData.data[i].id;
                break;
              }
            }
            if (nextRowId !== null) {
              handleDetailCellEdit(nextRowId, 0); // 最初の月
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
        let prevRowId: number | null = null;
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
        let nextRowId: number | null = null;
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
    // Escapeキーでの編集キャンセル
    else if (e.key === 'Escape') {
      e.preventDefault();
      handleDetailCellSave();
      setActiveCell({row: null, col: null});
    }
  };

  // セル編集の保存
  const handleDetailCellSave = () => {
    setEditingDetailRow(null);
    setEditingDetailCol(null);
  };

  // 保存ボタンのハンドラー
  const handleSave = () => {
    console.log('月次詳細データを保存');
  };

  // 詳細表示ハンドラー
  const handleViewDetail = () => {
    // 詳細ページに移動（IDベースの場合）
    navigate(`/monthly-report/${summaryData.fiscal_year}-${summaryData.month}`);
  };

  // 値のフォーマットを行う関数 - 改良版
  const formatValue = (value: number, rowId: number): string => {
    // 法定雇用率と実雇用率は小数点2桁固定表示
    if (rowId === 10 || rowId === 11) {
      return value.toFixed(2);
    }
    
    // 合計従業員数と障害者数は小数点1桁で表示（パートタイム考慮）
    if ((rowId === 4 || rowId === 9) && !Number.isInteger(value)) {
      return value.toFixed(1);
    }
    
    // それ以外の値は整数か小数点1桁で表示
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  };
  
  // 値のCSS色を決定する関数
  const getValueColor = (value: number, rowId: number): string => {
    // 負の値は赤色で表示（超過・未達数がマイナスの場合）
    if (value < 0 && rowId === 13) {
      return '#dc3545';
    }
    
    // 実雇用率が法定雇用率未満の場合は赤色で警告
    if (rowId === 10) {
      const legalRateRowIndex = localData.data.findIndex(row => row.id === 11);
      if (legalRateRowIndex !== -1) {
        const colIndex = editingDetailCol !== null ? editingDetailCol : 0;
        const legalRate = localData.data[legalRateRowIndex].values[colIndex];
        if (value < legalRate) {
          return '#dc3545';
        }
      }
    }
    
    return 'inherit';
  };

  return (
    <div className="monthly-tab">
      <h3>月次詳細</h3>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {/* 保存ボタン */}
        <button 
          onClick={handleSave}
          style={{
            backgroundColor: '#3a66d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          保存
        </button>

        {/* 詳細表示ボタン */}
        <button
          onClick={handleViewDetail}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#3a66d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          詳細表示
        </button>
      </div>

      {/* 月次詳細テーブル */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ 
                textAlign: 'left', 
                padding: '8px', 
                borderBottom: '1px solid #ddd', 
                position: 'sticky',
                left: 0,
                backgroundColor: 'white',
                fontSize: '12px'
              }}></th>
              {localData.months.map((month, index) => (
                <th key={index} style={{ 
                  padding: '6px', 
                  borderBottom: '1px solid #ddd',
                  textAlign: 'center',
                  minWidth: '70px',
                  fontSize: '12px'
                }}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localData.data.map((row) => {
              // 特定の行の前にスペーサー行を追加
              const needsSpacerBefore = row.id === 5 || row.id === 10;
              const isHeaderRow = row.id === 5;
              const isRatioRow = row.id === 10;
              
              return (
                <React.Fragment key={`row-${row.id}`}>
                  {needsSpacerBefore && (
                    <tr className="spacer-row">
                      <td colSpan={14} style={{ padding: '4px', backgroundColor: 'white' }}></td>
                    </tr>
                  )}
                  {isHeaderRow && (
                    <tr className="header-row">
                      <th colSpan={14} style={{ 
                        textAlign: 'left', 
                        padding: '6px',
                        backgroundColor: '#e9f2ff',
                        fontSize: '12px'
                      }}>障がい者</th>
                    </tr>
                  )}
                  {isRatioRow && (
                    <tr className="header-row">
                      <th colSpan={14} style={{ 
                        textAlign: 'left', 
                        padding: '6px',
                        backgroundColor: '#e9f2ff',
                        fontSize: '12px'
                      }}>雇用率</th>
                    </tr>
                  )}
                  <tr style={{ 
                    backgroundColor: 'white',
                    height: '24px'
                  }}>
                    <td style={{ 
                      padding: '2px 8px', 
                      borderBottom: '1px solid #f0f0f0',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'white',
                      fontSize: '12px'
                    }}>
                      {row.item}
                      {row.suffix && <span style={{ fontSize: '10px', color: '#666' }}> ({row.suffix})</span>}
                    </td>
                    {row.values.map((value, colIndex) => {
                      // セルスタイルを設定
                      let cellStyle: React.CSSProperties = {
                        textAlign: 'center', 
                        padding: '2px 4px', 
                        borderBottom: '1px solid #f0f0f0',
                        color: getValueColor(value, row.id),
                        fontSize: '12px',
                        height: '24px'
                      };
                      
                      // アクティブセルのスタイル
                      if (activeCell.row === row.id && activeCell.col === colIndex) {
                        cellStyle.backgroundColor = '#e9f2ff';
                        cellStyle.outline = '1px solid #3a66d4';
                      }
                      
                      const isLegalRate = row.id === 11;
                      const isActualRate = row.id === 10;
                      const isEditingThisCell = editingDetailRow === row.id && editingDetailCol === colIndex;
                      const canEdit = !isCalculatedField(row.id) && summaryData.status !== '確定済';
                      
                      // 値のフォーマット
                      const displayValue = formatValue(value, row.id);
                      
                      return (
                        <td 
                          key={`value-${row.id}-${colIndex}`} 
                          style={cellStyle}
                          onClick={() => canEdit && colIndex < 12 ? handleCellClick(row.id, colIndex) : null}
                        >
                          {(isEditingThisCell && canEdit) ? (
                            <input
                              ref={(el) => setInputRef(el, `input-${row.id}-${colIndex}`)}
                              type="text"
                              value={value}
                              onChange={(e) => handleLocalCellChange(row.id, colIndex, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
                              onBlur={handleDetailCellSave}
                              style={{
                                width: '50px',
                                padding: '2px 4px',
                                border: '1px solid #ddd',
                                borderRadius: '3px',
                                textAlign: 'center',
                                fontSize: '12px',
                                backgroundColor: isLegalRate ? '#e5f7ff' : 'white'
                              }}
                            />
                          ) : (
                            <span style={{
                              cursor: colIndex < 12 && canEdit ? 'pointer' : 'default',
                              textDecoration: colIndex < 12 && canEdit ? 'underline dotted #ccc' : 'none',
                              fontWeight: (row.id === 4 || row.id === 9 || row.id === 10 || row.id === 13) ? 'bold' : 'normal'
                            }}>
                              {displayValue}{(isActualRate || isLegalRate) ? '%' : ''}
                            </span>
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
    </div>
  );
};

export default MonthlyTab;