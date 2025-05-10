/**
 * FixedUIScript.js - Comprehensive UI enhancement for monthly report and employee detail pages
 * 
 * This script:
 * 1. Cleans up any existing observers and intervals
 * 2. Handles monthly report year selector visibility
 * 3. Adds year selector to employee detail page when needed
 * 4. Uses multiple detection strategies for reliability
 * 5. Implements performance optimizations
 * 6. Provides visual feedback for year selection changes
 */
(function() {
  // Configuration
  const config = {
    observerTimeout: 50,
    processingDelay: 200,
    observerConfig: { childList: true, subtree: true, attributes: true },
    cssClass: 'enhanced-ui-script',
    monthlyReportTabSelector: '.monthly-tab-content',
    employeeDetailSelector: '.employee-detail-container',
    yearSelectorContainer: '.year-selector-container'
  };

  // State tracking
  let isProcessing = false;
  let currentObserver = null;
  let intervalIds = [];
  let scriptInitialized = false;

  // Cleanup any existing scripts to prevent conflicts
  function cleanupExistingScripts() {
    // Disconnect any existing observers
    if (window._existingObservers) {
      window._existingObservers.forEach(observer => {
        if (observer && typeof observer.disconnect === 'function') {
          observer.disconnect();
        }
      });
    }
    
    // Clear any existing intervals
    if (window._existingIntervals) {
      window._existingIntervals.forEach(id => clearInterval(id));
    }
    
    // Reset global trackers
    window._existingObservers = [];
    window._existingIntervals = [];
    
    // Disconnect current observer if exists
    if (currentObserver) {
      currentObserver.disconnect();
      currentObserver = null;
    }
    
    // Clear our intervals
    intervalIds.forEach(id => clearInterval(id));
    intervalIds = [];
  }

  // Utility: Find element by text content
  function findElementByText(selector, text) {
    const elements = Array.from(document.querySelectorAll(selector));
    return elements.find(el => el.textContent.includes(text));
  }

  // Utility: debounce function
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Utility: create style element
  function addStyles() {
    const styleId = 'fixed-ui-script-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .employee-year-selector {
        margin: 15px 0;
        padding: 10px;
        background-color: #f5f5f5;
        border-radius: 4px;
        display: flex;
        align-items: center;
      }
      .employee-year-selector label {
        margin-right: 10px;
        font-weight: bold;
      }
      .employee-year-selector select {
        padding: 5px 10px;
        border-radius: 4px;
        border: 1px solid #ccc;
      }
      .year-changed-indicator {
        padding: 3px 8px;
        margin-left: 10px;
        background-color: #e6f7e6;
        color: #28a745;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .year-changed-indicator.visible {
        opacity: 1;
      }
      /* Hide top year selector in monthly report page */
      .react-tabs__tab-panel--selected .card-header .year-selector-container {
        display: none !important;
      }
      /* Keep the year selector in monthly detail tab visible */
      .monthly-tab-content .year-selector-container {
        display: flex !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Monthly Report: Hide the top year selector, keep tab year selector
  function handleMonthlyReportPage() {
    try {
      const tabPanel = document.querySelector('.react-tabs__tab-panel--selected');
      if (!tabPanel) return;
      
      // Try multiple strategies to find year selectors
      const strategies = [
        // Strategy 1: Direct class selector
        () => {
          const topSelectors = tabPanel.querySelectorAll('.card-header .year-selector-container');
          return Array.from(topSelectors);
        },
        // Strategy 2: Find by nearby text
        () => {
          const cardHeaders = tabPanel.querySelectorAll('.card-header');
          const yearSelectors = [];
          cardHeaders.forEach(header => {
            const titleElement = findElementByText('h5, h6, div', '月次報告');
            if (titleElement && titleElement.closest('.card-header') === header) {
              const selector = header.querySelector('.year-selector-container');
              if (selector) yearSelectors.push(selector);
            }
          });
          return yearSelectors;
        },
        // Strategy 3: Find by structure pattern
        () => {
          const headers = tabPanel.querySelectorAll('.card-header');
          return Array.from(headers)
            .filter(header => header.querySelector('select'))
            .map(header => header.querySelector('.year-selector-container, div:has(select)'))
            .filter(Boolean);
        }
      ];
      
      // Try each strategy until we find selectors
      let foundSelectors = [];
      for (const strategy of strategies) {
        foundSelectors = strategy();
        if (foundSelectors.length > 0) break;
      }
      
      // Make sure we don't hide selectors within the monthly tab content
      foundSelectors.forEach(selector => {
        if (!selector.closest(config.monthlyReportTabSelector)) {
          selector.style.display = 'none';
          selector.dataset.hiddenByScript = 'true';
        }
      });
      
      // Ensure monthly tab selector is visible
      const monthlyTabSelectors = document.querySelectorAll(`${config.monthlyReportTabSelector} .year-selector-container`);
      monthlyTabSelectors.forEach(selector => {
        selector.style.display = 'flex';
        selector.dataset.shownByScript = 'true';
      });
    } catch (error) {
      console.error('Error in handleMonthlyReportPage:', error);
    }
  }

  // Employee Detail: Add year selector if needed
  function handleEmployeeDetailPage() {
    try {
      const employeeDetail = document.querySelector(config.employeeDetailSelector);
      if (!employeeDetail) return;
      
      // Check if we already added a year selector
      if (employeeDetail.querySelector('.employee-year-selector')) return;
      
      // Find tab container to get year values
      const tabContainer = document.querySelector('.react-tabs, .tab-container');
      if (!tabContainer) return;
      
      // Try to find existing year selector to clone its options
      const existingSelector = document.querySelector('select[name="year"]');
      if (!existingSelector) return;
      
      // Create new year selector
      const selectorContainer = document.createElement('div');
      selectorContainer.className = 'employee-year-selector';
      
      const label = document.createElement('label');
      label.textContent = '年度:';
      selectorContainer.appendChild(label);
      
      const select = document.createElement('select');
      select.className = 'form-control employee-year-select';
      select.style.width = 'auto';
      
      // Clone options from existing selector
      Array.from(existingSelector.options).forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.textContent;
        select.appendChild(option);
      });
      
      // Set current value from existing selector
      select.value = existingSelector.value;
      selectorContainer.appendChild(select);
      
      // Add visual feedback indicator
      const indicator = document.createElement('span');
      indicator.className = 'year-changed-indicator';
      indicator.textContent = '✓ 更新されました';
      selectorContainer.appendChild(indicator);
      
      // Insert after the header
      const header = employeeDetail.querySelector('h2, h3, .header');
      if (header) {
        header.parentNode.insertBefore(selectorContainer, header.nextSibling);
      } else {
        employeeDetail.insertBefore(selectorContainer, employeeDetail.firstChild);
      }
      
      // Add change handler
      select.addEventListener('change', function() {
        // Update other selectors
        document.querySelectorAll('select[name="year"]').forEach(sel => {
          if (sel !== select) sel.value = select.value;
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          sel.dispatchEvent(event);
        });
        
        // Show feedback indicator
        indicator.classList.add('visible');
        setTimeout(() => {
          indicator.classList.remove('visible');
        }, 2000);
      });
    } catch (error) {
      console.error('Error in handleEmployeeDetailPage:', error);
    }
  }

  // Setup observer with debouncing
  function setupObserver() {
    cleanupExistingScripts();
    
    const debouncedProcess = debounce(() => {
      if (isProcessing) return;
      isProcessing = true;
      
      setTimeout(() => {
        try {
          // Apply changes based on current page
          if (document.querySelector(config.monthlyReportTabSelector)) {
            handleMonthlyReportPage();
          }
          
          if (document.querySelector(config.employeeDetailSelector)) {
            handleEmployeeDetailPage();
          }
        } catch (e) {
          console.error('Error processing UI changes:', e);
        } finally {
          isProcessing = false;
        }
      }, config.processingDelay);
    }, config.observerTimeout);
    
    // Set up mutation observer
    currentObserver = new MutationObserver((mutations) => {
      // Filter relevant mutations to reduce processing
      const relevantMutation = mutations.some(mutation => {
        // Only process if relevant elements were added
        const addedNodes = Array.from(mutation.addedNodes);
        return addedNodes.some(node => {
          if (node.nodeType !== 1) return false;
          const element = node;
          return element.matches && (
            element.matches('.card-header, .tab-content, .react-tabs__tab-panel, .employee-detail-container') ||
            element.querySelector('.card-header, .tab-content, .react-tabs__tab-panel, .employee-detail-container, .year-selector-container')
          );
        });
      });
      
      if (relevantMutation) {
        debouncedProcess();
      }
    });
    
    // Start observing
    currentObserver.observe(document.body, config.observerConfig);
    
    // Store observer for cleanup
    if (!window._existingObservers) window._existingObservers = [];
    window._existingObservers.push(currentObserver);
    
    // Initial processing
    debouncedProcess();
    
    // Also set an interval as backup to ensure UI state is maintained
    const intervalId = setInterval(debouncedProcess, 2000);
    intervalIds.push(intervalId);
    if (!window._existingIntervals) window._existingIntervals = [];
    window._existingIntervals.push(intervalId);
  }

  // Initialize script
  function init() {
    if (scriptInitialized) return;
    scriptInitialized = true;
    
    addStyles();
    setupObserver();
    
    console.log('FixedUIScript initialized successfully');
  }

  // Start the script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();