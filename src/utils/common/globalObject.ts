

  /**
   * Global Object Manipulation Module
   * 
   * Provides utilities for manipulating global objects
   * and searching for specific properties in the window object
   */

  import { GlobalObjectOptions } from './types';

  export class GlobalObjectManipulator {
    /**
     * Search for objects in window matching patterns
     */
    static findGlobalObjects(patterns: string[] = ['report', '月次', 'Report']): string[] {
      const matchingKeys: string[] = [];

      Object.keys(window).forEach(key => {
        const lowerKey = key.toLowerCase();
        const matches = patterns.some(pattern =>
          lowerKey.includes(pattern.toLowerCase())
        );

        if (matches) {
          matchingKeys.push(key);
        }
      });

      return matchingKeys;
    }

    /**
     * Get global object value
     */
    static getGlobalObject(key: string): any {
      return (window as any)[key];
    }

    /**
     * Set global object value
     */
    static setGlobalObject(key: string, value: any): void {
      (window as any)[key] = value;
    }

    /**
     * Modify properties of global objects
     */
    static modifyGlobalProperties(
      patterns: string[],
      properties: { [key: string]: any },
      options: GlobalObjectOptions = {}
    ): Map<string, boolean> {
      const { recursive = false } = options;
      const results = new Map<string, boolean>();

      const globalKeys = this.findGlobalObjects(patterns);

      globalKeys.forEach(globalKey => {
        try {
          const obj = this.getGlobalObject(globalKey);

          if (obj && typeof obj === 'object') {
            Object.entries(properties).forEach(([prop, value]) => {
              const fullKey = `${globalKey}.${prop}`;

              // Direct property
              if (obj.hasOwnProperty(prop)) {
                obj[prop] = value;
                results.set(fullKey, true);
                console.log(`Set ${fullKey} to ${value}`);
              }

              // Nested property (if recursive is enabled)
              if (recursive) {
                const nestedResult = this.setNestedProperty(obj, prop, value);
                if (nestedResult) {
                  results.set(`${globalKey}.${nestedResult}`, true);
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error modifying ${globalKey}:`, error);
          results.set(globalKey, false);
        }
      });

      return results;
    }

    /**
     * Set nested property using dot notation
     */
    private static setNestedProperty(obj: any, path: string, value: any): string | null {
      const parts = path.split('.');
      let current = obj;
      let fullPath = '';

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        fullPath += (fullPath ? '.' : '') + part;

        if (!current[part]) return null;
        current = current[part];
      }

      const lastPart = parts[parts.length - 1];
      fullPath += (fullPath ? '.' : '') + lastPart;

      if (current.hasOwnProperty(lastPart)) {
        current[lastPart] = value;
        return fullPath;
      }

      return null;
    }

    /**
     * Search for year/month related properties
     */
    static findYearMonthProperties(): Map<string, string[]> {
      const results = new Map<string, string[]>();
      const patterns = ['year', 'month', '年度', '月', 'fiscal', 'period'];

      Object.keys(window).forEach(key => {
        try {
          const obj = (window as any)[key];

          if (obj && typeof obj === 'object') {
            const properties = this.searchObjectProperties(obj, patterns);

            if (properties.length > 0) {
              results.set(key, properties);
            }
          }
        } catch (error) {
          // Skip inaccessible properties
        }
      });

      return results;
    }

    /**
     * Search object properties recursively
     */
    private static searchObjectProperties(
      obj: any,
      patterns: string[],
      depth: number = 0,
      maxDepth: number = 3
    ): string[] {
      if (depth > maxDepth || !obj || typeof obj !== 'object') {
        return [];
      }

      const found: string[] = [];

      try {
        Object.keys(obj).forEach(key => {
          const lowerKey = key.toLowerCase();
          const matches = patterns.some(pattern =>
            lowerKey.includes(pattern.toLowerCase())
          );

          if (matches) {
            found.push(key);
          }

          // Recursive search
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const nestedResults = this.searchObjectProperties(
              obj[key],
              patterns,
              depth + 1,
              maxDepth
            );

            nestedResults.forEach(nestedKey => {
              found.push(`${key}.${nestedKey}`);
            });
          }
        });
      } catch (error) {
        // Skip errors (e.g., circular references)
      }

      return found;
    }

    /**
     * Hide year/month selectors by modifying global properties
     */
    static hideYearMonthSelectors(): Map<string, boolean> {
      const commonProperties = {
        'showYearMonthSelector': false,
        'yearMonthSelector.visible': false,
        'showYearSelector': false,
        'showMonthSelector': false,
        'displayYearMonth': false,
        'yearSelectorVisible': false,
        'monthSelectorVisible': false
      };

      return this.modifyGlobalProperties(
        ['report', 'Report', '月次', 'monthly', 'MonthlyReport'],
        commonProperties,
        { recursive: true }
      );
    }

    /**
     * Create bookmarklet for global object manipulation
     */
    static createBookmarklet(): string {
      const code = `
        javascript:(function(){
          const globalObjects = Object.keys(window).filter(key => {
            return key.includes('report') || key.includes('月次') || key.includes('Report');
          });
          
          globalObjects.forEach(objName => {
            try {
              const obj = window[objName];
              if (obj && typeof obj === 'object') {
                if (obj.hasOwnProperty('showYearMonthSelector')) {
                  obj.showYearMonthSelector = false;
                  console.log(objName + '.showYearMonthSelector = false');
                }
                if (obj.hasOwnProperty('yearMonthSelector')) {
                  obj.yearMonthSelector.visible = false;
                  console.log(objName + '.yearMonthSelector.visible = false');
                }
              }
            } catch (e) {}
          });
          console.log('Global object manipulation completed');
        })();
      `.replace(/\s+/g, ' ').trim();

      return code;
    }

    /**
     * Log all global objects and their properties
     */
    static logGlobalObjects(patterns?: string[]): void {
      const keys = patterns ? this.findGlobalObjects(patterns) : Object.keys(window);

      console.group('Global Objects Analysis');

      keys.forEach(key => {
        try {
          const value = (window as any)[key];
          console.group(key);
          console.log('Type:', typeof value);

          if (value && typeof value === 'object') {
            console.log('Properties:', Object.keys(value));
          } else {
            console.log('Value:', value);
          }

          console.groupEnd();
        } catch (error) {
          console.error(`Cannot access ${key}:`, error);
        }
      });

      console.groupEnd();
    }
  }

  // Export convenience functions
  export const findGlobalObjects = GlobalObjectManipulator.findGlobalObjects.bind(GlobalObjectManipulator);
  export const modifyGlobalProperties = GlobalObjectManipulator.modifyGlobalProperties.bind(GlobalObjectManipulator);
  export const hideYearMonthSelectors = GlobalObjectManipulator.hideYearMonthSelectors.bind(GlobalObjectManipulator);
  export const findYearMonthProperties = GlobalObjectManipulator.findYearMonthProperties.bind(GlobalObjectManipulator);
  export const logGlobalObjects = GlobalObjectManipulator.logGlobalObjects.bind(GlobalObjectManipulator);
