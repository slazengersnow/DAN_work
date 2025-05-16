# XPath要素削除ソリューション

最も直接的なアプローチで、XPathを使用して月次報告ページの年度・月の行を削除します。

## 対象XPath
```
//*[@id="root"]/div/div[2]/main/div/div[1]
```

## ファイル構成

1. **xpath-delete-solution.js**
   - XPathによる要素削除のメインスクリプト
   - 代替方法としてテキスト検索も実装

2. **xpath-delete-bookmarklet.txt**
   - ブックマークレット版
   - アラートで結果を通知

## 使用方法

### 方法1: コンソールで直接実行（推奨）

1. 月次報告ページを開く
2. F12で開発者ツールを開く
3. コンソールタブを選択
4. `xpath-delete-solution.js`のコードをコピー&ペースト
5. Enterキーで実行

### 方法2: ブックマークレットとして使用

1. `xpath-delete-bookmarklet.txt`のコード全体をコピー
2. ブックマークバーで右クリック → 新しいブックマーク
3. 名前：「月次報告XPath削除」
4. URL：コピーしたコードを貼り付け
5. 保存後、月次報告ページでクリック

## 動作説明

### 主要処理（XPath削除）
```javascript
const xpath = '//*[@id="root"]/div/div[2]/main/div/div[1]';
const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
const element = result.singleNodeValue;

if (element) {
  element.parentNode.removeChild(element);
}
```

### 代替処理（テキスト検索）
XPathで要素が見つからない場合、「年度:」と「月:」を含む要素を検索して削除します。

## 特徴

- **単純明快**: XPathで直接要素を指定
- **確実な削除**: `removeChild`で要素を完全に削除
- **フォールバック**: XPathが失敗した場合の代替方法付き
- **結果通知**: コンソールまたはアラートで結果を表示

## 注意事項

- 削除は永続的（ページリロードまで）
- 非表示（`display: none`）ではなく、要素自体を削除
- XPathはページ構造に依存するため、変更される可能性
- データには影響しない（表示上の削除のみ）

## トラブルシューティング

### XPathが機能しない場合

1. **現在のXPathを確認**
   ```javascript
   // 開発者ツールで要素を右クリック → Copy → Copy XPath
   ```

2. **要素の存在確認**
   ```javascript
   const test = document.evaluate('//*[@id="root"]/div/div[2]/main/div/div[1]', 
     document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
   console.log(test.singleNodeValue);
   ```

3. **代替XPathを試す**
   ```javascript
   // より一般的なXPath
   const alternativeXPath = '//div[contains(text(),"年度:")]';
   ```

## 比較: display:none vs removeChild

| 方法 | display: none | removeChild |
|-----|--------------|-------------|
| 効果 | 要素を非表示 | 要素を削除 |
| DOM | 残る | 削除される |
| 復元 | 簡単 | 困難 |
| パフォーマンス | 軽い | 軽い |

このソリューションは最も直接的で単純なアプローチを提供します。