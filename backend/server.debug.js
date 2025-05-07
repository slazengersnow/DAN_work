/**
 * サーバーデバッグパッチ
 * このファイルの内容を server.js に追加することで、API ルートのデバッグ機能を有効にします
 */

// ルートデバッグミドルウェアをインポート
const routeDebug = require('./middleware/routeDebug');

// ルートデバッグミドルウェアを適用（APIルート設定の前に配置）
app.use(routeDebug({
  enabled: true,
  verbose: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  paths: ['/api/monthly-reports', '/api/monthly-report']
}));

// 既存のルーティング
app.use('/api/payment-reports', paymentReportRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
// 月次レポートの互換性ルート - 単数形バージョンも利用可能にする
app.use('/api/monthly-report', monthlyReportRoutes);
app.use('/api/settings', settingsRoutes);