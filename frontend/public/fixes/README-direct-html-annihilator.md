# HTML直接書き換えによる月次報告コントロール完全除去

このドキュメントでは、月次報告画面の年月選択コントロールを削除する「超究極の解決策」について説明します。これまでの試みでは完全に解決できなかったため、まったく異なるアプローチを採用しています。

## 概要

このソリューションは、DOM操作やCSSによる非表示化ではなく、**HTML直接検出と書き換え**に基づいています。3つの異なる戦略を組み合わせることで、あらゆる状況でコントロールを確実に除去します。

## 採用戦略

### 1. テキストノード直接探索（TreeWalker）
テキストノードを直接探索し、「年度:」や「月:」などのキーワードを含む要素から親コンテナを特定して削除します。

```javascript
const textWalker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  null,
  false
);

while (textNode = textWalker.nextNode()) {
  if (textNode.textContent.includes('年度:') || textNode.textContent.includes('月:')) {
    // 親要素を特定して削除
  }
}
```

### 2. 正規表現による要素パターンマッチング
HTML構造を正規表現でパターンマッチングし、年月選択コントロールを検出・削除します。

```javascript
divElements.forEach(div => {
  const html = div.outerHTML;
  if (/style="[^"]*display:\s*flex[^"]*"/.test(html) && 
      html.includes('年度:') && 
      html.includes('月:') && 
      html.includes('更新')) {
    // 条件に一致する要素を削除
  }
});
```

### 3. HTML直接置換（最終手段）
最後の手段として、コンテナ内のHTMLを直接置換する方法を実装しています。

```javascript
const patterns = [
  /<div[^>]*style="[^"]*display:\s*flex[^"]*gap:\s*20px[^"]*"[^>]*>[\s\S]*?<label[^>]*>年度:?[^<]*<\/label>[\s\S]*?<\/div>/gi
];

container.innerHTML = container.innerHTML.replace(pattern, '<!-- 月次報告コントロール削除 -->');
```

## マルチタイミング実行

複数のタイミングで確実に実行するために、以下の実行メカニズムを組み合わせています：

1. **即時実行**：ページロード時に即座に実行
2. **遅延実行**：100ms, 500ms, 1000ms, 2000ms, 3000msのタイミングで実行
3. **定期実行**：3秒ごとに継続的に実行
4. **イベントベース実行**：クリック、ナビゲーション変更、DOM変更検知時に実行

## 実行結果の通知

要素が削除されると、画面右下に小さな通知が表示され、削除した要素の数を確認できます。デバッグモードが有効な場合、詳細なログも開発者コンソールに出力されます。

## 他のアプローチとの違い

過去のアプローチと異なる点：

1. **CSSに依存しない**：CSSによる非表示化ではなく、要素を物理的に削除
2. **テキストノードから特定**：DOMの構造やセレクタに依存せず、テキスト内容から要素を特定
3. **正規表現マッチング**：特定のHTMLパターンを正規表現で検出
4. **多層的な実行タイミング**：あらゆるタイミングで実行することで確実に除去

## 使用方法

このスクリプトは`FixedUIScript.js`から自動的に読み込まれます。単独で使用する場合は、以下のコードをブラウザコンソールで実行してください：

```javascript
const script = document.createElement('script');
script.src = '/fixes/direct-html-annihilator.js';
script.async = true;
document.body.appendChild(script);
```

## トラブルシューティング

もし月次コントロールが削除されない場合：

1. ブラウザのデベロッパーツールを開き、コンソールで「[HTML-ANNIHILATOR]」というプレフィックスのログを確認
2. ページを完全に再読み込み（Ctrl+F5）して再試行
3. コンソールで以下のコマンドを実行して手動で削除を試行:
   ```javascript
   window._directHtmlAnnihilatorActive = false;
   const script = document.createElement('script');
   script.src = '/fixes/direct-html-annihilator.js';
   document.body.appendChild(script);
   ```

## 注意事項

このスクリプトは月次報告コントロールを非常に積極的に検出・削除します。万が一誤検出や問題が発生した場合は、以下のコマンドでスクリプトを無効化できます：

```javascript
if (window._directHtmlAnnihilatorObserver) {
  window._directHtmlAnnihilatorObserver.disconnect();
}
if (window._directHtmlAnnihilatorIntervals) {
  window._directHtmlAnnihilatorIntervals.forEach(id => clearInterval(id));
}
window._directHtmlAnnihilatorActive = false;
```