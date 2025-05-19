// ==UserScript==
// @name         月次報告ページ修正
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  月次報告ページの年度・月の選択行を非表示
// @author       Your Name
// @match        *://your-company-domain.com/*/月次報告*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // ページ読み込み完了時に実行
    window.addEventListener('load', function() {
        // CSSを追加して年度・月の行を非表示
        const style = document.createElement('style');
        style.textContent = `
            /* 月次報告ページの年度・月の行を非表示 */
            #root > div > div:nth-child(2) > main > div > div:first-child,
            div:has(> label:contains("年度"), > label:contains("月")),
            div:has(> select[name*="year"], > select[name*="month"]),
            div.year-month-selector,
            div.filter-row {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('月次報告ページの年度・月の行を非表示にしました');
    });
})();