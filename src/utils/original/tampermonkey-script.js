// ==UserScript==
// @name         月次報告ページカスタマイズ
// @namespace    http://your-company-domain.com/
// @version      1.0
// @description  月次報告ページの年度・月の行を非表示
// @author       Your Name
// @match        *://your-company-domain.com/*/月次報告*
// @match        *://your-company-domain.com/*/monthly-report*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // CSSを追加
    const style = document.createElement('style');
    style.textContent = `
        /* 年度・月の選択行を非表示 */
        #root > div > div:nth-child(2) > main > div > div:first-child,
        div:has(> select[id*="year"], > select[id*="month"]),
        div:has(label:contains("年度"), label:contains("月")),
        div.year-month-selector,
        div.filter-row,
        div.date-filter {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
    
    // DOM監視による動的対応
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (
                            (node.textContent && node.textContent.includes('年度') && node.textContent.includes('月')) ||
                            (node.innerHTML && node.innerHTML.includes('select') && 
                            (node.innerHTML.includes('2024') || node.innerHTML.includes('5月')))
                        ) {
                            node.style.display = 'none';
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();