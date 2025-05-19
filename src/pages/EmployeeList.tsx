import React, { useState, useEffect } from 'react';
import { 
  ElementDetector, 
  DOMManipulator,
  ElementDetector as elementDetection 
} from '../utils/common';

const EmployeeList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<string>('10');
  
  // 社員データ（サンプル）
  const employees = [
    { id: '1001', name: '山田 太郎', disabilityType: '身体障害', disabilityDetail: '視覚', grade: '1級', count: 2, status: '在籍中' },
    { id: '1002', name: '鈴木 花子', disabilityType: '身体障害', disabilityDetail: '肢体', grade: '2級', count: 1, status: '在籍中' },
    { id: '1003', name: '佐藤 一郎', disabilityType: '知的障害', disabilityDetail: 'B', grade: '', count: 1, status: '在籍中' },
    { id: '1004', name: '田中 隆太', disabilityType: '身体障害', disabilityDetail: '聴覚', grade: '3級', count: 0.5, status: '在籍中' },
    { id: '1005', name: '伊藤 由美', disabilityType: '精神障害', disabilityDetail: 'うつ病', grade: '3級', count: 1, status: '在籍中' },
    { id: '1006', name: '渡辺 隆', disabilityType: '身体障害', disabilityDetail: '肢体', grade: '2級', count: 1, status: '退職' },
    { id: '1007', name: '高橋 恵子', disabilityType: '知的障害', disabilityDetail: 'A', grade: '', count: 1, status: '在籍中' },
  ];
  
  // 社員リストのフィルタリング機能強化コード
  const enhanceFilterFunction = () => {
    // 修正1: findButtonsByTextメソッドのエラー修正
    const filterButtons = elementDetection.findFormElements(['button']).elements || [];
    
    if (filterButtons.length > 0) {
      // 既存のイベントリスナーを保持するためのラッパー関数を作成
      filterButtons.forEach(button => {
        // 修正2: TypeScriptの型安全性を確保
        const buttonElement = button as HTMLButtonElement;
        const originalOnClick = buttonElement.onclick;
        
        buttonElement.onclick = (event) => {
          // 元のイベントハンドラを実行
          if (originalOnClick) {
            originalOnClick.call(buttonElement, event);
          }
          
          // 拡張機能：フィルターが適用された後に実行
          setTimeout(() => {
            // フィルター適用後のテーブル行を取得
            const tableRows = document.querySelectorAll('.employee-table tr');
            
            // フィルター結果にハイライトを適用
            if (tableRows.length > 1) { // ヘッダー行を除く
              // 修正3: CSSプロパティ名をキャメルケースに変更
              tableRows.forEach((row, index) => {
                if (index > 0) { // ヘッダー行をスキップ
                  DOMManipulator.applyStyles(row, {
                    transition: 'background-color 0.3s ease'
                  });
                  
                  // 交互の行に異なる背景色を適用
                  const rowElement = row as HTMLElement;
                  if ((index - 1) % 2 === 0) {
                    rowElement.style.backgroundColor = '#f8f9fa';
                  } else {
                    rowElement.style.backgroundColor = '#ffffff';
                  }
                }
              });
            }
          }, 300);
        };
      });
    }
  };
  
  useEffect(() => {
    // 社員リストページのセットアップ
    const setupEmployeeList = async () => {
      // テーブルが読み込まれるのを待つ
      // 修正4: waitForElementの使用方法を修正
      const employeeTable = await new Promise<Element | null>(resolve => {
        const element = document.querySelector('.employee-table');
        if (element) {
          resolve(element);
          return;
        }

        setTimeout(() => {
          resolve(document.querySelector('.employee-table'));
        }, 2000);
      });
      
      if (employeeTable) {
        // フィルタリング機能を強化
        enhanceFilterFunction();
        
        // テーブルの各行にイベントリスナーを追加（詳細表示の強化）
        const tableRows = document.querySelectorAll('.employee-table tbody tr');
        
        // 修正5: イベントハンドラ関数を定義して参照を保持
        const handleRowClick = (e: Event) => {
          // 操作ボタンがクリックされた場合はスキップ
          if ((e.target as HTMLElement).closest('button')) {
            return;
          }
          
          // 行クリックで詳細表示を有効化（既存機能を妨げないよう注意）
          const row = e.currentTarget as HTMLElement;
          const employeeId = row.getAttribute('data-employee-id');
          if (employeeId) {
            // 既存の詳細表示機能を尊重（実装に応じて調整）
            console.log('Employee selected:', employeeId);
          }
        };
        
        tableRows.forEach(row => {
          row.addEventListener('click', handleRowClick);
        });
        
        // クリーンアップのために参照を保持
        // 修正6: 後でクリーンアップで使用するため、handleRowClickをwindowに保存
        (window as any).__employeeListHandlers = {
          handleRowClick
        };
      }
    };
    
    setupEmployeeList();
    
    // クリーンアップ
    return () => {
      // 修正7: 適切なイベントリスナーのクリーンアップ
      if ((window as any).__employeeListHandlers) {
        const { handleRowClick } = (window as any).__employeeListHandlers;
        const tableRows = document.querySelectorAll('.employee-table tbody tr');
        tableRows.forEach(row => {
          row.removeEventListener('click', handleRowClick);
        });
        
        // クリーンアップ後に参照を削除
        delete (window as any).__employeeListHandlers;
      }
    };
  }, []);
  
  // 検索フィルター
  const filteredEmployees = employees.filter(employee => 
    employee.name.includes(searchQuery) || 
    employee.id.includes(searchQuery)
  );

  return (
    <div className="page-container">
      <h1 className="page-title">社員リスト</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <input 
          type="text"
          placeholder="社員名または社員IDで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '300px' }}
        />
        
        <div>
          <select style={{ marginRight: '10px' }}>
            <option value="all">障害種別 ▼</option>
            <option value="physical">身体障害</option>
            <option value="intellectual">知的障害</option>
            <option value="mental">精神障害</option>
          </select>
          
          <select style={{ marginRight: '10px' }}>
            <option value="all">ステータス ▼</option>
            <option value="active">在籍中</option>
            <option value="inactive">退職</option>
          </select>
          
          <button>新規追加</button>
        </div>
      </div>
      
      <table className="data-table employee-table">
        <thead>
          <tr>
            <th>社員ID</th>
            <th>氏名</th>
            <th>障害種別</th>
            <th>障害</th>
            <th>等級</th>
            <th>カウント</th>
            <th>ステータス</th>
            <th>詳細</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(employee => (
            <tr key={employee.id} data-employee-id={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.name}</td>
              <td>{employee.disabilityType}</td>
              <td>{employee.disabilityDetail}</td>
              <td>{employee.grade}</td>
              <td>{employee.count}</td>
              <td>
                <span className={`status-badge ${employee.status === '在籍中' ? 'status-active' : 'status-inactive'}`}>
                  {employee.status}
                </span>
              </td>
              <td>
                <button className="secondary">詳細</button>
              </td>
              <td>
                <button className="secondary">編集</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignItems: 'center' }}>
        <div>全 {filteredEmployees.length} 件中 1-{Math.min(filteredEmployees.length, parseInt(displayCount))} 件を表示</div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>表示件数:</span>
          <select 
            value={displayCount}
            onChange={(e) => setDisplayCount(e.target.value)}
            style={{ marginRight: '10px' }}
          >
            <option value="10">10件</option>
            <option value="20">20件</option>
            <option value="50">50件</option>
          </select>
          <button style={{ marginLeft: '10px' }} className="filter-button">フィルター</button>
          <button style={{ marginLeft: '10px' }}>CSVエクスポート</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;