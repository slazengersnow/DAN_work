// JavaScriptでオブジェクトの中のプロパティを一括除去するコード例
// 月次報告システムがオブジェクトベースでデータを管理している場合に有効な可能性があります
javascript:(function() {
  // グローバルスコープから月次報告に関連するオブジェクトを探す
  const globalObjects = Object.keys(window).filter(key => {
    return key.includes('report') || key.includes('月次') || key.includes('Report');
  });
  
  // 見つかったオブジェクトから年度・月のプロパティを取得して表示制御を変更
  globalObjects.forEach(objName => {
    try {
      const obj = window[objName];
      if (obj && typeof obj === 'object') {
        // 表示/非表示に関するプロパティを探して変更
        if (obj.hasOwnProperty('showYearMonthSelector')) {
          obj.showYearMonthSelector = false;
          console.log(`${objName}.showYearMonthSelector を false に設定しました`);
        }
        
        // 年度・月のセレクタ部分を探して非表示に
        if (obj.hasOwnProperty('yearMonthSelector')) {
          obj.yearMonthSelector.visible = false;
          console.log(`${objName}.yearMonthSelector.visible を false に設定しました`);
        }
      }
    } catch (e) {
      // エラーは無視
    }
  });
})();