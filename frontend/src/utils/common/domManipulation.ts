/**
 * DOM Manipulation Module
 * 
 * Provides utilities for manipulating DOM elements
 * including hiding, removing, and styling elements
 */

import { DOMManipulationOptions } from './types';

export class DOMManipulator {
  private static hiddenElements: Map<Element, string> = new Map();
  private static removedElements: Map<Element, { parent: Node; nextSibling: Node | null }> = new Map();

  /**
   * Hide element(s) using display: none
   */
  static hide(elements: Element | Element[]): void {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    
    elementsArray.forEach(element => {
      if (element instanceof HTMLElement) {
        // Store original display value
        this.hiddenElements.set(element, element.style.display);
        element.style.display = 'none';
      }
    });
  }

  /**
   * Show previously hidden element(s)
   */
  static show(elements?: Element | Element[]): void {
    if (!elements) {
      // Show all hidden elements
      this.hiddenElements.forEach((originalDisplay, element) => {
        if (element instanceof HTMLElement) {
          element.style.display = originalDisplay;
        }
      });
      this.hiddenElements.clear();
      return;
    }

    const elementsArray = Array.isArray(elements) ? elements : [elements];
    
    elementsArray.forEach(element => {
      const originalDisplay = this.hiddenElements.get(element);
      if (element instanceof HTMLElement && originalDisplay !== undefined) {
        element.style.display = originalDisplay;
        this.hiddenElements.delete(element);
      }
    });
  }

  /**
   * Remove element(s) from DOM (with ability to restore)
   */
  static remove(elements: Element | Element[]): void {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    
    elementsArray.forEach(element => {
      const parent = element.parentNode;
      const nextSibling = element.nextSibling;
      
      if (parent) {
        this.removedElements.set(element, { parent, nextSibling });
        parent.removeChild(element);
      }
    });
  }

  /**
   * Restore previously removed element(s)
   */
  static restore(elements?: Element | Element[]): void {
    if (!elements) {
      // Restore all removed elements
      this.removedElements.forEach((info, element) => {
        info.parent.insertBefore(element, info.nextSibling);
      });
      this.removedElements.clear();
      return;
    }

    const elementsArray = Array.isArray(elements) ? elements : [elements];
    
    elementsArray.forEach(element => {
      const info = this.removedElements.get(element);
      if (info) {
        info.parent.insertBefore(element, info.nextSibling);
        this.removedElements.delete(element);
      }
    });
  }

  /**
   * Apply CSS styles to element(s)
   */
  static applyStyles(elements: Element | Element[], styles: Partial<CSSStyleDeclaration>): void {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    
    elementsArray.forEach(element => {
      if (element instanceof HTMLElement) {
        Object.entries(styles).forEach(([property, value]) => {
          (element.style as any)[property] = value;
        });
      }
    });
  }

  /**
   * Add CSS class to element(s)
   */
  static addClass(elements: Element | Element[], className: string): void {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    
    elementsArray.forEach(element => {
      element.classList.add(className);
    });
  }

  /**
   * Remove CSS class from element(s)
   */
  static removeClass(elements: Element | Element[], className: string): void {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    
    elementsArray.forEach(element => {
      element.classList.remove(className);
    });
  }

  /**
   * Toggle CSS class on element(s)
   */
  static toggleClass(elements: Element | Element[], className: string): void {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    
    elementsArray.forEach(element => {
      element.classList.toggle(className);
    });
  }

  /**
   * Inject CSS styles into the page
   */
  static injectStyles(css: string, id?: string): HTMLStyleElement {
    // Check if style with ID already exists
    if (id) {
      const existingStyle = document.getElementById(id);
      if (existingStyle instanceof HTMLStyleElement) {
        existingStyle.textContent = css;
        return existingStyle;
      }
    }

    const style = document.createElement('style');
    if (id) style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    
    return style;
  }

  /**
   * Remove injected styles
   */
  static removeStyles(id: string): void {
    const style = document.getElementById(id);
    if (style) {
      style.remove();
    }
  }

  /**
   * Manipulate elements with options
   */
  static manipulate(elements: Element | Element[], options: DOMManipulationOptions): void {
    const { method = 'hide', style, cssClass } = options;
    
    switch (method) {
      case 'hide':
        this.hide(elements);
        break;
      case 'remove':
        this.remove(elements);
        break;
    }
    
    if (style) {
      this.applyStyles(elements, style);
    }
    
    if (cssClass) {
      this.addClass(elements, cssClass);
    }
  }

  /**
   * Create observer for dynamic content
   */
  static observeChanges(
    callback: (mutations: MutationRecord[]) => void,
    options: MutationObserverInit = {}
  ): MutationObserver {
    const defaultOptions: MutationObserverInit = {
      childList: true,
      subtree: true,
      attributes: true,
      ...options
    };
    
    const observer = new MutationObserver(callback);
    observer.observe(document.body, defaultOptions);
    
    return observer;
  }

  /**
   * Wait for element to appear
   */
  static async waitForElement(
    selector: string,
    timeout: number = 5000
  ): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Execute when DOM is ready
   */
  static ready(callback: () => void): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  /**
   * Execute when page is fully loaded
   */
  static loaded(callback: () => void): void {
    if (document.readyState === 'complete') {
      callback();
    } else {
      window.addEventListener('load', callback);
    }
  }

  /**
   * Clear all manipulations
   */
  static reset(): void {
    this.show();
    this.restore();
    this.hiddenElements.clear();
    this.removedElements.clear();
  }
}

// Export convenience functions
export const hide = DOMManipulator.hide.bind(DOMManipulator);
export const show = DOMManipulator.show.bind(DOMManipulator);
export const remove = DOMManipulator.remove.bind(DOMManipulator);
export const restore = DOMManipulator.restore.bind(DOMManipulator);
export const injectStyles = DOMManipulator.injectStyles.bind(DOMManipulator);
export const waitForElement = DOMManipulator.waitForElement.bind(DOMManipulator);
export const ready = DOMManipulator.ready.bind(DOMManipulator);
export const loaded = DOMManipulator.loaded.bind(DOMManipulator);