const express = require('express');
const router = express.Router();
const monthlyReportController = require('../controllers/monthlyReportController');

// 月次レポート一覧取得
router.get('/', monthlyReportController.getMonthlyReports);

// 全月次レポート取得
router.get('/all', monthlyReportController.getAllMonthlyReports);

// 年間推移データ取得
router.get('/trend/:year', monthlyReportController.getYearlyTrend);

// 特定年月の月次レポート取得
router.get('/:year/:month', monthlyReportController.getMonthlyReport);

// 月次レポート保存・更新
router.post('/:year/:month', monthlyReportController.saveMonthlyReport);

// 月次レポート削除
router.delete('/:year/:month', monthlyReportController.deleteMonthlyReport);

// 現在の月次データ自動生成
router.post('/generate-current', monthlyReportController.generateCurrentMonthReport);

// 月次レポート作成
router.post('/create', monthlyReportController.createMonthlyReport);

// 月次サマリー更新
router.put('/:year/:month/summary', monthlyReportController.updateMonthlySummary);

// 月次レポート確定
router.post('/:year/:month/confirm', monthlyReportController.confirmMonthlyReport);

// 従業員詳細関連ルート - エラーチェックを追加
if (monthlyReportController.updateEmployeeDetail) {
  router.put('/:year/:month/employee/:id', monthlyReportController.updateEmployeeDetail);
}

if (monthlyReportController.createEmployeeDetail) {
  router.post('/:year/:month/employee', monthlyReportController.createEmployeeDetail);
}

if (monthlyReportController.deleteEmployeeDetail) {
  router.delete('/:year/:month/employee/:id', monthlyReportController.deleteEmployeeDetail);
}

// CSVインポート
if (monthlyReportController.importEmployeesFromCSV) {
  router.post('/:year/:month/import', monthlyReportController.importEmployeesFromCSV);
}

// デバッグ用ミドルウェア
router.use((req, res, next) => {
  console.log(`Monthly Report Route: ${req.method} ${req.originalUrl}`);
  next();
});

module.exports = router;