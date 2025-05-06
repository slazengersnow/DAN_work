// 互換性パッチを適用するためのスクリプト
// 既存のbackend/server.jsに以下のコードを追加するか、このファイルの内容を参考にserver.jsを修正してください

// ミドルウェアのインポート
const methodOverride = require('./middleware/methodOverride');
const apiCompatibility = require('./middleware/apiCompatibility');

// デバッグモード（任意）
const DEBUG = process.env.NODE_ENV !== 'production';

// 互換性ミドルウェアを追加（APIルートの前に配置）
app.use(apiCompatibility({ debug: DEBUG }));
app.use(methodOverride({ debug: DEBUG }));

// ここから既存のAPIルート
app.use('/api/payment-reports', paymentReportRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
// 互換性のために月次レポートの別名ルートを追加
app.use('/api/monthly-report', monthlyReportRoutes);
app.use('/api/settings', settingsRoutes);