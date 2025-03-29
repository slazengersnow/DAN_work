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

  // 保存ボタンのハンドラー
  const handleSave = () => {
    console.log('月次詳細データを保存');
  };

  return (
    <div className="monthly-tab">
      <h3>月次詳細</h3>
      
      {/* 保存ボタン */}
      <button 
        onClick={handleSave}
        style={{
          backgroundColor: '#3a66d4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 16px',
          marginBottom: '20px',
          cursor: 'pointer'
        }}
      >
        保存
      </button>

      {/* 月次詳細テーブル */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ 
                textAlign: 'left', 
                padding: '10px', 
                borderBottom: '1px solid #ddd', 
                position: 'sticky',
                left: 0,
                backgroundColor: '#f8f9fa'
              }}></th>
              {monthlyDetailData.months.map((month, index) => (
                <th key={index} style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #ddd',
                  textAlign: 'center',
                  minWidth: '80px'
                }}>
                  {month}
                </th>
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
                      <td colSpan={14} style={{ padding: '5px', backgroundColor: '#f8f9fa' }}></td>
                    </tr>
                  )}
                  {isHeaderRow && (
                    <tr className="header-row">
                      <th colSpan={14} style={{ 
                        textAlign: 'left', 
                        padding: '10px',
                        backgroundColor: '#e9f2ff'
                      }}>障がい者</th>
                    </tr>
                  )}
                  <tr style={{ 
                    backgroundColor: row.isCalculated ? '#f8f9fa' : 'white'
                  }}>
                    <td style={{ 
                      fontWeight: 'bold', 
                      padding: '10px', 
                      borderBottom: '1px solid #ddd',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: row.isCalculated ? '#f8f9fa' : 'white'
                    }}>
                      {row.item}
                    </td>
                    {row.values.map((value, colIndex) => {
                      let cellStyle: React.CSSProperties = {
                        textAlign: 'center', 
                        padding: '10px', 
                        borderBottom: '1px solid #ddd',
                        color: row.isNegative && value < 0 ? '#dc3545' : 'inherit'
                      };
                      
                      if (activeCell.row === row.id && activeCell.col === colIndex) {
                        cellStyle.backgroundColor = '#e9f2ff';
                        cellStyle.outline = '2px solid #3a66d4';
                      }
                      
                      return (
                        <td 
                          key={`value-${row.id}-${colIndex}`} 
                          style={cellStyle}
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
                              style={{
                                width: '60px',
                                padding: '4px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                textAlign: 'center'
                              }}
                              disabled={row.isCalculated || summaryData.status === '確定済'}
                            />
                          ) : (
                            <span style={
                              colIndex < 12 && !row.isCalculated && summaryData.status !== '確定済' 
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
      
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '0.9em',
        color: '#666'
      }}>
        <p>注: 矢印キー、Tab キー、Enter キーでセル間を移動できます。 「実雇用率」「法定雇用者数」「超過・未達」は自動計算されます。</p>
      </div>
    </div>
  );
};

export default MonthlyTab;