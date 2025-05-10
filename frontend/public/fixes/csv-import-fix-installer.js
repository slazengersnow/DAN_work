/**
 * CSV Import Fix Installer
 * 
 * This script installs the enhanced year state manager that prevents the year
 * from automatically switching to 2025 after CSV import in the MonthlyReport functionality.
 * 
 * It includes multiple fallback mechanisms:
 * 1. First tries to load the external script
 * 2. If that fails, uses an inline version as fallback
 * 3. Robust error handling and user feedback via notifications
 * 
 * Installation:
 * 1. Create a bookmark in your browser
 * 2. Set the URL to the entire content of this file prefixed with "javascript:"
 * 3. Click the bookmark when on the monthly report page
 * 
 * Version: 1.0.0
 */

(function() {
  // Configuration
  const config = {
    externalScriptUrl: '/public/fixes/enhanced-year-state-manager.js',
    debugMode: true,
    notificationDuration: 5000
  };
  
  let scriptInstalled = false;
  
  /**
   * Shows a notification message to the user
   */
  function showNotification(message, type = 'info') {
    // Create notification container if needed
    let container = document.getElementById('csv-fix-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'csv-fix-notifications';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
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
    const styles = {
      'info': { bg: '#2196F3', color: 'white' },
      'success': { bg: '#4CAF50', color: 'white' },
      'error': { bg: '#F44336', color: 'white' },
      'warning': { bg: '#FF9800', color: 'white' }
    };
    
    const style = styles[type] || styles.info;
    notification.style.backgroundColor = style.bg;
    notification.style.color = style.color;
    
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
    }, config.notificationDuration);
  }
  
  /**
   * Logs message to console with prefix
   */
  function log(message, type = 'info') {
    const prefix = '[CSV-Fix-Installer]';
    
    switch (type) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'debug':
        if (config.debugMode) {
          console.debug(`${prefix} ${message}`);
        }
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Checks if the script is already installed
   */
  function isScriptAlreadyInstalled() {
    return typeof window.EnhancedYearStateManager !== 'undefined';
  }
  
  /**
   * Loads the external script
   */
  function loadExternalScript() {
    return new Promise((resolve, reject) => {
      if (isScriptAlreadyInstalled()) {
        log('Script is already installed', 'warn');
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = config.externalScriptUrl;
      script.async = true;
      
      script.onload = () => {
        log('External script loaded successfully');
        resolve(true);
      };
      
      script.onerror = (error) => {
        log(`Failed to load external script: ${error}`, 'error');
        reject(new Error('Failed to load external script'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Installs the inline script version as fallback
   */
  function installInlineScript() {
    try {
      log('Installing inline script as fallback');
      
      // Function to inject the inline script
      const injectScript = (scriptContent) => {
        const script = document.createElement('script');
        script.textContent = scriptContent;
        document.head.appendChild(script);
      };
      
      // Minimal inline version of the script
      const inlineScript = `
      /**
       * CSV Import Fix - Inline Version
       * This is a minimal version of the enhanced-year-state-manager.js
       */
      (function() {
        console.log("[CSV-Fix] Installing inline year state manager");
        
        // Internal state
        let originalYear = null;
        let yearSelector = null;
        let importInProgress = false;
        
        // Find the year selector
        function findYearSelector() {
          // Try multiple selectors
          const selectors = [
            'select#yearSelect', 
            'select.year-select',
            'select#fiscal-year-select', 
            'select.fiscal-year-select',
            'select[name*="year"]'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
          }
          
          // Try looking for any select with year values
          const selects = document.querySelectorAll('select');
          for (const select of selects) {
            const options = select.querySelectorAll('option');
            for (const option of options) {
              if (/20[2-3]\\d/.test(option.value) || /20[2-3]\\d/.test(option.textContent)) {
                return select;
              }
            }
          }
          
          return null;
        }
        
        // Save the original year
        function saveOriginalYear() {
          if (!yearSelector) {
            yearSelector = findYearSelector();
          }
          
          if (yearSelector && !originalYear) {
            originalYear = yearSelector.value;
            console.log("[CSV-Fix] Saved original year:", originalYear);
          }
        }
        
        // Restore the year after import
        function restoreYear() {
          if (!originalYear || !yearSelector) return;
          
          console.log("[CSV-Fix] Restoring year to:", originalYear);
          yearSelector.value = originalYear;
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          yearSelector.dispatchEvent(event);
          
          // Show notification
          showNotification("✓ 年度を " + originalYear + " に設定しました");
        }
        
        // Show notification
        function showNotification(message) {
          let container = document.getElementById('csv-fix-notifications');
          if (!container) {
            container = document.createElement('div');
            container.id = 'csv-fix-notifications';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
          }
          
          const notification = document.createElement('div');
          notification.style.padding = '12px 16px';
          notification.style.marginBottom = '10px';
          notification.style.borderRadius = '4px';
          notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
          notification.style.backgroundColor = '#4CAF50';
          notification.style.color = 'white';
          notification.style.fontSize = '14px';
          notification.style.opacity = '0';
          notification.style.transition = 'all 0.3s ease';
          
          notification.textContent = message;
          container.appendChild(notification);
          
          setTimeout(() => { notification.style.opacity = '1'; }, 10);
          
          setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 300);
          }, 5000);
        }
        
        // Set up console.log interceptor
        const originalConsoleLog = console.log;
        console.log = function(...args) {
          originalConsoleLog.apply(console, args);
          
          const message = args.join(' ');
          
          // Detect import start
          if (message.includes('インポート処理開始') || 
              message.includes('CSVファイルから月次データをインポート')) {
            if (!importInProgress) {
              console.log("[CSV-Fix] CSV import detected");
              importInProgress = true;
              saveOriginalYear();
            }
          }
          
          // Detect import completion
          if (message.includes('インポート成功コールバックを実行') || 
              message.includes('月次データをインポートしました')) {
            console.log("[CSV-Fix] CSV import completion detected");
            
            setTimeout(() => {
              restoreYear();
              importInProgress = false;
            }, 500);
          }
        };
        
        // Run initial save
        setTimeout(saveOriginalYear, 1000);
        
        // Add to window for external access
        window.EnhancedYearStateManager = {
          getState: () => ({ 
            originalYear, 
            importInProgress
          }),
          forceYearChange: (year) => {
            if (yearSelector) {
              yearSelector.value = year;
              const event = new Event('change', { bubbles: true });
              yearSelector.dispatchEvent(event);
              return true;
            }
            return false;
          }
        };
        
        console.log("[CSV-Fix] Inline year state manager installed");
      })();
      `;
      
      injectScript(inlineScript);
      
      return true;
    } catch (error) {
      log(`Failed to install inline script: ${error}`, 'error');
      return false;
    }
  }
  
  /**
   * Main installation function
   */
  async function install() {
    try {
      log('Starting installation');
      
      if (isScriptAlreadyInstalled()) {
        log('Script is already installed');
        showNotification('CSV年度修正スクリプトは既にインストールされています', 'info');
        return true;
      }
      
      // First try to load the external script
      try {
        await loadExternalScript();
        scriptInstalled = true;
        showNotification('✓ CSV年度修正スクリプトを正常にインストールしました', 'success');
      } catch (error) {
        log('External script loading failed, trying inline version', 'warn');
        
        // Fallback to inline script
        if (installInlineScript()) {
          scriptInstalled = true;
          showNotification('✓ CSV年度修正スクリプトをインライン版でインストールしました', 'success');
        } else {
          showNotification('❌ CSV年度修正スクリプトのインストールに失敗しました', 'error');
          return false;
        }
      }
      
      return scriptInstalled;
    } catch (error) {
      log(`Installation failed: ${error}`, 'error');
      showNotification('❌ CSV年度修正スクリプトのインストールに失敗しました', 'error');
      return false;
    }
  }
  
  // Start installation
  install();
})();