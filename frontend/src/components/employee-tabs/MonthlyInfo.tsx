// src/components/employee-tabs/MonthlyInfo.tsx
import React, { useState, ChangeEvent } from 'react';
import { TabProps } from '../../types/Employee';

const MonthlyInfo: React.FC<TabProps> = ({ employeeData, onUpdate }) => {
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  const [laborTimeChange, setLaborTimeChange] = useState<string>('なし');
  
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
  const [activeCell, setActiveCell] = useState<{row: number, col: number} | null>(null);

  // 月名の配列
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

  // 年度変更ハンドラ
  const handleFiscalYearChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setFiscalYear(e.target.value);
    // APIから該当年度のデータを取得する処理などを追加
  };

  // 労働時間変動有無の変更ハンドラ
  const handleLaborTimeChangeToggle = (e: ChangeEvent<HTMLSelectElement>): void => {
    setLaborTimeChange(e.target.value);
  };

  // セルフォーカス時の処理
  const handleCellFocus = (e: React.FocusEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    e.target.select();
    setActiveCell({ row: rowIndex, col: colIndex });
  };

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    let nextRow = rowIndex;
    let nextCol = colIndex;

    switch (e.key) {
      case 'ArrowUp':
        if (rowIndex > 0) nextRow = rowIndex - 1;
        break;
      case 'ArrowDown':
        if (rowIndex < 3) nextRow = rowIndex + 1; // 4行あるので最大値は3
        break;
      case 'ArrowLeft':
        if (colIndex > 0) nextCol = colIndex - 1;
        break;
      case 'ArrowRight':
        if (colIndex < 11) nextCol = colIndex + 1; // 12ヶ月なので最大値は11
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tabで前のセルへ
          if (colIndex > 0) {
            nextCol = colIndex - 1;
          } else if (rowIndex > 0) {
            nextRow = rowIndex - 1;
            nextCol = 11;
          }
        } else {
          // Tabで次のセルへ
          if (colIndex < 11) {
            nextCol = colIndex + 1;
          } else if (rowIndex < 3) {
            nextRow = rowIndex + 1;
            nextCol = 0;
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (rowIndex < 3) {
          nextRow = rowIndex + 1;
        } else {
          nextRow = 0;
          nextCol = (colIndex + 1) % 12;
        }
        break;
      default:
        return;
    }

    // 次のセルにフォーカス
    setActiveCell({ row: nextRow, col: nextCol });

    // 次のセルのIDを生成して要素を取得
    const nextCellId = `cell-${nextRow}-${nextCol}`;
    const nextCellElement = document.getElementById(nextCellId);
    if (nextCellElement) {
      (nextCellElement as HTMLInputElement).focus();
    }
  };

  // 月次データの編集ハンドラ
  const handleMonthlyDataChange = (field: 'standardHours' | 'actualHours' | 'notes', monthIndex: number, value: string): void => {
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
    
    // 親コンポーネントにデータ更新を通知
    onUpdate({ monthlyData: newMonthlyData });
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

  return (
    <div className="monthly-info-tab">
      {/* 申告設定 */}
      <div className="declaration-settings">
        <h3 className="section-subtitle">申告設定</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>申告年度</label>
            <div className="select-wrapper">
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
          </div>
          <div className="form-group">
            <label>所定労働時間変動の有無</label>
            <div className="select-wrapper">
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
      </div>

      {/* スプレッドシート風労働時間テーブル */}
      <div className="labor-hours-section">
        <h3 className="section-subtitle">労働時間 ({fiscalYear})</h3>
        
        <div className="spreadsheet-container">
          <div className="spreadsheet-table">
            <div className="spreadsheet-header-row">
              <div className="spreadsheet-header-cell first-cell"></div>
              {months.map((month, index) => (
                <div key={`header-${index}`} className="spreadsheet-header-cell">{month}</div>
              ))}
            </div>
            
            {/* 所定労働時間の行 */}
            <div className="spreadsheet-row">
              <div className="spreadsheet-row-header">所定時間</div>
              {monthlyData.standardHours.map((hours: number, index: number) => (
                <div key={`standard-${index}`} className="spreadsheet-cell">
                  <input
                    id={`cell-0-${index}`}
                    type="text"
                    className="cell-input"
                    value={hours}
                    onChange={(e) => handleMonthlyDataChange('standardHours', index, e.target.value)}
                    onFocus={(e) => handleCellFocus(e, 0, index)}
                    onKeyDown={(e) => handleKeyDown(e, 0, index)}
                    disabled={laborTimeChange === 'なし'}
                  />
                </div>
              ))}
            </div>
            
            {/* 実労働時間の行 */}
            <div className="spreadsheet-row">
              <div className="spreadsheet-row-header">実労働時間</div>
              {monthlyData.actualHours.map((hours: number, index: number) => (
                <div key={`actual-${index}`} className="spreadsheet-cell">
                  <input
                    id={`cell-1-${index}`}
                    type="text"
                    className="cell-input"
                    value={hours}
                    onChange={(e) => handleMonthlyDataChange('actualHours', index, e.target.value)}
                    onFocus={(e) => handleCellFocus(e, 1, index)}
                    onKeyDown={(e) => handleKeyDown(e, 1, index)}
                  />
                </div>
              ))}
            </div>
            
            {/* 在籍フラグの行 */}
            <div className="spreadsheet-row">
              <div className="spreadsheet-row-header">在籍フラグ</div>
              {monthlyData.attendanceFlag.map((flag: number, index: number) => (
                <div key={`attendance-${index}`} className="spreadsheet-cell">
                  <span className="cell-text">{flag}</span>
                </div>
              ))}
            </div>

            {/* カウント値の行 */}
            <div className="spreadsheet-row">
              <div className="spreadsheet-row-header">カウント</div>
              {monthlyData.countValues.map((count: number, index: number) => (
                <div key={`count-${index}`} className="spreadsheet-cell">
                  <span className="cell-text">{count.toFixed(1)}</span>
                </div>
              ))}
            </div>

            {/* 備考の行 */}
            <div className="spreadsheet-row">
              <div className="spreadsheet-row-header">備考</div>
              {monthlyData.notes.map((note: string, index: number) => (
                <div key={`note-${index}`} className="spreadsheet-cell">
                  <input
                    id={`cell-2-${index}`}
                    type="text"
                    className="cell-input"
                    value={note}
                    onChange={(e) => handleMonthlyDataChange('notes', index, e.target.value)}
                    onFocus={(e) => handleCellFocus(e, 2, index)}
                    onKeyDown={(e) => handleKeyDown(e, 2, index)}
                    placeholder="-"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 年間合計 */}
      <div className="summary-section">
        <h3 className="section-subtitle">年間合計</h3>
        <div className="summary-row">
          <div className="summary-label">年間合計所定労働時間:</div>
          <div className="summary-value">{calculateYearlyTotal(monthlyData.standardHours)}時間</div>
        </div>
        <div className="summary-row">
          <div className="summary-label">年間合計実労働時間:</div>
          <div className="summary-value">{calculateYearlyTotal(monthlyData.actualHours)}時間</div>
        </div>
        
        <div className="action-row">
          <button 
            className="export-btn"
            onClick={exportToCSV}
          >
            CSV出力
          </button>
          <button 
            className="submit-btn"
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