// PaymentCalculation.tsx

import React, { useMemo } from 'react';

interface PaymentCalculationProps {
  formData: any;
}

const PaymentCalculation: React.FC<PaymentCalculationProps> = ({ formData }) => {
  // 合計値の計算
  const calculateTotal = (dataKey: string) => {
    const months = ['april', 'may', 'june', 'july', 'august', 'september', 
                    'october', 'november', 'december', 'january', 'february', 'march'];
    return months.reduce((sum, month) => sum + formData[dataKey][month], 0);
  };

  // 法定雇用障害者数の年間合計
  const getTotalLegalEmployment = () => {
    return Math.floor(calculateTotal('workerBaseCount') * formData.legalEmploymentRate / 100);
  };

  // 身体障害者、知的障害者及び精神障害者の合計数の年間合計
  const getTotalDisabledEmployees = () => {
    return calculateTotal('disabledEmployees');
  };

  // A: 不足している法定雇用障害者数 × 障害者雇用納付金額（50,000円）
  const calculateA = () => {
    const legalEmployment = getTotalLegalEmployment();
    const actualEmployment = getTotalDisabledEmployees();
    
    // 不足している場合のみ納付金が発生
    const shortage = Math.max(0, legalEmployment - actualEmployment);
    return shortage * formData.paymentPerPerson;
  };

  // B: 在宅就業障害者特例調整金の計算
  const calculateB = () => {
    // 在宅就業障害者特例調整金の基礎額の計算
    const count = Math.floor(formData.homeWorkingPaymentTotal / formData.homeWorkingDivisor);
    
    // 特例調整金の計算（上限あり）
    return Math.min(
      count * formData.homeWorkingAdjustmentRate,
      getTotalDisabledEmployees() * formData.homeWorkingAdjustmentRate
    );
  };

  // 障害者雇用納付金の納付額: A - B（ただし0未満にはならない）
  const calculatePaymentAmount = () => {
    return Math.max(0, calculateA() - calculateB());
  };

  // O: 法定雇用率を超えて雇用している障害者数
  const calculateO = () => {
    const legalEmployment = getTotalLegalEmployment();
    const actualEmployment = getTotalDisabledEmployees();
    
    // 超過している場合のみ調整金が発生
    return Math.max(0, actualEmployment - legalEmployment);
  };

  // E: 障害者雇用調整金の計算 (O × 27,000円)
  const calculateE = () => {
    return calculateO() * formData.adjustmentPaymentPerPerson;
  };

  // F: 在宅就業障害者特例調整金の計算
  const calculateF = () => {
    return calculateB();
  };

  // 障害者雇用調整金および在宅就業障害者特例調整金の合計額
  const calculateAdjustmentTotal = () => {
    return calculateE() + calculateF();
  };

  // 特例給付金の計算
  const calculateSpecialPayment = () => {
    const totalShortTime = calculateTotal('shortTimeDisabledEmployees');
    const totalDisabled = getTotalDisabledEmployees();
    
    // いずれか小さい方の数 × 7,000円
    return Math.min(totalShortTime, totalDisabled) * formData.specialPaymentPerPerson;
  };

  // 納付金・調整金申告か判定
  const isPaymentRequired = () => {
    return calculateA() > calculateB();
  };

  return (
    <>
      {/* 計算プロセスの説明エリア */}
      <div className="border border-gray-800 mb-6">
        <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">納付金・調整金の計算プロセス</div>
        <div className="p-4">
          {/* A値の計算プロセス */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">A値：不足している法定雇用障害者数 × 障害者雇用納付金額</h3>
            <div className="flex flex-wrap items-center ml-4">
              <div className="mr-2">法定雇用障害者数：</div>
              <div className="border border-gray-300 px-2 py-1 w-16">{getTotalLegalEmployment()}</div>
              <div className="mx-2">−</div>
              <div className="mr-2">身体障害者、知的障害者及び精神障害者の合計数：</div>
              <div className="border border-gray-300 px-2 py-1 w-16">{getTotalDisabledEmployees()}</div>
              <div className="mx-2">=</div>
              <div className="border border-gray-300 px-2 py-1 w-16">{Math.max(0, getTotalLegalEmployment() - getTotalDisabledEmployees())}</div>
              <div className="mx-2">×</div>
              <div className="mr-2">50,000円</div>
              <div className="mx-2">=</div>
              <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateA().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
          </div>
          
          {/* B値の計算プロセス */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">B値：在宅就業障害者特例調整金</h3>
            <div className="flex flex-wrap items-center ml-4 mb-2">
              <div className="mr-2">年間の在宅就業障害者への支払い総額：</div>
              <div className="border border-gray-300 px-2 py-1 w-32">{formData.homeWorkingPaymentTotal.toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
            <div className="flex flex-wrap items-center ml-4">
              <div className="mr-2">在宅就業障害者特例調整金：</div>
              <div className="border border-gray-300 px-2 py-1 w-16">{Math.floor(formData.homeWorkingPaymentTotal / formData.homeWorkingDivisor)}</div>
              <div className="mx-2">×</div>
              <div className="mr-2">21,000円</div>
              <div className="mx-2">=</div>
              <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateB().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
          </div>
          
          {/* 納付金額か調整金額かの判定 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">納付金・調整金の判定</h3>
            <div className="ml-4">
              {isPaymentRequired() ? (
                <div className="bg-yellow-100 p-2 border border-yellow-300 rounded">
                  法定雇用障害者数（{getTotalLegalEmployment()}人）＞ 実雇用障害者数（{getTotalDisabledEmployees()}人）のため、<span className="font-bold">納付金の対象</span>です。
                </div>
              ) : (
                <div className="bg-green-100 p-2 border border-green-300 rounded">
                  法定雇用障害者数（{getTotalLegalEmployment()}人）＜ 実雇用障害者数（{getTotalDisabledEmployees()}人）のため、<span className="font-bold">調整金の対象</span>です。
                </div>
              )}
            </div>
          </div>
          
          {/* 調整金の場合のE, F値の計算プロセス */}
          {!isPaymentRequired() && (
            <div>
              <div className="mb-4">
                <h3 className="font-bold mb-2">E値：障害者雇用調整金</h3>
                <div className="flex flex-wrap items-center ml-4">
                  <div className="mr-2">超過雇用障害者数：</div>
                  <div className="border border-gray-300 px-2 py-1 w-16">{calculateO()}</div>
                  <div className="mx-2">×</div>
                  <div className="mr-2">29,000円</div>
                  <div className="mx-2">=</div>
                  <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateE().toLocaleString()}</div>
                  <div className="ml-2">円</div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold mb-2">F値：在宅就業障害者特例調整金</h3>
                <div className="flex flex-wrap items-center ml-4">
                  <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateF().toLocaleString()}</div>
                  <div className="ml-2">円</div>
                  <div className="ml-4 text-sm text-gray-600">（B値と同額）</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 納付金の納付額および在宅就業障害者特例調整金の申請額 */}
      {isPaymentRequired() && (
        <div className="border border-gray-800 mb-6">
          <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">障害者雇用納付金の納付額及び在宅就業障害者特例調整金の申請額</div>
          <div className="grid grid-cols-3 border-b border-gray-800 p-2">
            <div className="flex items-center">
              <div className="mr-2">(A)</div>
              <div className="border border-gray-300 px-2 py-1 w-32">{calculateA().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="mr-2">−</div>
              <div className="mr-2">(B)</div>
              <div className="border border-gray-300 px-2 py-1 w-32">{calculateB().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
            <div className="flex items-center justify-end">
              <div className="mr-2">納付額((A)−(B))</div>
              <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculatePaymentAmount().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 障害者雇用調整金及び在宅就業障害者特例調整金の申請額 */}
      {!isPaymentRequired() && (
        <div className="border border-gray-800 mb-6">
          <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">障害者雇用調整金及び在宅就業障害者特例調整金の申請額</div>
          <div className="grid grid-cols-3 border-b border-gray-800 p-2">
            <div className="flex items-center">
              <div className="mr-2">(P)</div>
              <div className="border border-gray-300 px-2 py-1 w-16">{calculateO()}</div>
              <div className="ml-2">×</div>
              <div className="mx-2">29,000円</div>
              <div className="mx-2">=</div>
              <div className="border border-gray-300 px-2 py-1 w-32">{calculateE().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="mr-2">＋</div>
              <div className="mr-2">(F)</div>
              <div className="border border-gray-300 px-2 py-1 w-32">{calculateF().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
            <div className="flex items-center justify-end">
              <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateAdjustmentTotal().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 在宅就業障害者特例調整金申請額の算出 */}
      <div className="border border-gray-800 mb-6">
        <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">在宅就業障害者特例調整金申請額の算出</div>
        <div className="p-2 border-b border-gray-800">
          <div className="flex flex-wrap items-center mb-2">
            <div className="mr-2">(I)年間の在宅就業障害者への支払い総額</div>
            <div className="border border-gray-300 px-2 py-1 w-32">{formData.homeWorkingPaymentTotal.toLocaleString()}</div>
            <div className="ml-2">円</div>
          </div>
          <div className="flex flex-wrap items-center">
            <div className="mr-2">÷</div>
            <div className="border border-gray-300 px-2 py-1 w-24">{formData.homeWorkingDivisor.toLocaleString()}</div>
            <div className="ml-2">円</div>
            <div className="mx-2">=</div>
            <div className="border border-gray-300 px-2 py-1 w-16">{Math.floor(formData.homeWorkingPaymentTotal / formData.homeWorkingDivisor)}</div>
            <div className="mx-2">×</div>
            <div className="mr-2">21,000円</div>
            <div className="mx-2">=</div>
            <div className="border border-gray-300 px-2 py-1 w-32">{calculateB().toLocaleString()}</div>
            <div className="ml-2">円</div>
          </div>
        </div>
      </div>
      
      {/* 特例給付金の申請額 */}
      <div className="border border-gray-800 mb-6">
        <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">特例給付金の申請額</div>
        <div className="p-2">
          <div className="flex flex-wrap items-center">
            <div className="border border-gray-300 px-2 py-1 w-16">{calculateTotal('shortTimeDisabledEmployees')}</div>
            <div className="mx-2">人又は</div>
            <div className="border border-gray-300 px-2 py-1 w-16">{getTotalDisabledEmployees()}</div>
            <div className="mx-2">人のいずれか小さい数</div>
            <div className="mx-2">×</div>
            <div className="mr-2">7,000円</div>
            <div className="mx-2">=</div>
            <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateSpecialPayment().toLocaleString()}</div>
            <div className="ml-2">円</div>
          </div>
        </div>
      </div>
      
      {/* 支給先情報 */}
      <div className="border border-gray-800 mb-6">
        <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">障害者雇用調整金、在宅就業障害者特例調整金及び特例給付金の支給先</div>
        <div className="p-2">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center">
              <div className="mr-2">金融機関及び支店名</div>
            </div>
            <div className="col-span-3">
              <div className="flex items-center">
                <div className="border border-gray-300 px-2 py-1 w-32">{formData.bankName}</div>
                <div className="ml-2 border border-gray-300 px-2 py-1 w-16">{formData.branchName}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-2">
            <div className="flex items-center">
              <div className="mr-2">金融機関コード－支店コード</div>
            </div>
            <div className="col-span-3">
              <div className="flex items-center">
                <div className="border border-gray-300 px-2 py-1 w-16">{formData.bankCode}</div>
                <div className="mx-2">−</div>
                <div className="border border-gray-300 px-2 py-1 w-16">{formData.branchCode}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-2">
            <div className="flex items-center">
              <div className="mr-2">預金種目</div>
            </div>
            <div className="col-span-3">
              <div className="flex items-center">
                <div className="border border-gray-300 px-2 py-1 w-16">{formData.accountType}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-2">
            <div className="flex items-center">
              <div className="mr-2">口座番号</div>
            </div>
            <div className="col-span-3">
              <div className="flex items-center">
                <div className="border border-gray-300 px-2 py-1 w-32">{formData.accountNumber}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-2">
            <div className="flex items-center">
              <div className="mr-2">口座名義人</div>
            </div>
            <div className="col-span-3">
              <div className="flex items-center">
                <div className="border border-gray-300 px-2 py-1 w-64">{formData.accountHolder}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentCalculation;