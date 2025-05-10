/**
 * Enhanced Year State Manager for Monthly Details CSV Import
 * 
 * This script implements a robust solution to the issue where the fiscal year automatically 
 * switches to 2025 after CSV import in the MonthlyReport functionality.
 * 
 * Features:
 * 1. Monitors CSV import operation and remembers the selected year
 * 2. Robust DOM element selection with multiple fallback mechanisms
 * 3. Uses MutationObserver to detect when elements are added to the DOM
 * 4. Intercepts console.log messages to detect CSV import activity
 * 5. Restores the correct year selection after import completes
 * 6. Provides user feedback with customizable notifications
 * 
 * Version: 1.0.0
 */

(function() {
  // Configuration options
  const config = {
    debugMode: true,                // Enable detailed console logging
    retryInterval: 200,             // Milliseconds between DOM element selection attempts
    maxRetries: 25,                 // Maximum number of attempts to find DOM elements
    observerTimeout: 10000,         // Maximum time to wait for DOM changes (ms)
    notificationTimeout: 5000,      // How long notifications stay visible (ms)
    notificationPosition: 'top-right' // Position for notifications
  };

  // Internal state
  let state = {
    originalYear: null,             // Year value before CSV import
    yearDetectedFromCSV: null,      // Year value detected from CSV content
    importInProgress: false,        // Flag to track if import is in progress
    domObserver: null,              // MutationObserver instance
    observerTarget: null,           // Element being observed
    yearSelector: null,             // Cached reference to year select element
    yearSelectorFound: false,       // Flag indicating if selector was found
    domScanAttempts: 0,             // Counter for DOM scan attempts
    lastError: null                 // Last error message
  };

  // Initialize the module
  function init() {
    log("Enhanced Year State Manager initializing...");
    
    // Set up console.log interceptor to detect CSV operations
    setupConsoleInterceptor();
    
    // Initial DOM scan
    scanForYearSelector();
    
    // Setup DOM change observer
    setupDOMObserver();
    
    log("Initialization complete");
  }

  // Enhanced logging function with debug mode support
  function log(message, type = 'info') {
    const prefix = "[YearManager]";
    if (!config.debugMode && type === 'debug') return;
    
    switch (type) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Sets up a MutationObserver to watch for DOM changes
   * This helps detect when the year selector is added to the DOM
   */
  function setupDOMObserver() {
    try {
      // Find a stable parent element to observe
      const targetElement = findObserverTarget();
      
      if (!targetElement) {
        log("No suitable observer target found. Will retry later.", 'warn');
        setTimeout(setupDOMObserver, config.retryInterval);
        return;
      }
      
      state.observerTarget = targetElement;
      log(`Setting up DOM observer on ${describeElement(targetElement)}`);
      
      // Create observer instance
      state.domObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            log("DOM change detected - scanning for year selector", 'debug');
            scanForYearSelector();
          }
        }
      });
      
      // Start observing
      state.domObserver.observe(targetElement, {
        childList: true,
        subtree: true
      });
      
      log("DOM observer started successfully");
      
      // Safety timeout to prevent observer from running forever
      setTimeout(() => {
        if (state.domObserver) {
          state.domObserver.disconnect();
          log("DOM observer timed out and was disconnected", 'warn');
        }
      }, config.observerTimeout);
      
    } catch (error) {
      log(`Error setting up DOM observer: ${error.message}`, 'error');
      state.lastError = error;
    }
  }

  /**
   * Finds a suitable target element for the MutationObserver
   * Returns the most appropriate container element available
   */
  function findObserverTarget() {
    // Try to find the main app container
    const selectors = [
      '.monthly-report-container',
      '.app-container',
      '#root',
      'body'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        log(`Found observer target: ${selector}`, 'debug');
        return element;
      }
    }
    
    // Fallback to document.body if nothing else is found
    return document.body;
  }

  /**
   * Scans the DOM for the year selector element
   * Uses multiple selectors and strategies for finding the element
   */
  function scanForYearSelector() {
    if (state.yearSelectorFound && state.yearSelector) {
      log("Year selector already found, skipping scan", 'debug');
      return state.yearSelector;
    }

    if (state.domScanAttempts >= config.maxRetries) {
      log("Maximum DOM scan attempts reached, giving up", 'warn');
      return null;
    }
    
    state.domScanAttempts++;
    log(`DOM scan attempt ${state.domScanAttempts}/${config.maxRetries}`, 'debug');
    
    try {
      // Try multiple selector strategies to find the year dropdown
      const yearSelector = findYearSelector();
      
      if (yearSelector) {
        log(`Found year selector: ${describeElement(yearSelector)}`);
        state.yearSelector = yearSelector;
        state.yearSelectorFound = true;
        
        // Store the current year value
        if (!state.importInProgress) {
          state.originalYear = yearSelector.value;
          log(`Current year value: ${state.originalYear}`);
        }
        
        return yearSelector;
      } else {
        log("Year selector not found, will retry", 'debug');
        setTimeout(scanForYearSelector, config.retryInterval);
        return null;
      }
    } catch (error) {
      log(`Error scanning for year selector: ${error.message}`, 'error');
      state.lastError = error;
      setTimeout(scanForYearSelector, config.retryInterval);
      return null;
    }
  }

  /**
   * Attempts to find the year selector using multiple strategies
   * Returns the element or null if not found
   */
  function findYearSelector() {
    // Strategy 1: By ID
    const idSelectors = ['yearSelect', 'fiscal-year-select', 'fiscalYearSelect'];
    for (const id of idSelectors) {
      const element = document.getElementById(id);
      if (element && isYearSelectorElement(element)) {
        log(`Found year selector by ID: ${id}`, 'debug');
        return element;
      }
    }
    
    // Strategy 2: By class name
    const classSelectors = [
      '.year-select', 
      '.fiscal-year-select',
      '.year-dropdown',
      '.fiscal-year-dropdown'
    ];
    
    for (const selector of classSelectors) {
      const element = document.querySelector(selector);
      if (element && isYearSelectorElement(element)) {
        log(`Found year selector by class: ${selector}`, 'debug');
        return element;
      }
    }
    
    // Strategy 3: By attribute - look for selects with year-related attributes
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
      if (select.id.includes('year') || 
          select.className.includes('year') ||
          (select.name && select.name.includes('year'))) {
        if (isYearSelectorElement(select)) {
          log(`Found year selector by attribute search`, 'debug');
          return select;
        }
      }
    }
    
    // Strategy 4: Look for any select with year values inside
    for (const select of selects) {
      if (isYearSelectorElement(select)) {
        log(`Found year selector by option content analysis`, 'debug');
        return select;
      }
    }
    
    // Strategy 5: Look for parent containers that might contain the year selector
    const containers = document.querySelectorAll('.monthly-report-header, .report-filters, .filter-section');
    for (const container of containers) {
      const select = container.querySelector('select');
      if (select && isYearSelectorElement(select)) {
        log(`Found year selector within container: ${container.className}`, 'debug');
        return select;
      }
    }

    // Nothing found
    return null;
  }

  /**
   * Checks if an element is likely to be the year selector
   */
  function isYearSelectorElement(element) {
    if (!element || element.tagName !== 'SELECT') return false;
    
    // Check 1: Element has year-related ID or class
    if (element.id && (element.id.toLowerCase().includes('year') || element.id.toLowerCase().includes('fiscal'))) {
      return true;
    }
    
    if (element.className && (element.className.toLowerCase().includes('year') || element.className.toLowerCase().includes('fiscal'))) {
      return true;
    }
    
    // Check 2: Check option values - if they contain year numbers (2020-2030)
    const options = element.querySelectorAll('option');
    const yearPattern = /20[2-3]\d/; // Match years 2020-2039
    
    for (const option of options) {
      if (yearPattern.test(option.value) || yearPattern.test(option.textContent)) {
        return true;
      }
    }
    
    // Check 3: Check if select has few options (years typically have few options)
    if (options.length > 0 && options.length < 10) {
      // Check if values are sequential numbers (like years)
      const values = Array.from(options).map(opt => parseInt(opt.value));
      
      if (values.every(val => !isNaN(val))) {
        const sequential = values.every((val, i) => i === 0 || val === values[i-1] + 1);
        if (sequential) return true;
      }
    }
    
    return false;
  }

  /**
   * Helper function to describe an element for debugging
   */
  function describeElement(element) {
    if (!element) return 'null';
    
    let description = element.tagName.toLowerCase();
    if (element.id) description += `#${element.id}`;
    if (element.className) description += `.${element.className.replace(/\s+/g, '.')}`;
    
    return description;
  }

  /**
   * Sets up the console.log interceptor to monitor CSV import activity
   * This allows us to detect when the import starts and completes
   */
  function setupConsoleInterceptor() {
    const originalConsoleLog = console.log;
    
    console.log = function(...args) {
      // Call the original console.log
      originalConsoleLog.apply(console, args);
      
      // Monitor for specific console messages that indicate CSV import activity
      const message = args.join(' ');
      
      // Look for CSV import start indicators
      if (message.includes('インポート処理開始') || 
          message.includes('CSVファイルから月次データをインポート') ||
          message.includes('変換されたAPIデータ')) {
        onImportStart();
      }
      
      // Look for year detection in CSV
      const yearMatch = message.match(/CSVから年度を検出: (\d{4})/);
      if (yearMatch) {
        const detectedYear = parseInt(yearMatch[1], 10);
        onYearDetected(detectedYear);
      }
      
      // Look for CSV import completion indicators
      if (message.includes('インポート成功コールバックを実行') || 
          message.includes('月次データをインポートしました') ||
          message.includes('インポート完了')) {
        onImportComplete();
      }
    };
  }

  /**
   * Called when CSV import starts
   */
  function onImportStart() {
    if (state.importInProgress) return;
    
    log("CSV import operation detected");
    state.importInProgress = true;
    
    // Ensure we have the current year value
    const yearSelector = scanForYearSelector();
    if (yearSelector && !state.originalYear) {
      state.originalYear = yearSelector.value;
      log(`Saved original year value: ${state.originalYear}`);
    }
  }

  /**
   * Called when a year is detected in the CSV
   */
  function onYearDetected(year) {
    log(`Detected year in CSV: ${year}`);
    state.yearDetectedFromCSV = year;
  }

  /**
   * Called when CSV import completes
   */
  function onImportComplete() {
    log("CSV import completion detected");
    
    // Set a small timeout to allow for DOM updates
    setTimeout(() => {
      restoreYear();
      state.importInProgress = false;
    }, 500);
  }

  /**
   * Restores the year selection to either the original value
   * or the value detected from the CSV
   */
  function restoreYear() {
    const yearToRestore = state.yearDetectedFromCSV || state.originalYear;
    if (!yearToRestore) {
      log("No year value to restore", 'warn');
      return;
    }
    
    const yearSelector = scanForYearSelector();
    if (!yearSelector) {
      log("Cannot restore year - selector not found", 'error');
      return;
    }
    
    // Check if year changed
    if (yearSelector.value !== yearToRestore) {
      log(`Restoring year value to: ${yearToRestore} (was: ${yearSelector.value})`);
      
      // Set the value
      yearSelector.value = yearToRestore;
      
      // Trigger change event
      const event = new Event('change', { bubbles: true });
      yearSelector.dispatchEvent(event);
      
      // Show notification
      showNotification(`✓ 年度を ${yearToRestore} に設定しました`);
    } else {
      log(`Year already set to ${yearToRestore}, no change needed`);
    }
  }

  /**
   * Displays a notification to the user
   */
  function showNotification(message, type = 'success') {
    try {
      // Check if notification container exists, create if not
      let container = document.getElementById('year-manager-notifications');
      if (!container) {
        container = document.createElement('div');
        container.id = 'year-manager-notifications';
        container.style.position = 'fixed';
        container.style.zIndex = '9999';
        
        // Position based on configuration
        switch (config.notificationPosition) {
          case 'top-right':
            container.style.top = '20px';
            container.style.right = '20px';
            break;
          case 'top-left':
            container.style.top = '20px';
            container.style.left = '20px';
            break;
          case 'bottom-right':
            container.style.bottom = '20px';
            container.style.right = '20px';
            break;
          case 'bottom-left':
            container.style.bottom = '20px';
            container.style.left = '20px';
            break;
          default:
            container.style.top = '20px';
            container.style.right = '20px';
        }
        
        document.body.appendChild(container);
      }
      
      // Create notification element
      const notification = document.createElement('div');
      notification.style.padding = '12px 16px';
      notification.style.marginBottom = '10px';
      notification.style.borderRadius = '4px';
      notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
      notification.style.fontSize = '14px';
      notification.style.transition = 'all 0.3s ease';
      notification.style.opacity = '0';
      
      // Style based on notification type
      if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
      } else if (type === 'error') {
        notification.style.backgroundColor = '#F44336';
        notification.style.color = 'white';
      } else if (type === 'warning') {
        notification.style.backgroundColor = '#FF9800';
        notification.style.color = 'white';
      } else {
        notification.style.backgroundColor = '#2196F3';
        notification.style.color = 'white';
      }
      
      notification.textContent = message;
      container.appendChild(notification);
      
      // Fade in
      setTimeout(() => {
        notification.style.opacity = '1';
      }, 10);
      
      // Remove after timeout
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, config.notificationTimeout);
      
    } catch (error) {
      log(`Error showing notification: ${error.message}`, 'error');
    }
  }

  // Start the module
  init();

  // Public API
  window.EnhancedYearStateManager = {
    getState: () => ({...state}),
    getConfig: () => ({...config}),
    forceYearChange: (year) => {
      const yearSelector = scanForYearSelector();
      if (yearSelector) {
        yearSelector.value = year;
        const event = new Event('change', { bubbles: true });
        yearSelector.dispatchEvent(event);
        return true;
      }
      return false;
    },
    debug: {
      findSelectors: findYearSelector,
      restoreYear: restoreYear,
      showNotification: showNotification
    }
  };
})();