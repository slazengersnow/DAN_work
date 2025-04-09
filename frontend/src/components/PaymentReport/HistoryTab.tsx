import React, { useState, useEffect } from 'react';
import { paymentReportApi, PaymentReport } from '../../api/paymentReportApi';

// インポートコンポーネント
const ImportPaymentHistory: React.FC<{
  onImportComplete?: (importedData: any[]) => void;
  onClose?: () => void;
}> = ({ onImportComplete, onClose }) => {
  // テンプレートダウンロード処理
  const handleDownloadTemplate = async () => {
    try {
      // CSVテンプレートの内容（BOM付きUTF-8でエンコード）
      const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const templateContent = `年度,種別,金額,申告日,支払/受取日,状態
2024年度,調整金,533412,2025/05/14,2025/07/16,受取済
2023年度,納付金,-300000,2024/05/15,2024/06/30,支払済
,,,,,`;
      
      // CSVファイルを作成（BOMを追加してUTF-8エンコーディングを明示）
      const blob = new Blob([BOM, templateContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'noufukin_shinkoku_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('納付金申告テンプレートをダウンロードしました');
    } catch (error) {
      console.error('テンプレートダウンロードエラー:', error);
      alert('テンプレートのダウンロード中にエラーが発生しました');
    }
  };

  // CSVファイル選択処理
  const handleFileSelect = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          console.log(`CSVファイル "${file.name}" をインポートしました（モック処理）`);
          alert('CSVインポートが完了しました（モック処理）');
          
          // インポート完了通知
          if (onImportComplete) {
            onImportComplete([]);
          }
          
          // モーダルを閉じる
          if (onClose) {
            onClose();
          }
        } catch (error) {
          console.error('CSVインポートエラー:', error);
          alert('CSVインポート中にエラーが発生しました');
        }
      }
    };
    
    fileInput.click();
  };

  // スタイル定義
  const importContainerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    width: '80%',
    maxWidth: '500px',
    zIndex: 1000
  };
  
  const importTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    marginBottom: '20px',
    textAlign: 'center'
  };
  
  const importButtonsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  };
  
  const buttonBaseStyle: React.CSSProperties = {
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };
  
  const downloadButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#4A60DD',
    color: 'white'
  };
  
  const selectButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#f1f1f1',
    border: '1px solid #ddd',
    color: '#333333'  // フォントカラーを濃い色に変更
  };
  
  const closeButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#6c757d',
    color: 'white',
    marginTop: '10px',
    alignSelf: 'flex-end',
    width: 'auto',
    padding: '8px 15px'
  };

  return (
    <div style={importContainerStyle}>
      <h3 style={importTitleStyle}>納付金申告のインポート</h3>
      
      <div style={importButtonsStyle}>
        <button
          onClick={handleDownloadTemplate}
          style={downloadButtonStyle}
        >
          インポートテンプレートをダウンロード
        </button>
        
        <button
          onClick={handleFileSelect}
          style={selectButtonStyle}
        >
          CSVファイルを選択
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            style={closeButtonStyle}
          >
            閉じる
          </button>
        )}
      </div>
    </div>
  );
};

interface HistoryTabProps {
  fiscalYear: string;
}

