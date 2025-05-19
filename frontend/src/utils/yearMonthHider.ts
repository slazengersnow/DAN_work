/**
 * Year/Month Hider Utility
 * 
 * A comprehensive TypeScript utility for hiding year/month selector elements
 * in monthly report pages. Integrates multiple detection methods from various
 * JavaScript utilities into a single, type-safe solution.
 */

interface HideOptions {
  method?: 'all' | 'css' | 'xpath' | 'text' | 'form' | 'select' | 'button';
  skipObserver?: boolean;
  timeout?: number;
}

interface HideResult {
  success: boolean;
  method: string;
  error?: Error;
}

interface DiagnosticResult {
  pageInfo: {
    url: string;
    title: string;
    frameworks: Record<string, boolean>;
  };
  elements: {
    xpath: boolean;
    textContent: number;
    selects: number;
    forms: number;
    buttons: number;
    shadowDom: number;
  };
  security: {
    csp: string | null;
  };
  hiddenCount: number;
}

declare global {
  interface Window {
    React?: any;
    angular?: any;
    Vue?: any;
    jQuery?: any;
  }
}

export class YearMonthHider {
  private static hiddenElements: Element[] = [];
  private static originalDisplay: Map<Element, string> = new Map();
  private static mutationObserver: MutationObserver | null = null;

