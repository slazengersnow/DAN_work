import React, { useState, useEffect } from 'react';
import { paymentReportApi, PaymentReport } from '../../api/paymentReportApi';

// PaymentReport型を拡張
interface ExtendedPaymentReport extends PaymentReport {
  type?: string;
  application_date?: string;
  payment_date?: string;
  fiscal_year?: number;
}

// インポートコンポーネント
const ImportPaymentHistory: React.FC<{
  onImportComplete?: (importedData: any[]) => void;
  onClose?: () => void;
}> = ({ onImportComplete, onClose }) => {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

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
          setImporting(true);
          setImportError(null);
          
          // FileReader でファイルを読み込む
          const reader = new FileReader();
          
          reader.onload = async (event) => {
            if (event.target && event.target.result) {
              const csvContent = event.target.result as string;
              
              // CSVをパースしてデータに変換
              const importedData = parseCSV(csvContent);
              
              // APIを呼び出してデータを保存
              try {
                // APIでデータを保存（本実装時はこちらを使用）
                for (const record of importedData) {
                  await saveImportedRecord(record);
                }
                
                console.log('CSVインポート完了:', importedData);
                
                // インポート完了通知
                if (onImportComplete) {
                  onImportComplete(importedData);
                }
                
                // モーダルを閉じる
                if (onClose) {
                  onClose();
                }
                
                setImporting(false);
                alert('CSVインポートが完了しました');
              } catch (saveError) {
                console.error('データ保存エラー:', saveError);
                setImportError('データの保存中にエラーが発生しました');
                setImporting(false);
              }
            }
          };
          
          reader.onerror = () => {
            setImportError('ファイルの読み込み中にエラーが発生しました');
            setImporting(false);
          };
          
          reader.readAsText(file, 'UTF-8');
          
        } catch (error) {
          console.error('CSVインポートエラー:', error);
          setImportError('CSVインポート中にエラーが発生しました');
          setImporting(false);
        }
      }
    };
    
    fileInput.click();
  };

  // CSVをパースする関数
  const parseCSV = (csvContent: string) => {
    // BOMを除去する
    const content = csvContent.replace(/^\uFEFF/, '');
    
    // 行に分割
    const rows = content.split(/\r?\n/).filter(row => row.trim() !== '');
    
    // ヘッダー行を取得
    const headers = rows[0].split(',');
    
    // データ行をパース
    const data = rows.slice(1).map(row => {
      const values = row.split(',');
      const record: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        // ヘッダーに対応する値を設定
        let value: any = values[index] ? values[index].trim() : '';
        
        // データ型の変換
        if (header === '金額') {
          // 数値に変換
          value = value ? parseInt(value, 10) : 0;
        }
        
        record[header] = value;
      });
      
      return record;
    });
    
    return data;
  };

  // インポートしたレコードを保存する関数
  const saveImportedRecord = async (record: Record<string, any>) => {
    // 年度から数値部分を抽出
    const yearMatch = record['年度'].match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    
    // 金額の正負を確認（納付金はマイナス、調整金はプラス）
    const isPayment = record['種別'] === '納付金';
    const amount = Math.abs(record['金額']);
    
    // PaymentReport APIに送信するデータを作成
    const paymentData = {
      year,
      fiscal_year: year,
      payment_amount: isPayment ? -amount : amount,
      status: record['状態'] === '作成中' ? '作成中' : '確定済み',
      type: record['種別'],
      application_date: record['申告日'] || '',
      payment_date: record['支払/受取日'] || '',
      notes: `${year}年度の${record['種別']}（CSVインポート）`
    };
    
    // APIを呼び出して保存
    await paymentReportApi.savePaymentReport(year, paymentData);
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
      
      {importError && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '8px 12px', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {importError}
        </div>
      )}
      
      <div style={importButtonsStyle}>
        <button
          onClick={handleDownloadTemplate}
          style={downloadButtonStyle}
          disabled={importing}
        >
          インポートテンプレートをダウンロード
        </button>
        
        <button
          onClick={handleFileSelect}
          style={selectButtonStyle}
          disabled={importing}
        >
          {importing ? 'インポート中...' : 'CSVファイルを選択'}
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            style={closeButtonStyle}
            disabled={importing}
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
  reportData?: any;
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

  // 日付フォーマット用のヘルパー関数
  const formatDate = (dateString: string | undefined, addDays = 0) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (addDays) {
        date.setDate(date.getDate() + addDays);
      }
      return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    } catch (e) {
      return '-';
    }
  };

  // APIからデータを取得する関数を独立させる
  const fetchPaymentReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // APIから納付金レポート履歴を取得
      const reports = await paymentReportApi.getAllPaymentReports();
      
      // APIのレスポンスを表示用のフォーマットに変換
      const formattedData: HistoryItem[] = reports.map((report) => {
        // 拡張された型にキャスト
        const extReport = report as ExtendedPaymentReport;
        
        // 種別を判定（納付金か調整金か）
        const type = extReport.type || ((report.payment_amount ?? 0) < 0 ? '納付金' : '調整金');
        
        // 支払状態を判定
        const status = report.status === '作成中' 
          ? '作成中'
          : ((report.payment_amount ?? 0) < 0 ? '支払済' : '受取済');
        
        // 日付をフォーマット
        const applicationDate = extReport.application_date || formatDate(report.updated_at);
        const paymentDate = extReport.payment_date || (status !== '作成中' ? formatDate(report.updated_at, 45) : '-');
        
        // 金額のデフォルト値を設定
        const amount = report.payment_amount ?? 0;
        
        return {
          id: report.id || 0,
          year: `${extReport.fiscal_year || report.year || new Date().getFullYear()}年度`,
          type,
          amount: amount,
          applicationDate,
          paymentDate,
          status
        };
      });
      
      // データが取得できた場合、それを使用
      if (formattedData.length > 0) {
        setHistoryData(formattedData);
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '納付金レポート履歴の取得に失敗しました');
      console.error('納付金レポート履歴の取得エラー:', err);
    }
  };

  // APIからデータを取得
  useEffect(() => {
    fetchPaymentReports();
  }, []);

  // 状態管理
  const [showImport, setShowImport] = useState(false);
  
  // インポート完了ハンドラ
  const handleImportComplete = (importedData: any[]) => {
    console.log('インポート完了', importedData);
    // データの再読み込み
    fetchPaymentReports();
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