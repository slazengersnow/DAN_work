// frontend/src/components/employee-tabs/MonthlyInfo.tsx
import React, { useState, useEffect, useRef, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { TabProps } from '../../types/Employee';

const MonthlyInfo: React.FC<TabProps> = ({ employeeData, onUpdate }) => {
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  const [laborTimeChange, setLaborTimeChange] = useState<string>('なし');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // 初期値の設定（実際のデータがない場合はデフォルト値を使用）
  const defaultMonthlyData = {
    standardHours: Array(12).fill(160),
    actualHours: [160, 160, 152, 160, 160, 160, 144, 160, 160, 160, 160, 152],
    notes: ['', '', '有給休暇', '', '', '', '診療通院(2日)', '', '', '', '', '有給休暇'],
    attendanceFlag: Array(12).fill(1),
    reportFlag: Array(12).fill(1),
    countValues: Array(12).fill(employeeData.count || 2.0)
  };

  const [monthlyData, setMonthlyData] = useState(employeeData.monthlyData || defaultMonthlyData);
  
  // アクティブセルの状態
  const [activeCell, setActiveCell] = useState<{row: string | null, col: number | null}>({row: null, col: null});
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingCol, setEditingCol] = useState<number | null>(null);

  // 月名の配列
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

  // 入力参照用
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
    if (element) {
      inputRefs.current[key] = element;
    }
  }, []);

  // 年度変更ハンドラ
  const handleFiscalYearChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setFiscalYear(e.target.value);
    // APIから該当年度のデータを取得する処理などを追加
  };

  // 労働時間変動有無の変更ハンドラ
  const handleLaborTimeChangeToggle = (e: ChangeEvent<HTMLSelectElement>): void => {
    setLaborTimeChange(e.target.value);
  };

  // 編集モード切り替え
  const toggleEditMode = () => {
    setIsEditing(prev => !prev);
    // 編集モードを解除するときはアクティブセルもリセット
    if (isEditing) {
      setActiveCell({row: null, col: null});
      setEditingRow(null);
      setEditingCol(null);
    }
  };

  // 保存ボタンのハンドラー
  const handleSave = () => {
    // 親コンポーネントにデータ更新を通知
    onUpdate({ monthlyData: monthlyData });
    // 編集モードを解除
    setIsEditing(false);
    setActiveCell({row: null, col: null});
    setEditingRow(null);
    setEditingCol(null);
    
    alert('データを保存しました');
  };

  // セルクリック時のハンドラー
  const handleCellClick = (rowId: string, colIndex: number) => {
    if (!isEditing) return; // 編集モード時のみ処理
    
    setActiveCell({row: rowId, col: colIndex});
    handleCellEdit(rowId, colIndex);
  };

  // セル編集開始ハンドラー
  const handleCellEdit = (rowId: string, colIndex: number) => {
    if (!isEditing) return; // 編集モード時のみ処理
    
    setEditingRow(rowId);
    setEditingCol(colIndex);
    
    // 遅延してフォーカスを設定
    setTimeout(() => {
      const inputKey = `input-${rowId}-${colIndex}`;
      if (inputRefs.current[inputKey]) {
        inputRefs.current[inputKey]?.focus();
      }
    }, 10);
  };

  // 月次データの編集ハンドラ
  const handleMonthlyDataChange = (field: string, monthIndex: number, value: string): void => {
    const newMonthlyData = { ...monthlyData };
    
    if (field === 'notes') {
      newMonthlyData[field][monthIndex] = value;
    } else {
      const numValue = value === '' ? 0 : Number(value);
      if (!isNaN(numValue)) {
        newMonthlyData[field][monthIndex] = numValue;
      }
    }
    
    setMonthlyData(newMonthlyData);
  };

  // セル編集の完了
  const handleCellSave = () => {
    setEditingRow(null);
    setEditingCol(null);
  };

  // キーボードナビゲーション
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, rowId: string, colIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave();
      
      // 下の行への移動
      const rowsOrder = ['standardHours', 'actualHours', 'attendanceFlag', 'countValues', 'notes'];
      const currentRowIndex = rowsOrder.indexOf(rowId);
      
      if (currentRowIndex < rowsOrder.length - 1) {
        // 次の行の同じ列
        handleCellEdit(rowsOrder[currentRowIndex + 1], colIndex);
      } else if (colIndex < 11) {
        // 次の列の最初の行
        handleCellEdit(rowsOrder[0], colIndex + 1);
      }
    }
    else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellSave();
      
      // Tab + Shift キーでの移動
      if (e.shiftKey) {
        if (colIndex > 0) {
          handleCellEdit(rowId, colIndex - 1);
        } else {
          const rowsOrder = ['standardHours', 'actualHours', 'attendanceFlag', 'countValues', 'notes'];
          const currentRowIndex = rowsOrder.indexOf(rowId);
          
          if (currentRowIndex > 0) {
            // 前の行の最後の列
            handleCellEdit(rowsOrder[currentRowIndex - 1], 11);
          } else {
            // 最初のセルの場合、最後のセルへ
            handleCellEdit(rowsOrder[rowsOrder.length - 1], 11);
          }
        }
      } else {
        if (colIndex < 11) {
          // 同じ行の次の列
          handleCellEdit(rowId, colIndex + 1);
        } else {
          const rowsOrder = ['standardHours', 'actualHours', 'attendanceFlag', 'countValues', 'notes'];
          const currentRowIndex = rowsOrder.indexOf(rowId);
          
          if (currentRowIndex < rowsOrder.length - 1) {
            // 次の行の最初の列
            handleCellEdit(rowsOrder[currentRowIndex + 1], 0);
          } else {
            // 最後のセルの場合、最初のセルへ
            handleCellEdit(rowsOrder[0], 0);
          }
        }
      }
    }
    // 矢印キーでの移動
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleCellSave();
      
      const rowsOrder = ['standardHours', 'actualHours', 'attendanceFlag', 'countValues', 'notes'];
      const currentRowIndex = rowsOrder.indexOf(rowId);
      
      if (e.key === 'ArrowUp' && currentRowIndex > 0) {
        // 上の行の同じ列
        handleCellEdit(rowsOrder[currentRowIndex - 1], colIndex);
      }
      else if (e.key === 'ArrowDown' && currentRowIndex < rowsOrder.length - 1) {
        // 下の行の同じ列
        handleCellEdit(rowsOrder[currentRowIndex + 1], colIndex);
      }
      else if (e.key === 'ArrowLeft' && colIndex > 0) {
        // 同じ行の前の列
        handleCellEdit(rowId, colIndex - 1);
      }
      else if (e.key === 'ArrowRight' && colIndex < 11) {
        // 同じ行の次の列
        handleCellEdit(rowId, colIndex + 1);
      }
    }
  };

  // 年間合計を計算
  const calculateYearlyTotal = (hourArray: number[]): number => {
    return hourArray.reduce((sum, hours) => sum + hours, 0);
  };

  // CSVファイルをエクスポートする関数
  const exportToCSV = (): void => {
    alert('CSVエクスポート機能はまだ実装されていません');
    // 実際のエクスポート処理を実装
  };

  // 一括申請する関数
  const submitBatch = (): void => {
    alert('一括申請機能はまだ実装されていません');
    // 実際の申請処理を実装
  };

  // 共通のテーブルセルスタイル
  const cellStyle = {
    width: '100%',
    height: '22px',
    border: 'none',
    textAlign: 'center' as const,
    background: 'transparent',
    fontSize: '12px',
    padding: '0'
  };

  // 読み取り専用セルスタイル
  const readonlyCellStyle = {
    ...cellStyle,
    backgroundColor: '#f8f9fa'
  };

  // 合計セルスタイル
  const totalCellStyle = {
    padding: '0 4px',
    textAlign: 'center' as const,
    backgroundColor: '#f0f0f0',
    fontSize: '12px'
  };

  return (
    <div className="monthly-info-tab">
      {/* 申告設定 */}
      <div className="declaration-settings">
        <h3 className="section-title">申告設定</h3>
        <div className="form-row">
          <div className="form-group">
            <label>申告年度</label>
            <select 
              value={fiscalYear} 
              onChange={handleFiscalYearChange}
              className="form-control"
            >
              <option value="2024年度">2024年度</option>
              <option value="2023年度">2023年度</option>
              <option value="2022年度">2022年度</option>
            </select>
          </div>
          <div className="form-group">
            <label>所定労働時間変動の有無</label>
            <select 
              value={laborTimeChange} 
              onChange={handleLaborTimeChangeToggle}
              className="form-control"
            >
              <option value="なし">なし</option>
              <option value="あり">あり</option>
            </select>
          </div>
        </div>
      </div>

      {/* 労働時間テーブル - スプレッドシートスタイル */}
      <div className="labor-hours-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>労働時間</h3>
          
          {/* 編集ボタンと保存ボタン */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              onClick={toggleEditMode}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isEditing ? '編集中止' : '編集'}
            </button>
            
            <button 
              type="button"
              onClick={handleSave}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3a66d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: isEditing ? 'block' : 'none'
              }}
            >
              保存
            </button>
          </div>
        </div>
        
        <div className="monthly-table-container" style={{ 
          backgroundColor: 'white', 
          border: '1px solid #dee2e6', 
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          <table className="monthly-table" style={{ 
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
                  width: '100px'
                }}></th>
                {months.map((month, index) => (
                  <th key={`month-${index}`} style={{ 
                    padding: '2px', 
                    textAlign: 'center', 
                    fontWeight: 'normal',
                    width: '60px'
                  }}>
                    {month}
                  </th>
                ))}
                <th style={{ 
                  padding: '2px', 
                  textAlign: 'center', 
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'normal',
                  width: '60px' // 月の列幅と同じにして40%サイズに縮小
                }}>
                  合計
                </th>
              </tr>
            </thead>
            <tbody>
              {/* 所定労働時間の行 */}
              <tr style={{ height: '22px' }}>
                <td style={{ 
                  textAlign: 'left', 
                  padding: '0 6px', 
                  position: 'sticky', 
                  left: 0, 
                  backgroundColor: 'white', 
                  zIndex: 1,
                  borderRight: '1px solid #f0f0f0',
                  whiteSpace: 'nowrap'
                }}>
                  所定時間
                </td>
                {monthlyData.standardHours.map((hours: number, index: number) => (
                  <td 
                    key={`standard-${index}`} 
                    style={{ 
                      padding: '0', 
                      textAlign: 'center', 
                      backgroundColor: activeCell.row === 'standardHours' && activeCell.col === index ? '#e9f2ff' : 'white'
                    }}
                    onClick={() => handleCellClick('standardHours', index)}
                  >
                    {(editingRow === 'standardHours' && editingCol === index && isEditing) ? (
                      <input
                        ref={(el: HTMLInputElement | null) => {
                          inputRefs.current[`input-standardHours-${index}`] = el;
                        }}
                        type="text"
                        style={cellStyle}
                        value={hours}
                        onChange={(e) => handleMonthlyDataChange('standardHours', index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => handleKeyDown(e, 'standardHours', index)}
                        onFocus={() => setActiveCell({row: 'standardHours', col: index})}
                      />
                    ) : (
                      <input
                        type="text"
                        style={isEditing ? cellStyle : readonlyCellStyle}
                        value={hours}
                        readOnly
                      />
                    )}
                  </td>
                ))}
                <td style={totalCellStyle}>
                  {calculateYearlyTotal(monthlyData.standardHours)}
                </td>
              </tr>
              
              {/* 実労働時間の行 */}
              <tr style={{ height: '22px' }}>
                <td style={{ 
                  textAlign: 'left', 
                  padding: '0 6px', 
                  position: 'sticky', 
                  left: 0, 
                  backgroundColor: 'white', 
                  zIndex: 1,
                  borderRight: '1px solid #f0f0f0',
                  whiteSpace: 'nowrap'
                }}>
                  実労働時間
                </td>
                {monthlyData.actualHours.map((hours: number, index: number) => (
                  <td 
                    key={`actual-${index}`} 
                    style={{ 
                      padding: '0', 
                      textAlign: 'center',
                      backgroundColor: activeCell.row === 'actualHours' && activeCell.col === index ? '#e9f2ff' : 'white'
                    }}
                    onClick={() => handleCellClick('actualHours', index)}
                  >
                    {(editingRow === 'actualHours' && editingCol === index && isEditing) ? (
                      <input
                        ref={(el: HTMLInputElement | null) => {
                          inputRefs.current[`input-actualHours-${index}`] = el;
                        }}
                        type="text"
                        style={cellStyle}
                        value={hours}
                        onChange={(e) => handleMonthlyDataChange('actualHours', index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => handleKeyDown(e, 'actualHours', index)}
                        onFocus={() => setActiveCell({row: 'actualHours', col: index})}
                      />
                    ) : (
                      <input
                        type="text"
                        style={isEditing ? cellStyle : readonlyCellStyle}
                        value={hours}
                        readOnly
                      />
                    )}
                  </td>
                ))}
                <td style={totalCellStyle}>
                  {calculateYearlyTotal(monthlyData.actualHours)}
                </td>
              </tr>
              
              {/* 在籍フラグの行 */}
              <tr style={{ height: '22px' }}>
                <td style={{ 
                  textAlign: 'left', 
                  padding: '0 6px', 
                  position: 'sticky', 
                  left: 0, 
                  backgroundColor: 'white', 
                  zIndex: 1,
                  borderRight: '1px solid #f0f0f0',
                  whiteSpace: 'nowrap'
                }}>
                  在籍フラグ
                </td>
                {monthlyData.attendanceFlag.map((flag: number, index: number) => (
                  <td 
                    key={`attendance-${index}`} 
                    style={{ 
                      padding: '0', 
                      textAlign: 'center',
                      backgroundColor: activeCell.row === 'attendanceFlag' && activeCell.col === index ? '#e9f2ff' : 'white'
                    }}
                    onClick={() => handleCellClick('attendanceFlag', index)}
                  >
                    {(editingRow === 'attendanceFlag' && editingCol === index && isEditing) ? (
                      <input
                        ref={(el: HTMLInputElement | null) => {
                          inputRefs.current[`input-attendanceFlag-${index}`] = el;
                        }}
                        type="text"
                        style={cellStyle}
                        value={flag}
                        onChange={(e) => handleMonthlyDataChange('attendanceFlag', index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => handleKeyDown(e, 'attendanceFlag', index)}
                        onFocus={() => setActiveCell({row: 'attendanceFlag', col: index})}
                      />
                    ) : (
                      <input
                        type="text"
                        style={isEditing ? cellStyle : readonlyCellStyle}
                        value={flag}
                        readOnly
                      />
                    )}
                  </td>
                ))}
                <td style={{ ...totalCellStyle, fontWeight: 'normal' }}></td>
              </tr>

              {/* カウント値の行 */}
              <tr style={{ height: '22px' }}>
                <td style={{ 
                  textAlign: 'left', 
                  padding: '0 6px', 
                  position: 'sticky', 
                  left: 0, 
                  backgroundColor: 'white', 
                  zIndex: 1,
                  borderRight: '1px solid #f0f0f0',
                  whiteSpace: 'nowrap'
                }}>
                  カウント
                </td>
                {monthlyData.countValues.map((count: number, index: number) => (
                  <td 
                    key={`count-${index}`} 
                    style={{ 
                      padding: '0', 
                      textAlign: 'center',
                      backgroundColor: activeCell.row === 'countValues' && activeCell.col === index ? '#e9f2ff' : 'white'
                    }}
                    onClick={() => handleCellClick('countValues', index)}
                  >
                    {(editingRow === 'countValues' && editingCol === index && isEditing) ? (
                      <input
                        ref={(el: HTMLInputElement | null) => {
                          inputRefs.current[`input-countValues-${index}`] = el;
                        }}
                        type="text"
                        style={cellStyle}
                        value={count.toFixed(1)}
                        onChange={(e) => handleMonthlyDataChange('countValues', index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => handleKeyDown(e, 'countValues', index)}
                        onFocus={() => setActiveCell({row: 'countValues', col: index})}
                      />
                    ) : (
                      <input
                        type="text"
                        style={isEditing ? cellStyle : readonlyCellStyle}
                        value={count.toFixed(1)}
                        readOnly
                      />
                    )}
                  </td>
                ))}
                <td style={{ ...totalCellStyle, fontWeight: 'normal' }}></td>
              </tr>

              {/* 備考の行 */}
              <tr style={{ height: '22px' }}>
                <td style={{ 
                  textAlign: 'left', 
                  padding: '0 6px', 
                  position: 'sticky', 
                  left: 0, 
                  backgroundColor: 'white', 
                  zIndex: 1,
                  borderRight: '1px solid #f0f0f0',
                  whiteSpace: 'nowrap'
                }}>
                  備考
                </td>
                {monthlyData.notes.map((note: string, index: number) => (
                  <td 
                    key={`note-${index}`} 
                    style={{ 
                      padding: '0', 
                      textAlign: 'center',
                      backgroundColor: activeCell.row === 'notes' && activeCell.col === index ? '#e9f2ff' : 'white'
                    }}
                    onClick={() => handleCellClick('notes', index)}
                  >
                    {(editingRow === 'notes' && editingCol === index && isEditing) ? (
                      <input
                        ref={(el: HTMLInputElement | null) => {
                          inputRefs.current[`input-notes-${index}`] = el;
                        }}
                        type="text"
                        style={cellStyle}
                        value={note}
                        onChange={(e) => handleMonthlyDataChange('notes', index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => handleKeyDown(e, 'notes', index)}
                        onFocus={() => setActiveCell({row: 'notes', col: index})}
                        placeholder="-"
                      />
                    ) : (
                      <input
                        type="text"
                        style={isEditing ? cellStyle : readonlyCellStyle}
                        value={note}
                        readOnly
                        placeholder="-"
                      />
                    )}
                  </td>
                ))}
                <td style={{ ...totalCellStyle, fontWeight: 'normal' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 年間合計 */}
      <div className="summary-section" style={{ marginTop: '20px' }}>
        <h3 className="section-title">年間合計</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontWeight: 'bold', width: '200px' }}>年間合計所定労働時間:</div>
            <div style={{ fontWeight: 'bold' }}>{calculateYearlyTotal(monthlyData.standardHours)}時間</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontWeight: 'bold', width: '200px' }}>年間合計実労働時間:</div>
            <div style={{ fontWeight: 'bold' }}>{calculateYearlyTotal(monthlyData.actualHours)}時間</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button 
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              padding: '6px 12px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={exportToCSV}
          >
            CSV出力
          </button>
          <button 
            style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              padding: '6px 12px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={submitBatch}
          >
            一括申請
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyInfo;