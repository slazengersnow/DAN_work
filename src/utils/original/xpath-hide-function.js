// 指定されたXPathでノードを取得し非表示にする関数
function removeElementByXPath(xpath) {
  try {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const element = result.singleNodeValue;
    
    if (element) {
      // この要素を非表示にする
      element.style.display = 'none';
      console.log('成功: XPathで指定した要素を非表示にしました');
      return true;
    } else {
      console.log('指定したXPathの要素が見つかりませんでした');
      return false;
    }
  } catch (error) {
    console.error('XPathによる要素の操作中にエラーが発生しました:', error);
    return false;
  }
}

// 実行部分
// 1週間前に成功したという情報から、以下のXPathを試します
const xpath = '//*[@id="root"]/div/div[2]/main/div/div[1]';
const success = removeElementByXPath(xpath);

// 失敗した場合のバックアッププラン
if (!success) {
  console.log('バックアップ方法を試します...');
  
  // 「年度」と「月」のテキスト内容で検索
  const elements = document.querySelectorAll('div');
  for (const element of elements) {
    if (element.textContent.includes('年度') && element.textContent.includes('月')) {
      element.style.display = 'none';
      console.log('成功: テキスト内容で要素を見つけて非表示にしました');
      break;
    }
  }
}