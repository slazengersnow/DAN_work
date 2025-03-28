const reportWebVitals = (onPerfEntry?: any) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // 修正：シンプルな形式で web-vitals をインポート
    import('web-vitals').then((vitals) => {
      vitals.onCLS(onPerfEntry);
      vitals.onFID(onPerfEntry);
      vitals.onFCP(onPerfEntry);
      vitals.onLCP(onPerfEntry);
      vitals.onTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;