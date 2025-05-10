/**
 * DOM Detector Tool for CSV Import Fix
 * 
 * This diagnostic tool helps identify DOM elements needed for the year state manager.
 * It provides detailed reports about the page structure and potential year selector elements.
 * 
 * Features:
 * 1. Searches for potential year selector elements using multiple strategies
 * 2. Generates detailed reports about DOM structure
 * 3. Helps diagnose "Could not find identifiable element" errors
 * 4. Provides recommendations for the best selectors to use
 * 
 * Usage:
 * 1. Load this script in the browser console or as a bookmarklet
 * 2. The report will be displayed in the console
 * 3. Use the recommendations to fix DOM selection issues
 * 
 * Version: 1.0.0
 */

(function() {
  console.log("DOM Detector for CSV Import Fix - Starting analysis...");
  
  // Configuration
  const config = {
    yearPattern: /20[2-3]\d/, // Match years 2020-2039
    debugMode: true,
    generateVisualMarkers: true // Add visual markers to identified elements
  };
  
  // Track found elements
  const foundElements = {
    yearSelectors: [],
    containers: [],
    selects: []
  };
  
  /**
   * Main analysis function - runs all detectors and generates report
   */
  function analyzeDOM() {
    console.log("🔍 Starting DOM analysis...");
    
    // Find all potential year selectors
    findYearSelectorCandidates();
    
    // Generate detailed report
    generateYearSelectorReport();
    
    // Identify best candidates
    identifyBestCandidates();
    
    // Add visual markers to identified elements if enabled
    if (config.generateVisualMarkers) {
      addVisualMarkers();
    }
    
    console.log("✅ DOM analysis complete!");
  }
  
  /**
   * Finds all potential year selector elements using multiple strategies
   */
  function findYearSelectorCandidates() {
    console.log("Searching for potential year selector elements...");
    
    // Strategy 1: By ID
    const idSelectors = ['yearSelect', 'fiscal-year-select', 'fiscalYearSelect', 'year'];
    for (const id of idSelectors) {
      const element = document.getElementById(id);
      if (element) {
        console.log(`Found element by ID: #${id}`, element);
        foundElements.yearSelectors.push({
          element, 
          strategy: 'id', 
          selector: `#${id}`,
          confidence: isYearSelectorElement(element) ? 'high' : 'medium',
          isValid: isYearSelectorElement(element)
        });
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
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        console.log(`Found element by class: ${selector}`, element);
        foundElements.yearSelectors.push({
          element, 
          strategy: 'class', 
          selector,
          confidence: isYearSelectorElement(element) ? 'high' : 'medium',
          isValid: isYearSelectorElement(element)
        });
      });
    }
    
    // Strategy 3: By attribute
    const selects = document.querySelectorAll('select');
    foundElements.selects = Array.from(selects);
    
    selects.forEach(select => {
      // Check attributes for year-related terms
      if (select.id.includes('year') || 
          select.className.includes('year') ||
          (select.name && select.name.includes('year'))) {
        
        let selector = 'select';
        if (select.id) selector = `#${select.id}`;
        else if (select.className) selector = `select.${select.className.split(' ')[0]}`;
        
        foundElements.yearSelectors.push({
          element: select, 
          strategy: 'attribute', 
          selector,
          confidence: isYearSelectorElement(select) ? 'high' : 'medium',
          isValid: isYearSelectorElement(select)
        });
      }
      
      // Check if this select contains year options
      if (isYearSelectorElement(select)) {
        let selector = 'select';
        if (select.id) selector = `#${select.id}`;
        else if (select.className) selector = `select.${select.className.split(' ')[0]}`;
        else {
          // Generate a unique selector path
          selector = generateSelectorPath(select);
        }
        
        const alreadyExists = foundElements.yearSelectors.some(
          item => item.element === select
        );
        
        if (!alreadyExists) {
          foundElements.yearSelectors.push({
            element: select, 
            strategy: 'content', 
            selector,
            confidence: 'medium',
            isValid: true
          });
        }
      }
    });
    
    // Strategy 4: Look for container elements
    const containerSelectors = [
      '.monthly-report-header', 
      '.report-filters', 
      '.filter-section',
      '.year-filter',
      '.fiscal-year-container'
    ];
    
    for (const selector of containerSelectors) {
      const containers = document.querySelectorAll(selector);
      containers.forEach(container => {
        foundElements.containers.push({ 
          element: container, 
          selector 
        });
        
        // Look for selects within containers
        const containedSelects = container.querySelectorAll('select');
        containedSelects.forEach(select => {
          if (isYearSelectorElement(select)) {
            const relativePath = `${selector} > select` +
              (select.className ? `.${select.className.split(' ')[0]}` : '');
            
            const alreadyExists = foundElements.yearSelectors.some(
              item => item.element === select
            );
            
            if (!alreadyExists) {
              foundElements.yearSelectors.push({
                element: select, 
                strategy: 'container', 
                selector: relativePath,
                confidence: 'high',
                isValid: true
              });
            }
          }
        });
      });
    }
    
    // Log summary
    console.log(`Found ${foundElements.yearSelectors.length} potential year selector elements`);
    console.log(`Found ${foundElements.containers.length} potential container elements`);
    console.log(`Found ${foundElements.selects.length} total select elements on the page`);
  }
  
  /**
   * Generates a detailed report of all found year selectors
   */
  function generateYearSelectorReport() {
    console.log("📋 Generating Year Selector Report");
    console.log("=================================");
    
    if (foundElements.yearSelectors.length === 0) {
      console.log("❌ No potential year selectors found!");
      console.log("Recommendations:");
      console.log("- Check if the year selector is loaded dynamically");
      console.log("- Look for iframes or shadow DOM that might contain the selector");
      console.log("- Try running this tool after the page has fully loaded");
      return;
    }
    
    console.log(`Found ${foundElements.yearSelectors.length} potential year selectors:`);
    
    // Create a table for better visualization
    console.table(foundElements.yearSelectors.map(item => ({
      Strategy: item.strategy,
      Selector: item.selector,
      Confidence: item.confidence,
      IsValid: item.isValid,
      TagName: item.element.tagName,
      ID: item.element.id || '',
      Class: item.element.className || '',
      OptionCount: item.element.querySelectorAll('option').length || 0
    })));
    
    // Print detailed info about each candidate
    foundElements.yearSelectors.forEach((item, index) => {
      const element = item.element;
      
      console.log(`\n[${index + 1}] Selector: ${item.selector} (${item.strategy})`);
      console.log(`Tag: ${element.tagName}, ID: ${element.id || 'none'}, Class: ${element.className || 'none'}`);
      
      if (element.tagName === 'SELECT') {
        const options = element.querySelectorAll('option');
        console.log(`Options (${options.length}):`);
        
        Array.from(options).slice(0, 10).forEach((option, i) => {
          console.log(`  - [${i}] Value: "${option.value}", Text: "${option.textContent.trim()}"`);
        });
        
        if (options.length > 10) {
          console.log(`  - ... (${options.length - 10} more options)`);
        }
      }
      
      // Check for event listeners
      const hasChangeListener = element.onchange !== null;
      console.log(`Has inline onchange: ${hasChangeListener}`);
      
      // Show parent element info
      if (element.parentElement) {
        console.log(`Parent: ${element.parentElement.tagName}${element.parentElement.id ? ' #' + element.parentElement.id : ''}${element.parentElement.className ? ' .' + element.parentElement.className.replace(/\s+/g, '.') : ''}`);
      }
    });
  }
  
  /**
   * Identifies the best candidates for year selector
   */
  function identifyBestCandidates() {
    console.log("\n🎯 Best Candidates Recommendations");
    console.log("=================================");
    
    // Filter valid selectors
    const validSelectors = foundElements.yearSelectors.filter(item => item.isValid);
    
    if (validSelectors.length === 0) {
      console.log("❌ No valid year selectors found!");
      return;
    }
    
    // Sort by confidence
    const sortedSelectors = [...validSelectors].sort((a, b) => {
      const confidenceScore = { 'high': 3, 'medium': 2, 'low': 1 };
      return confidenceScore[b.confidence] - confidenceScore[a.confidence];
    });
    
    console.log("Recommended selectors (in order of preference):");
    
    sortedSelectors.forEach((item, index) => {
      console.log(`${index + 1}. ${item.selector} (${item.strategy}, ${item.confidence} confidence)`);
      
      // Generate JavaScript code to select this element
      const jsCode = `// JavaScript code to select this element
const yearSelector = document.querySelector('${item.selector}');`;
      
      console.log(jsCode);
    });
    
    // Overall recommendation
    if (sortedSelectors.length > 0) {
      const best = sortedSelectors[0];
      console.log("\n✅ Recommended implementation:");
      console.log(`Use the selector: '${best.selector}'`);
      
      const fullCode = `// Year selector implementation
function findYearSelector() {
  // Primary selector
  let selector = document.querySelector('${best.selector}');
  if (selector) return selector;
  
  // Fallbacks
${sortedSelectors.slice(1, 3).map((item, i) => `  // Fallback ${i + 1}
  selector = document.querySelector('${item.selector}');
  if (selector) return selector;`).join('\n')}
  
  // Last resort: search all selects for year options
  const selects = document.querySelectorAll('select');
  for (const select of selects) {
    const hasYearOptions = Array.from(select.options).some(opt => 
      /20[2-3]\\d/.test(opt.value) || /20[2-3]\\d/.test(opt.textContent)
    );
    if (hasYearOptions) return select;
  }
  
  return null;
}`;
      
      console.log(fullCode);
    }
  }
  
  /**
   * Adds visual markers to identified elements for debugging
   */
  function addVisualMarkers() {
    console.log("\n🎨 Adding visual markers to identified elements...");
    
    foundElements.yearSelectors.forEach((item, index) => {
      const element = item.element;
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.border = '2px solid red';
      overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
      overlay.style.padding = '0';
      overlay.style.zIndex = '9999';
      overlay.style.pointerEvents = 'none';
      overlay.style.transition = 'all 0.3s ease';
      
      // Add label
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = '-20px';
      label.style.left = '0';
      label.style.backgroundColor = 'red';
      label.style.color = 'white';
      label.style.padding = '2px 5px';
      label.style.fontSize = '12px';
      label.style.borderRadius = '3px';
      label.textContent = `Year Selector #${index + 1} (${item.confidence})`;
      
      overlay.appendChild(label);
      
      // Position the overlay
      const rect = element.getBoundingClientRect();
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      
      document.body.appendChild(overlay);
      
      // Remove after 10 seconds
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }, 10000);
    });
    
    console.log("Visual markers added (will disappear after 10 seconds)");
  }
  
  /**
   * Checks if an element is likely to be a year selector
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
    
    for (const option of options) {
      if (config.yearPattern.test(option.value) || config.yearPattern.test(option.textContent)) {
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
   * Generates a unique selector path for an element
   */
  function generateSelectorPath(element) {
    let path = '';
    
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();
      
      if (element.id) {
        selector += `#${element.id}`;
        path = selector + (path ? ' > ' + path : '');
        break;
      } else {
        if (element.className) {
          const classes = element.className.trim().split(/\s+/).join('.');
          if (classes) {
            selector += `.${classes}`;
          }
        }
        
        // Add index if needed for greater specificity
        const siblings = element.parentNode ? element.parentNode.children : [];
        if (siblings.length > 1) {
          const index = Array.prototype.indexOf.call(siblings, element) + 1;
          selector += `:nth-child(${index})`;
        }
        
        path = selector + (path ? ' > ' + path : '');
        element = element.parentNode;
      }
      
      // Limit path depth
      if (path.split('>').length > 4) {
        break;
      }
    }
    
    return path;
  }
  
  // Run the analysis
  analyzeDOM();
  
  // Expose to window for manual execution
  window.DOMDetector = {
    analyze: analyzeDOM,
    getFoundElements: () => foundElements,
    checkElement: (selector) => {
      const element = document.querySelector(selector);
      return {
        found: !!element,
        isYearSelector: element ? isYearSelectorElement(element) : false,
        element: element
      };
    }
  };
  
  console.log("DOM Detector is now available at window.DOMDetector");
  console.log("You can run additional analysis with window.DOMDetector.analyze()");
})();