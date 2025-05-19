/**
 * Diagnostic Tools Module
 * 
 * Provides diagnostic utilities for analyzing page structure, 
 * detecting frameworks, and identifying elements
 */

import { 
  DiagnosticReport, 
  FrameworkDetection, 
  DetectionResult,
  ConsoleStyle 
} from './types';

export class DiagnosticTools {
  /**
   * Log styled message to console
   */
  private static logStyled(message: string, style: ConsoleStyle = {}): void {
    const defaultStyle: ConsoleStyle = {
      fontSize: '14px',
      fontWeight: 'normal',
      color: 'black',
      ...style
    };
    
    const styleString = Object.entries(defaultStyle)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
    
    console.log(`%c${message}`, styleString);
  }

  /**
   * Detect installed frameworks
   */
  static detectFrameworks(): FrameworkDetection {
    return {
      React: !!window.React || !!document.querySelector('[data-reactroot], [data-reactid]'),
      Angular: !!window.angular || !!document.querySelector('[ng-app], [ng-controller], [ng-model]'),
      Vue: !!window.Vue || !!document.querySelector('[v-app], [v-model], [v-if]'),
      jQuery: typeof window.jQuery !== 'undefined'
    };
  }

  /**
   * Generate CSS selector for an element
   */
  static generateSelector(element: Element): string {
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    return selector;
  }

  /**
   * Generate DOM structure path
   */
  static getDOMStructure(rootId: string = 'root', maxDepth: number = 5): string {
    const rootElement = document.getElementById(rootId);
    if (!rootElement) {
      return `#${rootId} not found`;
    }

    let structure = `#${rootId}`;
    let currentEl: Element = rootElement;

    for (let i = 0; i < maxDepth; i++) {
      if (currentEl.children.length === 0) break;
      
      currentEl = currentEl.children[0];
      structure += ` > ${currentEl.tagName.toLowerCase()}`;
      
      if (currentEl.className) {
        const classes = currentEl.className.split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          structure += `.${classes.join('.')}`;
        }
      }
    }

