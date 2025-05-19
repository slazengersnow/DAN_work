// 月次報告ページの年度・月の行を非表示にする超シンプルスクリプト

/**
 * 目的: 月次報告ページの年度・月の行を非表示にする
 * 対象要素: 画像から確認できる「年度: 2024」「月: 5月」が表示されている行
 * アプローチ: 最もシンプルな実装で目的を達成する
 */

// このスクリプトをClaude Codeで実行:
// ======================================

// まず、単純にCSSで非表示にするスタイルを追加
const style = document.createElement('style');
style.textContent = `
  /* 年度と月の行を非表示 */
  #root > div > div:nth-child(2) > main > div > div:first-child {
    display: none !important;
  }
`;
document.head.appendChild(style);

// その後、念のため直接指定した要素を非表示に
try {
  const targetRow = document.querySelector('#root > div > div:nth-child(2) > main > div > div:first-child');
  if (targetRow) {
    targetRow.style.display = 'none';
    console.log('年度と月の行を非表示にしました');
  } else {
    console.log('指定した要素が見つからないため、別のアプローチを試します');
    
    // 「年度:」「月:」が表示されている要素を探す
    const yearMonthElements = Array.from(document.querySelectorAll('div'))
      .filter(div => div.textContent.includes('年度:') && div.textContent.includes('月:'))
      .sort((a, b) => a.textContent.length - b.textContent.length);
    
    if (yearMonthElements.length > 0) {
      // 最も内容が短い（年度と月の情報だけを含む可能性が高い）要素を選択
      const element = yearMonthElements[0];
      // その要素の親または祖父要素を非表示（行全体をカバーするため）
      if (element.parentElement) {
        element.parentElement.style.display = 'none';
        console.log('親要素を非表示にしました');
      } else {
        element.style.display = 'none';
        console.log('要素自体を非表示にしました');
      }
    } else {
      console.log('年度と月を含む要素が見つかりませんでした');
    }
  }
} catch (error) {
  console.error('エラーが発生しました:', error);
}