// 表示用の履歴データ型定義
interface HistoryItem {
  id: number;
  year: string;
  type: string;
  amount: number;
  applicationDate: string;
  paymentDate: string;
  status: string;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ fiscalYear }) => {
  // API連携用の状態
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 履歴データの状態
  const [historyData, setHistoryData] = useState<HistoryItem[]>([
    { 
      id: 1,
      year: '2024年度', 
      type: '調整金', 
      amount: 533412, 
      applicationDate: '2025/05/14', 
      paymentDate: '2025/07/16', 
      status: '受取済' 
    },
    { 
      id: 2,
      year: '2023年度', 
      type: '調整金', 
      amount: 487200, 
      applicationDate: '2024/05/15', 
      paymentDate: '2024/07/22', 
      status: '受取済' 
    },
    { 
      id: 3,
      year: '2022年度', 
      type: '納付金', 
      amount: -240000, 
      applicationDate: '2023/05/12', 
      paymentDate: '2023/06/30', 
      status: '支払済' 
    },
    { 
      id: 4,
      year: '2021年度', 
      type: '納付金', 
      amount: -600000, 
      applicationDate: '2022/05/16', 
      paymentDate: '2022/07/05', 
      status: '支払済' 
    },
    { 
      id: 5,
      year: '2020年度', 
      type: '納付金', 
      amount: -840000, 
      applicationDate: '2021/05/14', 
      paymentDate: '2021/07/12', 
      status: '支払済' 
    }
  ]);

  // APIからデータを取得
  useEffect(() => {
    const fetchPaymentReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // APIから納付金レポート履歴を取得
        const reports = await paymentReportApi.getAllPaymentReports();
        
        // APIのレスポンスを表示用のフォーマットに変換
        const formattedData: HistoryItem[] = reports.map((report) => {
          // 種別を判定（納付金か調整金か）
          const type = report.payment_amount > 0 ? '納付金' : '調整金';
          // 支払状態を判定
          const status = report.status === '確定済み' 
            ? (report.payment_amount > 0 ? '支払済' : '受取済')
            : '作成中';
          
          // 日付をフォーマット
          const updatedDate = new Date(report.updated_at || '');
          const applicationDate = `${updatedDate.getFullYear()}/${(updatedDate.getMonth() + 1).toString().padStart(2, '0')}/${updatedDate.getDate().toString().padStart(2, '0')}`;
          
          // 支払/受取日（仮の値、実際のAPIレスポンスに合わせて調整）
          const paymentDate = status !== '作成中'
            ? `${updatedDate.getFullYear()}/${(updatedDate.getMonth() + 2).toString().padStart(2, '0')}/${updatedDate.getDate().toString().padStart(2, '0')}`
            : '-';
          
          return {
            id: report.id || 0, // idがundefinedの場合は0を使用
            year: `${report.year}年度`,
            type,
            // 納付金はマイナス表示、調整金はプラス表示
            amount: type === '納付金' ? -Math.abs(report.payment_amount) : Math.abs(report.payment_amount),
            applicationDate,
            paymentDate,
            status
          };
        });
        
        // もしAPIからデータが取得できる場合は、モックデータを置き換える
        if (formattedData.length > 0) {
          setHistoryData(formattedData);
        }
        // ※開発中は既存のモックデータを使用し、APIが完成したら上記のコメントを外す
        
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : '納付金レポート履歴の取得に失敗しました');
        console.error('納付金レポート履歴の取得エラー:', err);
      }
    };
    
    // APIからデータを取得
    fetchPaymentReports();
  }, []);

  // 状態管理
  const [showImport, setShowImport] = useState(false);
  
  // インポート完了ハンドラ
  const handleImportComplete = (importedData: any[]) => {
    console.log('インポート完了', importedData);
    // ここで履歴データを更新する処理を実装
    // APIを使用して更新する場合
    // const updateData = async () => {
    //   setLoading(true);
    //   try {
    //     // CSVデータをAPIに送信
    //     await paymentReportApi.importReports(importedData);
    //     // 再度データを取得して表示を更新
    //     const reports = await paymentReportApi.getAllPaymentReports();
    //     // データの変換処理...
    //     setLoading(false);
    //   } catch (err) {
    //     setError(err instanceof Error ? err.message : 'インポート中にエラーが発生しました');
    //     setLoading(false);
    //   }
    // };
    // updateData();
  };
  
  // インポートモーダルを閉じる
  const handleCloseImport = () => {
    setShowImport(false);
  };

  // 金額の表示フォーマット
  const formatNumber = (num: number) => {
    return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // 調整金・納付金の表示色
  const getPaymentColor = (amount: number) => {
    return amount >= 0 ? '#28a745' : '#dc3545';
  };
  
  // ステータスバッジのスタイル
  const getStatusStyle = (status: string) => {
    const baseStyle = {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '9999px',
      fontSize: '12px'
    };
    
    if (status === '受取済') {
      return {
        ...baseStyle,
        backgroundColor: '#d1fae5',
        color: '#065f46'
      };
    } else if (status === '支払済') {
      return {
        ...baseStyle,
        backgroundColor: '#dbeafe',
        color: '#1e40af'
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: '#f3f4f6',
        color: '#374151'
      };
    }
  };
  
  // スタイル定義
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    padding: '20px'
  };
  
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  };
  
  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600
  };
  
  const importBtnStyle: React.CSSProperties = {
    backgroundColor: '#4A60DD',
    color: 'white',
    padding: '8px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };
  
  const tableContainerStyle: React.CSSProperties = {
    overflowX: 'auto'
  };
  
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse'
  };
  
  const thStyle: React.CSSProperties = {
    padding: '12px',
    border: '1px solid #e2e8f0',
    textAlign: 'left',
    backgroundColor: '#f8fafc',
    fontWeight: 600
  };
  
  const tdStyle: React.CSSProperties = {
    padding: '12px',
    border: '1px solid #e2e8f0',
    textAlign: 'left'
  };
  
  const amountCellStyle: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'right'
  };
  
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50
  };
  
  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '20px',
    color: '#4A60DD'
  };
  
  const errorStyle: React.CSSProperties = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px'
  };

  return (
    <div style={containerStyle}>
      {/* ヘッダー部分 - CSVインポートボタンを右端に配置（青色背景） */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>障害者雇用納付金・調整金申告履歴</h3>
        <button 
          onClick={() => setShowImport(true)}
          style={importBtnStyle}
        >
          CSVインポート
        </button>
      </div>
      
      {/* エラーメッセージ表示 */}
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}
      
      {/* ローディング表示 */}
      {loading ? (
        <div style={loadingStyle}>
          データを読み込み中...
        </div>
      ) : (
        /* 履歴テーブル */
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>年度</th>
                <th style={thStyle}>種別</th>
                <th style={thStyle}>金額</th>
                <th style={thStyle}>申告日</th>
                <th style={thStyle}>支払/受取日</th>
                <th style={thStyle}>状態</th>
              </tr>
            </thead>
            <tbody>
              {historyData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{...tdStyle, textAlign: 'center'}}>
                    申告履歴がありません
                  </td>
                </tr>
              ) : (
                historyData.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.year}</td>
                    <td style={tdStyle}>{item.type}</td>
                    <td style={{...amountCellStyle, color: getPaymentColor(item.amount)}}>
                      {item.amount < 0 ? '-' : ''}{formatNumber(Math.abs(item.amount))}円
                    </td>
                    <td style={tdStyle}>{item.applicationDate}</td>
                    <td style={tdStyle}>{item.paymentDate}</td>
                    <td style={tdStyle}>
                      <span style={getStatusStyle(item.status)}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* インポートモーダルのオーバーレイ */}
      {showImport && (
        <div style={overlayStyle}>
          <ImportPaymentHistory 
            onImportComplete={handleImportComplete}
            onClose={handleCloseImport}
          />
        </div>
      )}
    </div>
  );
};

export default HistoryTab;