  /**
   * Hide year/month selector elements using multiple detection methods
   */
  static async hide(options: HideOptions = {}): Promise<HideResult[]> {
    const results: HideResult[] = [];
    const { method = 'all', skipObserver = false, timeout = 1000 } = options;

    // Wait for DOM to be ready
    if (document.readyState !== 'complete') {
      await new Promise<void>(resolve => {
        window.addEventListener('load', () => resolve());
        setTimeout(() => resolve(), timeout);
      });
    }

    try {
      // CSS injection method
      if (method === 'all' || method === 'css') {
        const style = document.createElement('style');
        style.textContent = `
          /* Hide year/month selectors */
          #root > div > div:nth-child(2) > main > div > div:first-child {
            display: none !important;
          }
          div:has(select[id*="year"], select[id*="month"]) {
            display: none !important;
          }
          div:has(label:contains("年度")), div:has(label:contains("月")) {
            display: none !important;
          }
          .year-month-selector, .year-month-filter {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
        results.push({ success: true, method: 'css-injection' });
      }
    } catch (error) {
      results.push({ success: false, method: 'css-injection', error: error as Error });
    }

    // XPath method
    if (method === 'all' || method === 'xpath') {
      try {
        const xpath = '//*[@id="root"]/div/div[2]/main/div/div[1]';
        const result = document.evaluate(xpath, document, null, 
          window.XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const element = result.singleNodeValue as Element | null;
        
        if (element) {
          this.addHidden(element);
          results.push({ success: true, method: 'xpath' });
        }
      } catch (error) {
        results.push({ success: false, method: 'xpath', error: error as Error });
      }
    }

    // CSS Selectors method
    if (method === 'all' || method === 'css') {
      try {
        const selectors = [
          '#root > div > div:nth-child(2) > main > div > div:first-child',
          'div:has(select[id*="year"], select[id*="month"])',
          'div:has(select[value="2024"], select[value="5月"])',
          'div.year-month-selector',
          'div[class*="filter"]',
          'div.container > div.row:first-of-type',
          'div.filter-row',
          'form > div:first-child',
          'div:has(select[name*="year"], select[name*="month"])',
          '.react-grid-Container .react-grid-Header .header-row'
        ];
        
        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              this.addHidden(element);
              results.push({ success: true, method: `css-selector:${selector}` });
            });
          } catch (e) {
            // Some selectors might not be supported in older browsers
            continue;
          }
        }
      } catch (error) {
        results.push({ success: false, method: 'css-selectors', error: error as Error });
      }
    }

    // Text search method
    if (method === 'all' || method === 'text') {
      try {
        const allElements = document.querySelectorAll('div, span, label, p');
        
        // Find elements containing both year and month text
        const yearMonthElements = Array.from(allElements).filter(el => {
          const text = el.textContent || '';
          return (text.includes('年度:') || text.includes('年度：')) && 
                 (text.includes('月:') || text.includes('月：'));
        });
        
        // Sort by text length to find the most specific element
        yearMonthElements.sort((a, b) => (a.textContent?.length || 0) - (b.textContent?.length || 0));
        
        if (yearMonthElements.length > 0) {
          const targetElement = yearMonthElements[0];
          let elementToHide = targetElement;
          
          // Try to find the row container
          let parent = targetElement.parentElement;
          for (let i = 0; i < 3 && parent; i++) {
            if (parent.offsetWidth > window.innerWidth * 0.7) {
              elementToHide = parent;
              break;
            }
            parent = parent.parentElement;
          }
          
          this.addHidden(elementToHide);
          results.push({ success: true, method: 'text-search' });
        }
      } catch (error) {
        results.push({ success: false, method: 'text-search', error: error as Error });
      }
    }

    // Form elements method
    if (method === 'all' || method === 'form') {
      try {
        const forms = document.querySelectorAll('form');
        const relevantForms = Array.from(forms).filter(form => {
          const html = form.innerHTML;
          return html.includes('年度') || html.includes('月');
        });
        
        if (relevantForms.length > 0) {
          relevantForms.forEach(form => {
            this.addHidden(form);
          });
          results.push({ success: true, method: 'form-elements' });
        }
      } catch (error) {
        results.push({ success: false, method: 'form-elements', error: error as Error });
      }
    }

    // Select elements method
    if (method === 'all' || method === 'select') {
      try {
        const selects = document.querySelectorAll('select');
        const yearMonthSelects = Array.from(selects).filter(select => {
          return select.id.includes('year') || 
                 select.id.includes('month') ||
                 select.name.includes('year') ||
                 select.name.includes('month') ||
                 Array.from(select.options).some(option => 
                   option.textContent?.includes('2024') || 
                   option.textContent?.includes('月')
                 );
        });
        
        if (yearMonthSelects.length > 0) {
          // Find the row container
          const selectRow = yearMonthSelects[0].closest(
            'div[class*="row"], div[class*="filter"], div.form-group, div.form-row'
          );
          
          if (selectRow) {
            this.addHidden(selectRow);
            results.push({ success: true, method: 'select-elements' });
          }
        }
      } catch (error) {
        results.push({ success: false, method: 'select-elements', error: error as Error });
      }
    }

    // Button method - find update button and hide its container
    if (method === 'all' || method === 'button') {
      try {
        const updateButton = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent === '更新' || btn.innerHTML.includes('更新'));
        
        if (updateButton) {
          let parent = updateButton.parentElement;
          for (let i = 0; i < 3 && parent; i++) {
            if (parent.offsetWidth > window.innerWidth * 0.7) {
              this.addHidden(parent);
              results.push({ success: true, method: 'button-parent' });
              break;
            }
            parent = parent.parentElement;
          }
        }
      } catch (error) {
        results.push({ success: false, method: 'button-parent', error: error as Error });
      }
    }

    // DOM mutation observer to handle dynamically added elements
    if (!skipObserver && 'MutationObserver' in window) {
      try {
        this.mutationObserver = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                  const element = node as Element;
                  const text = element.textContent || '';
                  if (text.includes('年度') && text.includes('月')) {
                    this.addHidden(element);
                  }
                }
              });
            }
          }
        });
        
        this.mutationObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        results.push({ success: true, method: 'observer' });
      } catch (error) {
        results.push({ success: false, method: 'observer', error: error as Error });
      }
    }

    return results;
  }

  /**
   * Show previously hidden elements
   */
  static show(): void {
    this.hiddenElements.forEach(element => {
      const originalDisplay = this.originalDisplay.get(element) || '';
      (element as HTMLElement).style.display = originalDisplay;
    });
    
    this.hiddenElements = [];
    this.originalDisplay.clear();
    
    // Remove mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    // Remove injected styles
    const styles = document.querySelectorAll('style');
    styles.forEach(style => {
      if (style.textContent?.includes('/* Hide year/month selectors */')) {
        style.remove();
      }
    });
  }

  /**
   * Diagnose page structure
   */
  static diagnose(): DiagnosticResult {
    console.clear();
    console.log('%c月次報告ページ診断ツール', 'font-size:16px; font-weight:bold; color:blue;');
    
    // Page information
    console.log('%cページ情報:', 'font-weight:bold;');
    console.log('URL:', window.location.href);
    console.log('タイトル:', document.title);
    
    // Framework detection
    console.log('フレームワーク検出:');
    const frameworks = {
      'React': !!window.React || !!document.querySelector('[data-reactroot], [data-reactid]'),
      'Angular': !!window.angular || !!document.querySelector('[ng-app], [ng-controller]'),
      'Vue': !!window.Vue || !!document.querySelector('[v-app], [v-model]'),
      'jQuery': typeof window.jQuery !== 'undefined'
    };
    
    Object.entries(frameworks).forEach(([name, detected]) => {
      console.log(`- ${name}: ${detected ? '検出' : '未検出'}`);
    });
    
    // Check for XPath element
    console.log('%c年度・月行の検出:', 'font-weight:bold;');
    const xpath = '//*[@id="root"]/div/div[2]/main/div/div[1]';
    const xpathResult = document.evaluate(xpath, document, null, 
      window.XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const xpathElement = xpathResult.singleNodeValue as Element | null;
    
    console.log('XPath element:', xpathElement ? 'Found' : 'Not found');
    if (xpathElement) {
      console.log('- HTML:', (xpathElement as Element).outerHTML?.substring(0, 100) + '...');
    }
    
    // Check for elements by text
    const yearMonthElements = Array.from(document.querySelectorAll('*'))
      .filter(el => el.textContent?.includes('年度:') && el.textContent?.includes('月:'));
      
    console.log(`Elements with year/month text: ${yearMonthElements.length}`);
    yearMonthElements.forEach((el, i) => {
      console.log(`要素 ${i + 1}:`);
      console.log('- タグ名:', el.tagName);
      console.log('- クラス:', el.className);
      console.log('- テキスト:', el.textContent?.trim());
    });
    
    // Check for select elements
    const selects = document.querySelectorAll('select');
    const yearMonthSelects = Array.from(selects).filter(select => {
      const options = Array.from(select.options);
      return options.some(option => 
        option.textContent?.includes('2024') || 
        option.textContent?.includes('月')
      );
    });
    
    console.log(`Select elements with year/month: ${yearMonthSelects.length}`);
    
    // Check for forms
    const forms = document.querySelectorAll('form');
    const relevantForms = Array.from(forms).filter(form => {
      const html = form.innerHTML;
      return html.includes('年度') || html.includes('月');
    });
    
    console.log(`Forms with year/month: ${relevantForms.length}`);
    
    // Check for buttons
    const buttons = Array.from(document.querySelectorAll('button'));
    const updateButtons = buttons.filter(btn => 
      btn.textContent === '更新' || btn.innerHTML.includes('更新')
    );
    
    console.log(`Update buttons: ${updateButtons.length}`);
    
    // Check for shadow DOM
    const hostElements = Array.from(document.querySelectorAll('*'));
    const shadowRoots = hostElements
      .filter(host => host.shadowRoot)
      .map(host => host.shadowRoot);
    
    console.log(`Shadow DOM roots: ${shadowRoots.length}`);
    
    // CSP check
    console.log('%cセキュリティポリシー:', 'font-weight:bold;');
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const cspContent = cspMeta ? cspMeta.getAttribute('content') : null;
    console.log('CSP Meta:', cspContent || '未検出');
    
    // Check for hidden elements
    console.log('%c現在の状態:', 'font-weight:bold;');
    console.log(`Hidden elements: ${this.hiddenElements.length}`);
    
    console.log('%c=== 診断完了 ===', 'font-size:16px; font-weight:bold; color:blue;');
    
    return {
      pageInfo: {
        url: window.location.href,
        title: document.title,
        frameworks
      },
      elements: {
        xpath: !!xpathElement,
        textContent: yearMonthElements.length,
        selects: yearMonthSelects.length,
        forms: relevantForms.length,
        buttons: updateButtons.length,
        shadowDom: shadowRoots.length
      },
      security: {
        csp: cspContent
      },
      hiddenCount: this.hiddenElements.length
    };
  }

  /**
   * Toggle visibility of year/month elements
   */
  static toggle(): boolean {
    if (this.hiddenElements.length > 0) {
      this.show();
      return false;
    } else {
      this.hide();
      return true;
    }
  }

  /**
   * Helper method to add element to hidden list
   */
  private static addHidden(element: Element): void {
    if (!this.hiddenElements.includes(element)) {
      const htmlElement = element as HTMLElement;
      this.originalDisplay.set(element, htmlElement.style.display || '');
      htmlElement.style.display = 'none';
      this.hiddenElements.push(element);
    }
  }

  /**
   * Create and execute one-liner hide script
   */
  static createOneLiner(): string {
    return `document.querySelector('div:has(div:contains("年度:"))').style.display='none';`;
  }

  /**
   * Create bookmarklet code
   */
  static createBookmarklet(): string {
    const code = `
      javascript:(function(){
        const style=document.createElement('style');
        style.textContent='#root>div>div:nth-child(2)>main>div>div:first-child{display:none!important;}';
        document.head.appendChild(style);
        const el=document.querySelector('#root>div>div:nth-child(2)>main>div>div:first-child');
        if(el)el.style.display='none';
        const divs=Array.from(document.querySelectorAll('div'));
        for(const div of divs){
          if(div.textContent.includes('年度:')&&div.textContent.includes('月:')){
            div.style.display='none';
            break;
          }
        }
        console.log('年度・月の行を非表示にしました');
      })();
    `.replace(/\s+/g, ' ').trim();
    
    return code;
  }

  /**
   * Create Tampermonkey/Greasemonkey userscript
   */
  static createUserscript(): string {
    return `// ==UserScript==
// @name         Hide Year/Month Selector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hide year/month selector in monthly reports
// @match        ${window.location.origin}/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Wait for page load
    window.addEventListener('load', function() {
        // Import and use YearMonthHider
        ${this.toString()}
        
        // Hide elements
        YearMonthHider.hide();
    });
})();`;
  }
}

// Export for use in React components
export const hideYearMonth = YearMonthHider.hide.bind(YearMonthHider);
export const showYearMonth = YearMonthHider.show.bind(YearMonthHider);
export const toggleYearMonth = YearMonthHider.toggle.bind(YearMonthHider);
export const diagnoseYearMonth = YearMonthHider.diagnose.bind(YearMonthHider);