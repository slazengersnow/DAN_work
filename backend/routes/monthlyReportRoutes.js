// routes/monthlyReportRoutes.js

const express = require('express');
const router = express.Router();
const monthlyReportController = require('../controllers/monthlyReportController');

// 全ての月次レポートリストの取得
router.get('/', monthlyReportController.getAllMonthlyReports);
router.get('/monthly-reports', monthlyReportController.getMonthlyReports);

// 現在の月次データを自動生成
router.post('/generate-current', monthlyReportController.generateCurrentMonthReport);

// 年間推移データの取得
router.get('/yearly/:year', monthlyReportController.getYearlyTrend);

// 特定の月次レポートの取得
router.get('/:year/:month', monthlyReportController.getMonthlyReport);
router.get('/monthly-reports/:year/:month', monthlyReportController.getMonthlyReport);

// 月次レポートの保存・更新
router.post('/:year/:month', monthlyReportController.saveMonthlyReport);
router.put('/:year/:month', monthlyReportController.saveMonthlyReport);

// 月次レポートの削除
router.delete('/:year/:month', monthlyReportController.deleteMonthlyReport);

// 新規月次レポートを作成
router.post('/monthly-reports', monthlyReportController.createMonthlyReport);

// 月次レポートを更新
router.put('/monthly-reports/:year/:month', monthlyReportController.updateMonthlyReport);

// 月次レポートサマリーを更新
router.put('/monthly-reports/:year/:month/summary', monthlyReportController.updateMonthlySummary);

// 月次レポートを確定
router.put('/monthly-reports/:year/:month/confirm', monthlyReportController.confirmMonthlyReport);

// 従業員詳細を更新
router.put('/monthly-reports/:year/:month/employees/:id', monthlyReportController.updateEmployeeDetail);

// 従業員詳細を新規作成
router.post('/monthly-reports/:year/:month/employees', monthlyReportController.createEmployeeDetail);

module.exports = router;