import React, { useState } from 'react';
import Papa, { ParseResult, ParseError } from 'papaparse';
import { Employee } from '../types/Employee';

// インターフェースを明確に定義
interface ImportEmployeesProps {
  onImportComplete: (employees: Employee[]) => void;
}

const ImportEmployees: React.FC<ImportEmployeesProps> = ({ onImportComplete }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  // CSVデータをEmployeeオブジェクトに変換する関数
  const convertCsvToEmployee = (csvRow: any): Employee => {
    // 性別の変換（CSVでは1,2だが、APIでは"1","2"の文字列形式）
    const gender = csvRow['性別'] ? csvRow['性別'].toString() : undefined;
    
    // 障害種別の変換
    let disabilityType: 'ないし部位' | '身体障害' | '精神障害' | '知的障害' = '身体障害';
    if (csvRow['障害種別'] === '精神障害') disabilityType = '精神障害';
    if (csvRow['障害種別'] === '知的障害') disabilityType = '知的障害';
    
    // 月次データの構築
    const monthlyData = {
      standardHours: Array(12).fill(0),
      actualHours: Array(12).fill(0),
      notes: Array(12).fill(''),
      attendanceFlag: Array(12).fill(0),
      reportFlag: Array(12).fill(0),
      countValues: Array(12).fill(0)
    };
    
    // 1月〜12月のデータを処理
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    months.forEach((month, index) => {
      monthlyData.standardHours[index] = parseFloat(csvRow[`${month}_標準時間`] || '0');
      monthlyData.actualHours[index] = parseFloat(csvRow[`${month}_実績時間`] || '0');
      monthlyData.notes[index] = csvRow[`${month}_備考`] || '';
      monthlyData.attendanceFlag[index] = csvRow[`${month}_勤怠確認`] === '1' ? 1 : 0;
      monthlyData.reportFlag[index] = csvRow[`${month}_報告`] === '1' ? 1 : 0;
      monthlyData.countValues[index] = parseFloat(csvRow[`${month}_カウント値`] || '0');
    });
    
    // Employeeオブジェクトを構築して返す
    return {
      id: 0, // または適切な初期値、バックエンドで生成される場合は一時的な値
      employeeId: csvRow['社員ID'] || '',
      name: csvRow['氏名'] || '',
      nameKana: csvRow['フリガナ'] || '',
      gender: gender as '1' | '2' | undefined,
      disabilityType: disabilityType,
      grade: csvRow['障害等級'] || '',
      count: parseFloat(csvRow['カウント値'] || '1'),
      status: '在籍中', // デフォルト値
      
      // 基本情報タブの追加情報
      birthYear: csvRow['年'] || '',
      birthMonth: csvRow['月'] || '',
      birthDay: csvRow['日'] || '',
      eraType: csvRow['元号'] as any || undefined,
      address: csvRow['住所'] || '',
      phone: csvRow['電話番号'] || '',
      email: csvRow['メールアドレス'] || '',
      managementType: csvRow['管理形態'] || '',
      
      // 緊急連絡先情報
      emergencyContactName: csvRow['緊急連絡先_氏名'] || '',
      emergencyContactRelation: csvRow['緊急連絡先_続柄'] || '',
      emergencyContactPhone: csvRow['緊急連絡先_電話番号'] || '',
      emergencyContactAddress: csvRow['緊急連絡先_住所'] || '',
      
      // 責任者情報
      supervisorName: csvRow['担当者_氏名'] || '',
      supervisorPosition: csvRow['担当者_役職'] || '',
      supervisorPhone: csvRow['担当者_電話番号'] || '',
      
      // 障害情報タブ
      physicalGrade: csvRow['障害等級'] || '',
      physicalLocation: csvRow['障害部位'] || '',
      physicalCertDateEra: csvRow['元号'] as any || undefined,
      physicalCertDateYear: csvRow['年'] || '',
      physicalCertDateMonth: csvRow['月'] || '',
      physicalCertDateDay: csvRow['日'] || '',
      
      // 手帳情報
      certificateNumber: csvRow['手帳番号'] || '',
      certificateIssuer: csvRow['手帳発行機関'] || '',
      certificateExpiryEra: csvRow['手帳有効期限_元号'] as any || undefined,
      certificateExpiryYear: csvRow['手帳有効期限_年'] || '',
      certificateExpiryMonth: csvRow['手帳有効期限_月'] || '',
      certificateExpiryDay: csvRow['手帳有効期限_日'] || '',
      
      // 雇用情報タブ
      employmentType: csvRow['雇用形態'] || '',
      countValue: csvRow['カウント値'] || '',
      hireDateEra: csvRow['雇用年月日_元号'] as any || undefined,
      hireDateYear: csvRow['雇用年月日_年'] || '',
      hireDateMonth: csvRow['雇用年月日_月'] || '',
      hireDateDay: csvRow['雇用年月日_日'] || '',
      
      // 職務情報
      department: csvRow['部署'] || '',
      position: csvRow['職位'] || '',
      jobDescription: csvRow['職務内容'] || '',
      
      // 勤務条件
      workHours: csvRow['勤務時間'] || '',
      workDaysPerWeek: csvRow['勤務日数'] || '',
      exceptionalReason: csvRow['特記事項'] || '',
      
      // 月次情報タブのデータ
      monthlyData: monthlyData,
    };
  };

  // ファイルアップロードハンドラ
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    setIsUploading(true);
    setUploadStatus({ status: 'idle', message: '' });
    
    // ファイルリーダーを使用してファイルの内容を文字列として読み込む
    const reader = new FileReader();
    
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const csvText = event.target?.result as string;
      
      // 型の問題を回避するために型アサーションを使用
      // @ts-ignore - PapaParseの型定義の問題を回避
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<any>) => {
          try {
            if (results.errors.length > 0) {
              throw new Error(`CSVのパースエラー: ${results.errors[0].message}`);
            }
            
            // データ検証
            if (results.data.length === 0) {
              throw new Error('CSVファイルにデータが含まれていません');
            }
            
            // プレビューデータ設定
            setPreviewData(results.data.slice(0, 5)); // 最初の5件をプレビュー表示
            
            // CSVデータをEmployeeオブジェクトに変換
            const employees = results.data.map(convertCsvToEmployee);
            
            // 変換結果を親コンポーネントに渡す
            onImportComplete(employees);
            
            setUploadStatus({
              status: 'success',
              message: `${employees.length}件の社員データを正常にインポートしました。`
            });
          } catch (error) {
            console.error('Import error:', error);
            setUploadStatus({
              status: 'error',
              message: error instanceof Error ? error.message : '不明なエラーが発生しました'
            });
          } finally {
            setIsUploading(false);
          }
        },
        error: (error: ParseError) => {
          console.error('Parse error:', error);
          setUploadStatus({
            status: 'error',
            message: `ファイル読み込みエラー: ${error.message}`
          });
          setIsUploading(false);
        }
      });
    };
    
    reader.onerror = () => {
      setUploadStatus({
        status: 'error',
        message: 'ファイルの読み込み中にエラーが発生しました'
      });
      setIsUploading(false);
    };
    
    // ファイルをテキストとして読み込む
    reader.readAsText(file);
  };
  
  // テンプレートのダウンロード処理
  const handleDownloadTemplate = () => {
    // テンプレートヘッダー
    const templateHeaders = "社員ID,氏名,フリガナ,性別,元号,年,月,日,住所,電話番号,メールアドレス,障害種別,障害等級,障害部位,手帳番号,手帳発行機関,手帳有効期限_元号,手帳有効期限_年,手帳有効期限_月,手帳有効期限_日,雇用形態,カウント値,雇用年月日_元号,雇用年月日_年,雇用年月日_月,雇用年月日_日,部署,職位,職務内容,勤務時間,勤務日数,特記事項,管理形態,緊急連絡先_氏名,緊急連絡先_続柄,緊急連絡先_電話番号,緊急連絡先_住所,担当者_氏名,担当者_役職,担当者_電話番号,1月_標準時間,1月_実績時間,1月_備考,1月_勤怠確認,1月_報告,1月_カウント値,2月_標準時間,2月_実績時間,2月_備考,2月_勤怠確認,2月_報告,2月_カウント値,3月_標準時間,3月_実績時間,3月_備考,3月_勤怠確認,3月_報告,3月_カウント値,4月_標準時間,4月_実績時間,4月_備考,4月_勤怠確認,4月_報告,4月_カウント値,5月_標準時間,5月_実績時間,5月_備考,5月_勤怠確認,5月_報告,5月_カウント値,6月_標準時間,6月_実績時間,6月_備考,6月_勤怠確認,6月_報告,6月_カウント値,7月_標準時間,7月_実績時間,7月_備考,7月_勤怠確認,7月_報告,7月_カウント値,8月_標準時間,8月_実績時間,8月_備考,8月_勤怠確認,8月_報告,8月_カウント値,9月_標準時間,9月_実績時間,9月_備考,9月_勤怠確認,9月_報告,9月_カウント値,10月_標準時間,10月_実績時間,10月_備考,10月_勤怠確認,10月_報告,10月_カウント値,11月_標準時間,11月_実績時間,11月_備考,11月_勤怠確認,11月_報告,11月_カウント値,12月_標準時間,12月_実績時間,12月_備考,12月_勤怠確認,12月_報告,12月_カウント値";
    
    // サンプルデータ1行目
    const sampleData = "EMP001,山田太郎,ヤマダタロウ,1,昭和,55,1,1,東京都新宿区西新宿2-8-1,03-1234-5678,taro@example.com,身体障害,1級,下肢,A12345,東京都,令和,10,12,31,正社員,1,平成,28,4,1,総務部,一般職員,データ入力,8時間,週5日,配慮事項あり,A,山田花子,妻,03-8765-4321,東京都新宿区西新宿2-8-1,田中部長,部長,03-9999-8888,160,155,,1,1,1,160,160,,1,1,1,160,155,,1,1,1,160,160,,1,1,1,160,155,,1,1,1,160,160,,1,1,1,160,155,,1,1,1,160,160,,1,1,1,160,155,,1,1,1,160,160,,1,1,1,160,155,,1,1,1,160,160,,1,1,1";
    
    // テンプレートCSVの内容（UTF-8 BOMを追加）
    const BOM = "\uFEFF";
    const templateCsv = `${BOM}${templateHeaders}\n${sampleData}`;
    
    try {
      // Excelで開きやすいようにBlobを作成
      const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' });
      
      // ダウンロードリンクを作成
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // リンクの属性を設定
      link.setAttribute('href', url);
      link.setAttribute('download', '社員データインポートテンプレート.csv');
      
      // リンクをクリック（自動ダウンロード）
      document.body.appendChild(link);
      link.click();
      
      // 後処理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('テンプレートのダウンロードが完了しました');
    } catch (error) {
      console.error('テンプレートダウンロード中にエラーが発生しました:', error);
    }
  };

  return (
    <div className="import-employees-container">
      <h2 className="section-title">社員データのインポート</h2>
      
      <div className="import-actions">
        <button
          onClick={handleDownloadTemplate}
          className="download-template-btn"
        >
          インポートテンプレートをダウンロード
        </button>
        
        <div className="file-upload-container">
          <label className="file-upload-label">
            <span>CSVファイルを選択</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
          </label>
          
          {isUploading && <div className="upload-loader">アップロード中...</div>}
          
          {uploadStatus.status !== 'idle' && (
            <div className={`upload-status ${uploadStatus.status}`}>
              {uploadStatus.message}
            </div>
          )}
        </div>
      </div>
      
      {previewData && previewData.length > 0 && (
        <div className="preview-container">
          <h3>プレビュー（最初の5件）</h3>
          <table className="preview-table">
            <thead>
              <tr>
                <th>社員ID</th>
                <th>氏名</th>
                <th>フリガナ</th>
                <th>障害種別</th>
                <th>等級</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, index) => (
                <tr key={index}>
                  <td>{row['社員ID']}</td>
                  <td>{row['氏名']}</td>
                  <td>{row['フリガナ']}</td>
                  <td>{row['障害種別']}</td>
                  <td>{row['障害等級']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <style>
        {`
        .import-employees-container {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 20px;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .import-actions {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          align-items: center;
        }
        
        .download-template-btn {
          padding: 10px 15px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .file-upload-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .file-upload-label {
          padding: 10px 15px;
          background-color: #f1f3f4;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .upload-loader {
          font-style: italic;
          color: #666;
        }
        
        .upload-status {
          padding: 5px 10px;
          border-radius: 4px;
        }
        
        .upload-status.success {
          background-color: #d4edda;
          color: #155724;
        }
        
        .upload-status.error {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .preview-container {
          margin-top: 20px;
        }
        
        .preview-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .preview-table th, .preview-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .preview-table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        `}
      </style>
    </div>
  );
};

export default ImportEmployees;