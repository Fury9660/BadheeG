import { Platform } from 'react-native';

/**
 * Ultimate console security using Object.defineProperty to prevent overriding.
 * This will force the "Stop!" warning and suppress all other logs even in dev.
 */
export const initializeSecurity = () => {
  if (typeof console === 'undefined') return;

  // Save originals once
  // @ts-ignore
  if (global.__originalConsole) return;
  // @ts-ignore
  global.__originalConsole = {
    log: console.log,
    clear: console.clear,
    warn: console.warn,
    error: console.error
  };

  // @ts-ignore
  const { log: originalLog, clear: originalClear } = global.__originalConsole;
  const noop = () => {};

  const showWarning = () => {
    try {
      const warningTitle = 'Stop!';
      const warningTitleStyle = 'color: red; font-size: 50px; font-weight: bold; -webkit-text-stroke: 1px black;';
      const warningMessage = 'This is a browser feature intended for developers. If someone told you to copy and paste something here to enable a feature or "hack" someone\'s account, it\'s a scam and will give them access to your account.';
      
      if (Platform.OS === 'web') {
        originalLog(`%c${warningTitle}`, warningTitleStyle);
        originalLog(`%c${warningMessage}`, 'font-size: 18px; color: #555;');
      } else {
        originalLog(`\n*** ${warningTitle} ***\n${warningMessage}\n`);
      }
    } catch (e) {}
  };

  // 1. "Ultimate Lock" - Prevent anyone from overriding console methods
  const methods = ['log', 'info', 'warn', 'error', 'debug', 'table', 'dir', 'group', 'groupEnd', 'time', 'timeEnd'];
  
  methods.forEach((method) => {
    try {
      Object.defineProperty(console, method, {
        get: () => noop,
        set: () => {}, // Ignore attempts to restore or change
        configurable: false,
        enumerable: true
      });
    } catch (e) {
      // Fallback if defineProperty fails
      // @ts-ignore
      console[method] = noop;
    }
  });

  // 2. High-Frequency Clear and Warn loop (to catch late-booting logs)
  let clearCount = 0;
  const clearAndWarn = () => {
    if (originalClear) {
       try { originalClear(); } catch(e) {}
    }
    showWarning();
    clearCount++;
    if (clearCount >= 20) { // Run for 10 seconds (500ms * 20)
      clearInterval(securityInterval);
    }
  };

  const securityInterval = setInterval(clearAndWarn, 500);
  
  // Also run immediately
  clearAndWarn();
};
