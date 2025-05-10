# 月次レポートシステム改善モジュール導入ガイド

このガイドでは、月次レポートシステムを改善するための各モジュールの導入方法について詳しく説明します。

## 概要

以下の3つのモジュールを作成しました：

1. **YearStateManager.js** - 年度管理の改善
2. **ImportNotificationEnhancer.js** - インポート完了通知の改善
3. **ErrorDiagnosticTool.js** - エラー診断と分析

## 1. YearStateManager.js の導入

このモジュールは、CSVインポート後に年度が2025年に勝手に切り替わる問題を修正します。

### 導入手順

#### Step 1: YearMonthContext.tsx に統合

`YearMonthContext.tsx` ファイルを開き、以下のコードを追加します：

```tsx
// YearStateManager のインポート
import { useYearStateManager } from './YearStateManager';

// YearMonthProvider 内部の修正
export const YearMonthProvider: React.FC<YearMonthProviderProps> = ({ 
  children, 
  initialYear,
  initialMonth 
}) => {
  // 既存のコード...
  
  // 年度状態マネージャーを追加
  const yearStateManager = useYearStateManager(fiscalYear, setFiscalYear);
  
  // コンテキスト値に追加
  return (
    <YearMonthContext.Provider value={{ 
      fiscalYear, 
      month, 
      setFiscalYear, 
      setMonth,
      dispatchYearMonthChange,
      yearStateManager // ここに追加
    }}>
      {children}
    </YearMonthContext.Provider>
  );
};
```

#### Step 2: CSVImportModal.tsx に統合

`CSVImportModal.tsx` ファイルを開き、以下のように修正します：

```tsx
// YearMonthContext のインポート
import YearMonthContext, { useYearMonth } from './YearMonthContext';

// コンポーネント内
const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImportSuccess, fiscalYear }) => {
  // 年度状態マネージャーの取得
  const { yearStateManager } = useYearMonth();
  
  // インポート前に年度を記録
  useEffect(() => {
    if (isOpen) {
      // モーダルが開かれたときに年度を記録
      yearStateManager.recordPreImportYear();
    }
  }, [isOpen, yearStateManager]);
  
  // 既存のimportCSVData関数内で、成功時に年度を復元
  const importCSVData = async (data) => {
    try {
      // 既存のコード...
      
      if (successResponses.length > 0) {
        // 年度を復元
        yearStateManager.restoreYearAfterImport();
        
        // 既存の成功処理...
        onImportSuccess();
      }
    } catch (error) {
      // 既存のエラー処理...
    }
  };
  
  // 残りのコンポーネントコード...
};
```

## 2. ImportNotificationEnhancer.js の導入

このモジュールは、インポート成功時に明確なフィードバックを提供します。

### 導入手順

#### Step 1: スタイルシートの確認

`ImportNotificationEnhancer.css` ファイルが正しくコピーされていることを確認します。

#### Step 2: CSVImportModal.tsx に統合

`CSVImportModal.tsx` ファイルを開き、以下のコードを追加します：

```tsx
// インポート
import { useImportNotification } from './ImportNotificationEnhancer';

// コンポーネント内
const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImportSuccess, fiscalYear }) => {
  // 通知機能を初期化
  const importNotification = useImportNotification();
  const { Toasts, DetailModal } = importNotification;
  
  // 既存のimportCSVData関数内で、成功時の通知
  const importCSVData = async (data) => {
    try {
      // 既存のコード...
      
      if (successResponses.length > 0) {
        // インポート結果からサマリーを作成
        const importSummary = importNotification.createImportSummary({
          newItems: [...], // 新規作成された項目
          updatedItems: [...], // 更新された項目
          errorItems: [...] // エラーのあった項目
        }, fiscalYear);
        
        // 成功通知を表示
        importNotification.notifyImportSuccess(importSummary);
        
        // 既存の成功処理...
      }
    } catch (error) {
      // エラー通知
      importNotification.notifyImportError('インポート処理中にエラーが発生しました', error);
      // 既存のエラー処理...
    }
  };
  
  // レンダリング部分（return）の最後に通知コンポーネントを追加
  return (
    <>
      <div className="csv-import-modal-overlay">
        {/* 既存のモーダル内容 */}
      </div>
      
      {/* 通知コンポーネント */}
      <Toasts position="top-right" />
      <DetailModal />
    </>
  );
};
```

## 3. ErrorDiagnosticTool.js の導入

このモジュールは、web-client-content-script.js で発生しているエラーを診断します。

### 導入手順

#### Step 1: エラー境界コンポーネントの設定

アプリケーションのルートコンポーネントまたは月次レポートコンポーネントを `ErrorBoundary` でラップします：

```tsx
// App.tsx または MonthlyReport/index.tsx
import { ErrorBoundary } from './ErrorDiagnosticTool';

const App = () => {
  return (
    <ErrorBoundary componentName="App">
      {/* アプリケーションコンテンツ */}
    </ErrorBoundary>
  );
};
```

#### Step 2: カスタムフックの使用

エラー診断機能が必要なコンポーネントで、カスタムフックを使用します：

```tsx
// CSVImportModal.tsx または他のコンポーネント
import { useErrorDiagnostics } from './ErrorDiagnosticTool';

const CSVImportModal = () => {
  // エラー診断ツールを初期化
  const { logError, showDiagnosticReport } = useErrorDiagnostics();
  
  // エラーを記録する例
  const handleError = (error) => {
    logError(error, 'csv_import');
    
    // 必要に応じて診断レポートを表示
    // showDiagnosticReport();
  };
  
  // コンポーネントのコード...
};
```

#### Step 3: デバッグボタンの追加（開発環境のみ）

開発環境でデバッグボタンを追加します：

```tsx
// 開発環境のみ表示されるデバッグボタン
{process.env.NODE_ENV === 'development' && (
  <button 
    onClick={() => window.csvErrorDiagnostics?.showDiagnosticReport()} 
    style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px',
      zIndex: 9999,
      padding: '8px 16px',
      background: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    診断レポート
  </button>
)}
```

## 導入順序と確認方法

以下の順序で導入することをおすすめします：

1. **ErrorDiagnosticTool.js** - まず診断ツールを導入して現在のエラーを把握
2. **YearStateManager.js** - 年度管理問題を解決
3. **ImportNotificationEnhancer.js** - ユーザー体験を向上

導入後は以下の手順で動作確認を行ってください：

1. 開発サーバーを再起動 (`npm start`)
2. CSVファイルのインポートを実行
3. 年度が正しく維持されているか確認
4. インポート完了通知が表示されるか確認
5. エラーが発生した場合、診断レポートが役立つか確認

## トラブルシューティング

問題が発生した場合は、以下の方法で診断します：

1. ブラウザコンソールで `window.csvErrorDiagnostics.showDiagnosticReport()` を実行
2. エラーの詳細と解決策を確認
3. 必要に応じてモジュールの修正または設定を調整

## 注意事項

- これらのモジュールは、既存のコードを変更せずに統合できるように設計されています
- TypeScriptプロジェクトでは、型定義を適切に設定してください
- プロダクション環境にデプロイする前に、十分なテストを行ってください

以上のガイドに従って各モジュールを導入することで、月次レポートシステムの安定性と使いやすさを大幅に向上させることができます。