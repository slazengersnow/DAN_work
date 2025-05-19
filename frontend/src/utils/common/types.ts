/**
 * Common Types and Interfaces
 */

// Framework detection types
export interface FrameworkDetection {
  React: boolean;
  Angular: boolean;
  Vue: boolean;
  jQuery: boolean;
}

// Detection method result
export interface DetectionResult {
  found: boolean;
  element?: Element;
  elements?: Element[];
  error?: Error;
}

// Diagnostic report interface
export interface DiagnosticReport {
  pageInfo: {
    url: string;
    title: string;
    frameworks: FrameworkDetection;
  };
  detectionResults: {
    xpath: DetectionResult;
    selector: DetectionResult;
    textSearch: DetectionResult;
    formElements: DetectionResult;
    shadowDom: DetectionResult;
  };
  security: {
    csp: string | null;
    inlineScriptTestResult: boolean;
  };
  domStructure: string;
  solutions: string[];
}

// Element detection options
export interface ElementDetectionOptions {
  xpath?: string;
  selectors?: string[];
  textPatterns?: string[];
  includeParent?: boolean;
  maxParentLevels?: number;
}

// DOM manipulation options
export interface DOMManipulationOptions {
  method?: 'hide' | 'remove';
  style?: Partial<CSSStyleDeclaration>;
  cssClass?: string;
}

// Global object manipulation
export interface GlobalObjectOptions {
  patterns?: string[];
  properties?: string[];
  recursive?: boolean;
}

// Console log styling
export interface ConsoleStyle {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
}