    return structure + ' > ...';
  }

  /**
   * Test Content Security Policy
   */
  static async testCSP(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const testDiv = document.createElement('div');
        testDiv.id = 'csp-test-' + Date.now();
        testDiv.style.display = 'none';
        document.body.appendChild(testDiv);

        const script = document.createElement('script');
        script.textContent = `document.getElementById('${testDiv.id}').setAttribute('data-test', 'passed');`;
        document.body.appendChild(script);

        setTimeout(() => {
          const result = testDiv.getAttribute('data-test') === 'passed';
          document.body.removeChild(testDiv);
          document.body.removeChild(script);
          resolve(result);
        }, 100);
      } catch (e) {
        resolve(false);
      }
    });
  }

  /**
   * Diagnose page structure
   */
  static diagnosePageStructure(targetPatterns: string[] = ['年度:', '月:']): Element[] {
    const yearMonthElements = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const text = el.textContent || '';
        return targetPatterns.every(pattern => text.includes(pattern));
      });

    console.clear();
    this.logStyled('=== 月次報告ページ構造診断 ===', { fontSize: '16px', fontWeight: 'bold', color: 'blue' });
    this.logStyled(`対象要素数: ${yearMonthElements.length}`, { fontWeight: 'bold' });

    yearMonthElements.forEach((el, index) => {
      this.logStyled(`要素 ${index + 1}:`, { fontWeight: 'bold', color: 'green' });
      console.log('- テキスト内容:', el.textContent?.trim());
      console.log('- タグ名:', el.tagName);
      console.log('- クラス:', el.className);
      console.log('- ID:', el.id);
      console.log('- セレクタ:', this.generateSelector(el));
      console.log('- HTML:', el.outerHTML.substring(0, 100) + '...');
      console.log('---');
    });

    const domStructure = this.getDOMStructure();
    this.logStyled('DOM構造:', { fontWeight: 'bold' });
    console.log(domStructure);

    this.logStyled('=== 診断完了 ===', { fontSize: '16px', fontWeight: 'bold', color: 'blue' });
    
    return yearMonthElements;
  }

  /**
   * Run comprehensive diagnostics
   */
  static async runComprehensiveDiagnostics(): Promise<DiagnosticReport> {
    console.clear();
    this.logStyled('月次報告ページ診断ツール', { fontSize: '16px', fontWeight: 'bold', color: 'blue' });

    // Page information
    this.logStyled('ページ情報:', { fontWeight: 'bold' });
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      frameworks: this.detectFrameworks()
    };
    
    console.log('URL:', pageInfo.url);
    console.log('タイトル:', pageInfo.title);
    console.log('フレームワーク検出:');
    Object.entries(pageInfo.frameworks).forEach(([name, detected]) => {
      console.log(`- ${name}: ${detected ? '検出' : '未検出'}`);
    });

    // Detection methods
    this.logStyled('年度・月行の検出:', { fontWeight: 'bold' });
    
    const detectionResults: DiagnosticReport['detectionResults'] = {
      xpath: this.detectByXPath(),
      selector: this.detectBySelector(),
      textSearch: this.detectByText(),
      formElements: this.detectFormElements(),
      shadowDom: this.detectShadowDom()
    };

    // Log each detection result
    Object.entries(detectionResults).forEach(([method, result]) => {
      this.logStyled(`検出方法: ${method}`, { color: 'purple' });
      console.log(`- 結果: ${result.found ? '要素を発見' : '要素なし'}`);
      if (result.found && result.elements) {
        console.log(`- ${result.elements.length}個の要素が見つかりました`);
      }
    });

    // Security check
    this.logStyled('セキュリティポリシー:', { fontWeight: 'bold' });
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const csp = cspMeta ? cspMeta.getAttribute('content') : null;
    console.log('CSP Meta タグ:', csp || '未検出');

    // Inline script test
    this.logStyled('インラインスクリプト実行テスト:', { fontWeight: 'bold' });
    const inlineScriptTestResult = await this.testCSP();
    console.log('インラインスクリプト実行:', inlineScriptTestResult ? '成功' : '失敗');

    // Solutions
    const solutions = [
      '直接コンソールで実行できる修正コード',
      'ブラウザ拡張機能を使用した解決策',
      '開発者に問い合わせ'
    ];
    
    this.logStyled('解決策の提案:', { fontWeight: 'bold', color: 'green' });
    solutions.forEach((solution, index) => {
      console.log(`${index + 1}. ${solution}`);
    });

    this.logStyled('診断完了', { fontSize: '16px', fontWeight: 'bold', color: 'blue' });

    return {
      pageInfo,
      detectionResults,
      security: {
        csp,
        inlineScriptTestResult
      },
      domStructure: this.getDOMStructure(),
      solutions
    };
  }

  /**
   * Detection methods
   */
  private static detectByXPath(xpath: string = '//*[@id="root"]/div/div[2]/main/div/div[1]'): DetectionResult {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const element = result.singleNodeValue as Element | null;
      return {
        found: !!element,
        element: element || undefined
      };
    } catch (error) {
      return {
        found: false,
        error: error as Error
      };
    }
  }

  private static detectBySelector(): DetectionResult {
    try {
      const elements = document.querySelectorAll('div:has(select), div:has(input[type="month"])');
      return {
        found: elements.length > 0,
        elements: Array.from(elements)
      };
    } catch (error) {
      return {
        found: false,
        error: error as Error
      };
    }
  }

  private static detectByText(): DetectionResult {
    try {
      const textNodes: Element[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      
      while (node = walker.nextNode()) {
        if (node.textContent?.includes('年度') || node.textContent?.includes('月:')) {
          const parent = node.parentElement;
          if (parent && !textNodes.includes(parent)) {
            textNodes.push(parent);
          }
        }
      }
      
      return {
        found: textNodes.length > 0,
        elements: textNodes
      };
    } catch (error) {
      return {
        found: false,
        error: error as Error
      };
    }
  }

  private static detectFormElements(): DetectionResult {
    try {
      const forms = document.querySelectorAll('form');
      const relevantForms = Array.from(forms).filter(form => {
        return form.innerHTML.includes('年度') || form.innerHTML.includes('月');
      });
      
      return {
        found: relevantForms.length > 0,
        elements: relevantForms
      };
    } catch (error) {
      return {
        found: false,
        error: error as Error
      };
    }
  }

  private static detectShadowDom(): DetectionResult {
    try {
      const hostElements = document.querySelectorAll('*');
      const shadowRoots: ShadowRoot[] = [];
      
      hostElements.forEach(host => {
        if (host.shadowRoot) {
          shadowRoots.push(host.shadowRoot);
        }
      });
      
      return {
        found: shadowRoots.length > 0,
        elements: shadowRoots as any // ShadowRoot[] needs to be cast
      };
    } catch (error) {
      return {
        found: false,
        error: error as Error
      };
    }
  }
}

// Export convenience functions
export const diagnosePageStructure = DiagnosticTools.diagnosePageStructure.bind(DiagnosticTools);
export const runComprehensiveDiagnostics = DiagnosticTools.runComprehensiveDiagnostics.bind(DiagnosticTools);
export const detectFrameworks = DiagnosticTools.detectFrameworks.bind(DiagnosticTools);