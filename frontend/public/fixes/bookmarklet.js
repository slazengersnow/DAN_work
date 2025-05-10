/**
 * CSVインポート修正ブックマークレット
 * 
 * ブックマークバーに追加する方法:
 * 1. ブラウザでブックマークを新規作成
 * 2. 名前に「CSVインポート修正」と入力
 * 3. URLの代わりに以下のコードを貼り付け:
 * 
 * javascript:(function(){const s=document.createElement('script');s.src='/fixes/install-csv-fixes.js';s.async=true;document.body.appendChild(s);})();
 * 
 * 4. 保存
 * 5. 月次詳細ページでブックマークをクリック
 */

// ブックマークレットとして追加するためのワンライナーコード
javascript:(function(){const s=document.createElement('script');s.src='/fixes/install-csv-fixes.js';s.async=true;document.body.appendChild(s);})();

// 上記のコードは以下を行います:
// 1. JavaScriptコードとして実行されるよう javascript: プロトコルを使用
// 2. スクリプト要素を作成
// 3. インストーラースクリプトへのパスを設定
// 4. 非同期実行を有効化
// 5. DOMにスクリプトを追加（実行される）