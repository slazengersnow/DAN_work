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
    // 自動計算フィールドのID（10: 実雇用率, 12: 法定雇用者数, 13: 超過・未達）
    const calculatedFieldIds = [10, 12, 13];
    return calculatedFieldIds.includes(rowId);
  };

  // 法定雇用率フィールドかどうかチェック
  const isLegalRateField = (rowId: number): boolean => {
    return rowId === 11; // 法定雇用率のID
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

  // 自動計算を行う
  const recalculateData = (updatedData: MonthlyDetailData): MonthlyDetailData => {
    const newData = {...updatedData};
    const totalEmployeesRowIndex = newData.data.findIndex(row => row.id === getTotalEmployeesRowId());
    const totalDisabledRowIndex = newData.data.findIndex(row => row.id === getTotalDisabledRowId());
    const legalRateRowIndex = newData.data.findIndex(row => row.id === getLegalRateRowId());
    
    if (totalEmployeesRowIndex !== -1 && totalDisabledRowIndex !== -1 && legalRateRowIndex !== -1) {
      const totalEmployeeValues = newData.data[totalEmployeesRowIndex].values;
      const totalDisabledValues = newData.data[totalDisabledRowIndex].values;
      const legalRateValues = newData.data[legalRateRowIndex].values;
      
      // 実雇用率の計算 (トータル障がい者数 / トータル従業員数)
      const actualRateRowIndex = newData.data.findIndex(row => row.id === 10);
      if (actualRateRowIndex !== -1) {
        newData.data[actualRateRowIndex].values = totalEmployeeValues.map((employees, index) => {
          if (index < 12) { // 月ごとの計算（合計列は除く）
            return employees > 0 ? Number(((totalDisabledValues[index] / employees) * 100).toFixed(2)) : 0;
          }
          return newData.data[actualRateRowIndex].values[index]; // 合計列はそのまま
        });
      }
      
      // 法定雇用者数の計算 (法定雇用率 * トータル従業員数 / 100)
      const legalCountRowIndex = newData.data.findIndex(row => row.id === 12);
      if (legalCountRowIndex !== -1) {
        newData.data[legalCountRowIndex].values = totalEmployeeValues.map((employees, index) => {
          if (index < 12) { // 月ごとの計算（合計列は除く）
            // 法定雇用率は全ての月で同じ値を使用
            const legalRate = legalRateValues[0];
            return Math.floor((legalRate * employees) / 100);
          }
          return newData.data[legalCountRowIndex].values[index]; // 合計列はそのまま
        });
      }
      
      // 超過・未達の計算 (トータル障がい者数 - 法定雇用者数)
      const overUnderRowIndex = newData.data.findIndex(row => row.id === 13);
      const legalCountValues = newData.data[legalCountRowIndex].values;
      if (overUnderRowIndex !== -1) {
        newData.data[overUnderRowIndex].values = totalDisabledValues.map((disabled, index) => {
          if (index < 12) { // 月ごとの計算（合計列は除く）
            return disabled - legalCountValues[index];
          }
          return newData.data[overUnderRowIndex].values[index]; // 合計列はそのまま
        });
      }
    }
    
    return newData;
  };

  // セルの値を変更するハンドラー
  const handleLocalCellChange = (rowId: number, colIndex: number, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    if (isNaN(numValue)) return;
    
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
    setActiveCell({row: rowId, col: colIndex});
    
    if (!isCalculatedField(rowId)) {
      handleDetailCellEdit(rowId, colIndex);
    }
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
      }
    }, 10);
  };

  // キーボードナビゲーション用のハンドラー
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
    navigate(`/monthly-report/${summaryData.year}-${summaryData.month}`);
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
                    </td>
                    {row.values.map((value, colIndex) => {
                      let cellStyle: React.CSSProperties = {
                        textAlign: 'center', 
                        padding: '2px 4px', 
                        borderBottom: '1px solid #f0f0f0',
                        color: row.isNegative && value < 0 ? '#dc3545' : 'inherit',
                        fontSize: '12px',
                        height: '24px'
                      };
                      
                      if (activeCell.row === row.id && activeCell.col === colIndex) {
                        cellStyle.backgroundColor = '#e9f2ff';
                        cellStyle.outline = '1px solid #3a66d4';
                      }
                      
                      // 法定雇用率は特別な処理
                      const isLegalRate = row.id === 11;
                      const isFirstColumn = colIndex === 0;
                      
                      return (
                        <td 
                          key={`value-${row.id}-${colIndex}`} 
                          style={cellStyle}
                          onClick={() => handleCellClick(row.id, colIndex)}
                        >
                          {(editingDetailRow === row.id && editingDetailCol === colIndex && summaryData.status !== '確定済') || 
                           (isLegalRate && isFirstColumn && summaryData.status !== '確定済') ? (
                            <input
                              ref={(el) => setInputRef(el, `input-${row.id}-${colIndex}`)}
                              type="text"
                              value={value}
                              onChange={(e) => handleLocalCellChange(row.id, colIndex, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
                              style={{
                                width: '50px',
                                padding: '2px 4px',
                                border: '1px solid #ddd',
                                borderRadius: '3px',
                                textAlign: 'center',
                                fontSize: '12px'
                              }}
                              disabled={isCalculatedField(row.id) || summaryData.status === '確定済'}
                            />
                          ) : (
                            <span style={
                              colIndex < 12 && !isCalculatedField(row.id) && summaryData.status !== '確定済' 
                                ? { cursor: 'pointer', textDecoration: 'underline dotted #ccc' } 
                                : {}
                            }>
                              {value}{row.suffix || ''}
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