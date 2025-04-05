// routes/monthlyReportRoutes.js

const express = require('express');
const router = express.Router();
const monthlyReportController = require('../controllers/monthlyReportController');

// 全ての月次レポートリストの取得
router.get('/', monthlyReportController.getAllMonthlyReports);

// 現在の月次データを自動生成
router.post('/generate-current', monthlyReportController.generateCurrentMonthReport);

// 年間推移データの取得
router.get('/yearly/:year', monthlyReportController.getYearlyTrend);

// 特定の月次レポートの取得
router.get('/:year/:month', monthlyReportController.getMonthlyReport);

// 月次レポートの保存
router.post('/:year/:month', monthlyReportController.saveMonthlyReport);

// 月次レポートの更新
router.put('/:year/:month', monthlyReportController.saveMonthlyReport);

// 月次レポートの削除
router.delete('/:year/:month', monthlyReportController.deleteMonthlyReport);

module.exports = router;