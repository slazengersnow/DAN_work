// routes/paymentReportRoutes.js

const express = require('express');
const router = express.Router();
const paymentReportController = require('../controllers/paymentReportController');

// 全ての納付金レポートリストの取得
router.get('/', paymentReportController.getAllPaymentReports);

// 納付金額計算（シミュレーション）
router.post('/calculate', paymentReportController.calculatePaymentAmount);

// 特定の納付金レポートの取得
router.get('/:fiscalYear', paymentReportController.getPaymentReport);

// 新規納付金レポートの作成（会社情報自動入力）
router.post('/create/:fiscalYear', paymentReportController.createNewPaymentReport);

// 納付金レポートの保存
router.post('/:fiscalYear', paymentReportController.savePaymentReport);

// 納付金レポートの更新
router.put('/:fiscalYear', paymentReportController.savePaymentReport);

// 納付金レポートの提出
router.post('/:fiscalYear/submit', paymentReportController.submitPaymentReport);

// 納付金レポートの削除
router.delete('/:fiscalYear', paymentReportController.deletePaymentReport);

module.exports = router;