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

  // 月次データの編集ハンドラ
  const handleMonthlyDataChange = (field: 'standardHours' | 'actualHours' | 'notes', monthIndex: number, value: string | number): void => {
    const newMonthlyData = { ...monthlyData };
    
    if (field === 'notes') {
      newMonthlyData[field][monthIndex] = value as string;
    } else {
      newMonthlyData[field][monthIndex] = Number(value);
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

      {/* 労働時間テーブル */}
      <div className="labor-hours-table">
        <h3 className="section-subtitle">労働時間 ({fiscalYear})</h3>
        <div className="table-container">
          <table className="monthly-table">
            <thead>
              <tr>
                <th>項目</th>
                {months.map((month, index) => (
                  <th key={index} className="month-header">{month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>所定時間</td>
                {monthlyData.standardHours.map((hours, index) => (
                  <td key={index}>
                    <input 
                      type="number" 
                      value={hours} 
                      onChange={(e) => handleMonthlyDataChange('standardHours', index, e.target.value)}
                      className="form-control text-center"
                      min="0"
                      max="200"
                      disabled={laborTimeChange === 'なし'}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td>実労働時間</td>
                {monthlyData.actualHours.map((hours, index) => (
                  <td key={index}>
                    <input 
                      type="number" 
                      value={hours} 
                      onChange={(e) => handleMonthlyDataChange('actualHours', index, e.target.value)}
                      className="form-control text-center"
                      min="0"
                      max="200"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td>非勤工リー理由</td>
                {monthlyData.notes.map((note, index) => (
                  <td key={index}>
                    <input 
                      type="text" 
                      value={note} 
                      onChange={(e) => handleMonthlyDataChange('notes', index, e.target.value)}
                      className="form-control text-center"
                      placeholder="-"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td>在籍フラグ</td>
                {monthlyData.attendanceFlag.map((flag, index) => (
                  <td key={index}>{flag}</td>
                ))}
              </tr>
              <tr>
                <td>申告フラグ</td>
                {monthlyData.reportFlag.map((flag, index) => (
                  <td key={index}>{flag}</td>
                ))}
              </tr>
              <tr>
                <td>カウント</td>
                {monthlyData.countValues.map((count, index) => (
                  <td key={index}>{count.toFixed(1)}</td>
                ))}
              </tr>
            </tbody>
          </table>
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