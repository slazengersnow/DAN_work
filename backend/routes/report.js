// backend/routes/report.js
const express = require('express');
const router = express.Router();
const monthlyReportController = require('../controllers/monthlyReportController');
const paymentReportController = require('../controllers/paymentReportController');
const { authenticate } = require('../middleware/auth');

// 月次レポート
router.get('/monthly', authenticate, monthlyReportController.getMonthlyData);
router.get('/monthly/employees', authenticate, monthlyReportController.getEmployeesByMonth);
router.get('/yearly', authenticate, monthlyReportController.getYearlyData);
router.post('/monthly/confirm', authenticate, monthlyReportController.confirmMonthlyData);

// 納付金申告
router.get('/payment', authenticate, paymentReportController.getPaymentData);
router.get('/payment/yearly', authenticate, paymentReportController.getYearlyPaymentData);
router.get('/payment/download', authenticate, paymentReportController.downloadPaymentReport);

router.get('/monthly/export', authenticate, monthlyReportController.exportMonthlyReportToCsv);

module.exports = router;