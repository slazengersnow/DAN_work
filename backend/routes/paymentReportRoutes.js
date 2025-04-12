const express = require('express');
const router = express.Router();
const paymentReportController = require('../controllers/paymentReportController');

// ここでは '/api/payment-reports' は含めないことに注意
// すでにapp.use('/api/payment-reports', paymentReportRoutes)で指定済み

// テスト用エンドポイント（一時的に追加）
router.get('/test', (req, res) => {
  res.status(200).json({ message: "テストエンドポイントが動作しています" });
});

// 全ての納付金レポートリストの取得
router.get('/', paymentReportController.getAllPaymentReports);

// 納付金額計算（シミュレーション）
router.post('/calculate', paymentReportController.calculatePaymentAmount);

// 年度別納付金額計算
router.get('/:year/calculate', paymentReportController.calculatePayment);

// 納付金レポートの確定
router.post('/:year/confirm', paymentReportController.confirmPaymentReport);

// 特定の納付金レポートの取得
router.get('/:fiscalYear', paymentReportController.getPaymentReport);

// 新規納付金レポートの作成（会社情報自動入力）
router.post('/:fiscalYear/create', paymentReportController.createNewPaymentReport);

// 納付金レポートの保存 (POST)
router.post('/:fiscalYear', paymentReportController.savePaymentReport);

// 納付金レポートの更新 (PUT)
router.put('/:fiscalYear', paymentReportController.savePaymentReport);

// 納付金レポートの提出
router.post('/:fiscalYear/submit', paymentReportController.submitPaymentReport);

// 納付金レポートの削除
router.delete('/:fiscalYear', paymentReportController.deletePaymentReport);

module.exports = router;