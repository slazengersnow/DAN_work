// XPathで指定された要素を削除
const xpath = '//*[@id="root"]/div/div[2]/main/div/div[1]';
const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
const element = result.singleNodeValue;

if (element) {
  // 要素が見つかった場合、親要素から削除
  element.parentNode.removeChild(element);
  console.log('成功: XPathで指定した要素を削除しました');
} else {
  console.log('指定したXPathの要素が見つかりませんでした。別の方法を試します...');
  
  // 代替方法: 「年度:」と「月:」を含む要素を探して削除
  const elements = document.querySelectorAll('div');
  let found = false;
  
  for (const el of elements) {
    if (el.textContent.includes('年度:') && el.textContent.includes('月:')) {
      // 要素を削除
      el.parentNode.removeChild(el);
      console.log('成功: 「年度:」と「月:」を含む要素を削除しました');
      found = true;
      break;
    }
  }
  
  if (!found) {
    console.log('「年度:」と「月:」を含む要素も見つかりませんでした。');
  }
}