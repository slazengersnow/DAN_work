// src/pages/MonthlyReport/MonthlyTab.tsx
import React, { useState, useRef, useCallback } from 'react';
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
  const [activeCell, setActiveCell] = useState<{row: number | null, col: number | null}>({row: null, col: null});
  const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
  const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);
  
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // 入力参照用関数
  const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
    if (element) {
      inputRefs.current[key] = element;
    }
  }, []);

  // セルが計算済みかどうかをチェック
  const isCalculatedField = (rowId: number): boolean => {
    const row = monthlyDetailData.data.find(row => row.id === rowId);
    return !!row?.isCalculated;
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
      const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
      let nextRowId = null;
      
      for (let i = currentRowIndex + 1; i < monthlyDetailData.data.length; i++) {
        if (!isCalculatedField(monthlyDetailData.data[i].id)) {
          nextRowId = monthlyDetailData.data[i].id;
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
          const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex > 0) {
            let prevRowId = null;
            for (let i = currentRowIndex - 1; i >= 0; i--) {
              if (!isCalculatedField(monthlyDetailData.data[i].id)) {
                prevRowId = monthlyDetailData.data[i].id;
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
          const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex < monthlyDetailData.data.length - 1) {
            let nextRowId = null;
            for (let i = currentRowIndex + 1; i < monthlyDetailData.data.length; i++) {
              if (!isCalculatedField(monthlyDetailData.data[i].id)) {
                nextRowId = monthlyDetailData.data[i].id;
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
      
      const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
      
      if (e.key === 'ArrowUp' && currentRowIndex > 0) {
        let prevRowId = null;
        for (let i = currentRowIndex - 1; i >= 0; i--) {
          if (!isCalculatedField(monthlyDetailData.data[i].id)) {
            prevRowId = monthlyDetailData.data[i].id;
            break;
          }
        }
        if (prevRowId !== null) {
          handleDetailCellEdit(prevRowId, colIndex);
        }
      }
      else if (e.key === 'ArrowDown' && currentRowIndex < monthlyDetailData.data.length - 1) {
        let nextRowId = null;
        for (let i = currentRowIndex + 1; i < monthlyDetailData.data.length; i++) {
          if (!isCalculatedField(monthlyDetailData.data[i].id)) {
            nextRowId = monthlyDetailData.data[i].id;
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

  return (
    <div className="monthly-tab-container">
      <div className="data-container">
        <div className="data-header">
          <h3 className="data-title">月次詳細</h3>
        </div>
        <div className="data-table-wrapper horizontal-scroll-container">
          <table className="data-table monthly-detail-table">
            <thead>
              <tr>
                <th className="fixed-column"></th>
                {monthlyDetailData.months.map(month => (
                  <th key={month}>{month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyDetailData.data.map((row) => {
                // 特定の行の前にスペーサー行を追加
                const needsSpacerBefore = row.id === 5 || row.id === 10;
                const isHeaderRow = row.id === 5;
                
                return (
                  <React.Fragment key={`row-${row.id}`}>
                    {needsSpacerBefore && (
                      <tr className="spacer-row">
                        <td colSpan={14}></td>
                      </tr>
                    )}
                    {isHeaderRow && (
                      <tr className="header-row">
                        <th colSpan={14}>障がい者</th>
                      </tr>
                    )}
                    <tr className={row.isCalculated ? 'calculated-row' : ''}>
                      <td className="fixed-column item-column">{row.item}</td>
                      {row.values.map((value, colIndex) => {
                        let className = 'cell';
                        if (row.isNegative && value < 0) className += ' negative-value';
                        else if (row.isRatio) className += ' ratio-value';
                        if (row.isCalculated) className += ' calculated-cell';
                        if (activeCell.row === row.id && activeCell.col === colIndex) className += ' active-cell';
                        
                        return (
                          <td 
                            key={`value-${row.id}-${colIndex}`} 
                            className={className}
                            onClick={() => handleCellClick(row.id, colIndex)}
                          >
                            {editingDetailRow === row.id && editingDetailCol === colIndex && summaryData.status !== '確定済' ? (
                              <input
                                ref={(el) => setInputRef(el, `input-${row.id}-${colIndex}`)}
                                type="text"
                                value={value}
                                onChange={(e) => onDetailCellChange(row.id, colIndex, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
                                className="cell-input"
                                disabled={row.isCalculated || summaryData.status === '確定済'}
                              />
                            ) : (
                              <span className={colIndex < 12 && !row.isCalculated && summaryData.status !== '確定済' ? 'editable-cell' : ''}>
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
        <div className="spreadsheet-help">
          <p>注: 矢印キー、Tab キー、Enter キーでセル間を移動できます。 「実雇用率」「法定雇用者数」「超過・未達」は自動計算されます。</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTab;