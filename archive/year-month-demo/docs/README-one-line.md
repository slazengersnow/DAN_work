# 月次報告年度・月非表示 - ワンライナーソリューション

最も簡潔な1行のコードで年度・月の行を非表示にします。

## コード

```javascript
document.querySelector('div:has(div:contains("年度:"))').style.display = 'none';
```

## ファイル構成

1. **one-line-solution.js**
   - 最もシンプルな1行コード

2. **one-line-bookmarklet.txt**
   - ブックマークレット版

3. **one-line-with-error-handling.js**
   - エラーハンドリング付きバージョン

## 使用方法

### 最速の方法（コンソール）

1. 月次報告ページを開く
2. F12でコンソールを開く
3. 以下をコピー&ペーストして実行：
   ```javascript
   document.querySelector('div:has(div:contains("年度:"))').style.display = 'none';
   ```

### ブックマークレット

1. `one-line-bookmarklet.txt`のコードをコピー
2. ブックマークのURLに貼り付け
3. 月次報告ページでクリック

## セレクタの説明

```javascript
div:has(div:contains("年度:"))
```

- `div`: div要素を検索
- `:has()`: 指定した要素を含むものを選択
- `:contains("年度:")`: 「年度:」というテキストを含む要素

このセレクタは「年度:」を含むdivを持つ親divを選択します。

## 利点

- **極限のシンプルさ**: たった1行
- **明確**: 何をしているかが一目瞭然
- **高速**: 最小限の処理
- **メンテナンス容易**: コードが少ない

## 制限事項

- `:has()`セレクタは比較的新しい（Chrome 105+、Firefox 103+）
- `:contains()`は標準ではない（jQueryスタイル）
- エラーハンドリングなし（基本版）

## エラーハンドリング版

より安全に実行したい場合：

```javascript
try {
  document.querySelector('div:has(div:contains("年度:"))').style.display = 'none';
} catch (e) {
  // 代替方法
  [...document.querySelectorAll('div')]
    .find(d => d.textContent.includes('年度:'))
    ?.style.setProperty('display', 'none');
}
```

## ブラウザ対応

| ブラウザ | :has() | :contains() | 代替案必要 |
|---------|--------|-------------|-----------|
| Chrome 105+ | ✓ | × | △ |
| Firefox 103+ | ✓ | × | △ |
| Safari 15.4+ | ✓ | × | △ |
| Edge 105+ | ✓ | × | △ |

## 実際に動作するバージョン

ブラウザの制限を考慮した実用版：

```javascript
// XPathを使用（より互換性が高い）
document.evaluate('//div[contains(., "年度:")]', document, null, 
  XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.style.display = 'none';
```

## トラブルシューティング

### セレクタが機能しない場合

1. **ブラウザの対応確認**
   ```javascript
   console.log(CSS.supports('selector(div:has(div))'));
   ```

2. **代替方法を使用**
   ```javascript
   // 単純なテキスト検索
   [...document.querySelectorAll('div')]
     .find(d => d.textContent.includes('年度:'))
     .style.display = 'none';
   ```

3. **XPath版を使用**
   ```javascript
   document.evaluate('//div[contains(text(),"年度:")]', 
     document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
     .singleNodeValue.style.display = 'none';
   ```

## まとめ

このワンライナーソリューションは最もシンプルで直感的なアプローチです。ただし、ブラウザの対応状況により動作しない場合があるため、エラーハンドリング版や代替方法の使用を推奨します。