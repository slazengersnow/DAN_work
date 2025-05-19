
  /**
   * Element Detection Module
   * 
   * Provides utilities for detecting and finding elements
   * using various methods including XPath, CSS selectors, and text content
   */

  import { ElementDetectionOptions, DetectionResult } from './types';

  export class ElementDetector {
    /**
     * Find elements using XPath
     */
    static findByXPath(xpath: string): DetectionResult {
      try {
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );

        const elements: Element[] = [];
        for (let i = 0; i < result.snapshotLength; i++) {
          const node = result.snapshotItem(i);
          if (node && node.nodeType === Node.ELEMENT_NODE) {
            elements.push(node as Element);
          }
        }

        return {
          found: elements.length > 0,
          elements
        };
      } catch (error) {
        return {
          found: false,
          error: error as Error
        };
      }
    }

    /**
     * Find elements using CSS selectors
     */
    static findBySelectors(selectors: string[]): DetectionResult {
      try {
        const allElements: Element[] = [];
        const foundSelectors: string[] = [];

        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              allElements.push(...Array.from(elements));
              foundSelectors.push(selector);
            }
          } catch (e) {
            // Individual selector might fail, continue with others
            console.warn(`Selector failed: ${selector}`, e);
          }
        }

        // Remove duplicates
        const uniqueElements = Array.from(new Set(allElements));

        return {
          found: uniqueElements.length > 0,
          elements: uniqueElements
        };
      } catch (error) {
        return {
          found: false,
          error: error as Error
        };
      }
    }

    /**
     * Find elements by text content
     */
    static findByText(patterns: string[], options: { exact?: boolean; caseSensitive?: boolean } = {}): DetectionResult {
      try {
        const { exact = false, caseSensitive = true } = options;
        const elements: Element[] = [];

        // Get all text-containing elements
        const allElements = document.querySelectorAll('*');

        for (const element of Array.from(allElements)) {
          const text = element.textContent || '';
          const compareText = caseSensitive ? text : text.toLowerCase();

          const matches = patterns.some(pattern => {
            const comparePattern = caseSensitive ? pattern : pattern.toLowerCase();
            return exact ? compareText === comparePattern : compareText.includes(comparePattern);
          });

          if (matches && element.children.length === 0) {
            // Prefer leaf nodes (elements without children)
            elements.push(element);
          }
        }

        return {
          found: elements.length > 0,
          elements
        };
      } catch (error) {
        return {
          found: false,
          error: error as Error
        };
      }
    }

    /**
     * Find elements containing multiple text patterns
     */
    static findByMultipleTexts(patterns: string[], requireAll: boolean = true): DetectionResult {
      try {
        const elements: Element[] = [];
        const allElements = document.querySelectorAll('div, span, p, label, h1, h2, h3, h4, h5, h6');

        for (const element of Array.from(allElements)) {
          const text = element.textContent || '';

          const matchCount = patterns.filter(pattern => text.includes(pattern)).length;
          const matches = requireAll ? matchCount === patterns.length : matchCount > 0;

          if (matches) {
            elements.push(element);
          }
        }

        // Sort by text length to prioritize most specific elements
        elements.sort((a, b) => (a.textContent?.length || 0) - (b.textContent?.length || 0));

        return {
          found: elements.length > 0,
          elements
        };
      } catch (error) {
        return {
          found: false,
          error: error as Error
        };
      }
    }

    /**
     * Find form elements containing specific patterns
     */
    static findFormElements(patterns: string[]): DetectionResult {
      try {
        const forms = document.querySelectorAll('form');
        const relevantForms: Element[] = [];

        for (const form of Array.from(forms)) {
          const html = form.innerHTML;
          const hasPattern = patterns.some(pattern => html.includes(pattern));

          if (hasPattern) {
            relevantForms.push(form);
          }
        }

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

    /**
     * Find select elements with specific options
     */
    static findSelectElements(optionPatterns: string[]): DetectionResult {
      try {
        const selects = document.querySelectorAll('select');
        const matchingSelects: Element[] = [];

        for (const select of Array.from(selects)) {
          const options = Array.from(select.querySelectorAll('option'));
          const hasMatchingOption = options.some(option =>
            optionPatterns.some(pattern =>
              option.textContent?.includes(pattern) ||
              option.value.includes(pattern)
            )
          );

          if (hasMatchingOption) {
            matchingSelects.push(select);
          }
        }

        return {
          found: matchingSelects.length > 0,
          elements: matchingSelects
        };
      } catch (error) {
        return {
          found: false,
          error: error as Error
        };
      }
    }

    /**
     * Find button elements by text
     */
    static findButtons(buttonTexts: string[]): DetectionResult {
      try {
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        const matchingButtons: Element[] = [];

        for (const button of Array.from(buttons)) {
          const text = button.textContent || button.getAttribute('value') || '';
          const hasMatch = buttonTexts.some(btnText => text.includes(btnText));

          if (hasMatch) {
            matchingButtons.push(button);
          }
        }

        return {
          found: matchingButtons.length > 0,
          elements: matchingButtons
        };
      } catch (error) {
        return {
          found: false,
          error: error as Error
        };
      }
    }

    /**
     * Find parent container of element
     */
    static findParentContainer(element: Element, options: ElementDetectionOptions = {}): Element | null {
      const { includeParent = true, maxParentLevels = 3 } = options;

      if (!includeParent) return element;

      let parent = element.parentElement;

      for (let i = 0; i < maxParentLevels && parent; i++) {
        // Check if this is likely a row container
        if (parent.offsetWidth > window.innerWidth * 0.7) {
          return parent;
        }

        // Check for common row/container classes
        const containerClasses = ['row', 'container', 'filter', 'form-group', 'form-row', 'header'];
        const hasContainerClass = containerClasses.some(cls =>
          parent!.className.toLowerCase().includes(cls)
        );

        if (hasContainerClass) {
          return parent;
        }

        parent = parent.parentElement;
      }

      return element;
    }

    /**
     * Comprehensive element detection using multiple methods
     */
    static detectElements(options: ElementDetectionOptions = {}): DetectionResult {
      const results: Element[] = [];
      const { xpath, selectors, textPatterns } = options;

      // Try XPath
      if (xpath) {
        const xpathResult = this.findByXPath(xpath);
        if (xpathResult.found && xpathResult.elements) {
          results.push(...xpathResult.elements);
        }
      }

      // Try CSS selectors
      if (selectors && selectors.length > 0) {
        const selectorResult = this.findBySelectors(selectors);
        if (selectorResult.found && selectorResult.elements) {
          results.push(...selectorResult.elements);
        }
      }

      // Try text patterns
      if (textPatterns && textPatterns.length > 0) {
        const textResult = this.findByMultipleTexts(textPatterns);
        if (textResult.found && textResult.elements) {
          results.push(...textResult.elements);
        }
      }

      // Remove duplicates
      const uniqueElements = Array.from(new Set(results));

      // Find parent containers if requested
      if (options.includeParent) {
        const parentElements = uniqueElements.map(el =>
          this.findParentContainer(el, options) || el
        );

        return {
          found: parentElements.length > 0,
          elements: Array.from(new Set(parentElements))
        };
      }

      return {
        found: uniqueElements.length > 0,
        elements: uniqueElements
      };
    }
  }

  // Export convenience functions
  export const findByXPath = ElementDetector.findByXPath.bind(ElementDetector);
  export const findBySelectors = ElementDetector.findBySelectors.bind(ElementDetector);
  export const findByText = ElementDetector.findByText.bind(ElementDetector);
  export const findByMultipleTexts = ElementDetector.findByMultipleTexts.bind(ElementDetector);
  export const detectElements = ElementDetector.detectElements.bind(ElementDetector);

