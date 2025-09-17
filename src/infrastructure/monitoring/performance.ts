import { features } from '../config/environment';
import { trackPerformance, trackAPIPerformance } from './analytics';

/**
 * Performance monitoring service
 */
export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.initialize();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private initialize(): void {
    if (!features.performanceMonitoring || typeof window === 'undefined') {
      return;
    }

    this.setupWebVitals();
    this.setupResourceTiming();
    this.setupNavigationTiming();
    this.setupLongTaskObserver();
    
    console.log('✅ Performance monitoring initialized');
  }

  private setupWebVitals(): void {
    // Core Web Vitals
    this.observeMetric('CLS', 'layout-shift');
    this.observeMetric('FID', 'first-input');
    this.observeMetric('LCP', 'largest-contentful-paint');
    this.observeMetric('FCP', 'first-contentful-paint');
    this.observeMetric('TTFB', 'navigation');
  }

  private setupResourceTiming(): void {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.trackResourceTiming(resourceEntry);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  private setupNavigationTiming(): void {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.trackNavigationTiming(navEntry);
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  private setupLongTaskObserver(): void {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const longTask = entry as PerformanceEntry;
        this.trackLongTask(longTask);
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    this.observers.push(observer);
  }

  private observeMetric(name: string, type: string): void {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const value = (entry as any).value || entry.startTime;
        this.recordMetric(name, value);
        trackPerformance(name, value);
      }
    });

    try {
      observer.observe({ entryTypes: [type] });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${name}:`, error);
    }
  }

  private trackResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.requestStart;
    const size = entry.transferSize || 0;
    
    // Track API calls
    if (entry.name.includes('/api/')) {
      const endpoint = entry.name.split('/api/')[1];
      if (endpoint) {
        const status = this.extractStatusFromResource(entry);
        trackAPIPerformance(endpoint, duration, status);
      }
    }

    // Track large resources
    if (size > 100000) { // 100KB
      trackPerformance('Large Resource', duration, 'ms');
    }

    // Track slow resources
    if (duration > 1000) { // 1 second
      trackPerformance('Slow Resource', duration, 'ms');
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'TCP Connection': entry.connectEnd - entry.connectStart,
      'TLS Handshake': entry.secureConnectionStart ? entry.connectEnd - entry.secureConnectionStart : 0,
      'Request': entry.responseStart - entry.requestStart,
      'Response': entry.responseEnd - entry.responseStart,
      'DOM Processing': entry.domContentLoadedEventEnd - entry.responseEnd,
      'Page Load': entry.loadEventEnd - entry.fetchStart,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        trackPerformance(name, value, 'ms');
      }
    });
  }

  private trackLongTask(entry: PerformanceEntry): void {
    trackPerformance('Long Task', entry.duration, 'ms');
  }

  private extractStatusFromResource(_entry: PerformanceResourceTiming): number {
    // This is a simplified approach - in reality, you'd need to check the actual response
    return 200; // Default to 200, could be enhanced with actual status checking
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Get performance metrics summary
   */
  getMetricsSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length === 0) continue;
      
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      summary[name] = { avg, min, max, count: values.length };
    }
    
    return summary;
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    // Only run on client side
    if (typeof window === 'undefined') {
      return metrics;
    }
    
    // Navigation timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      metrics['Page Load Time'] = timing.loadEventEnd - timing.navigationStart;
      metrics['DOM Ready Time'] = timing.domContentLoadedEventEnd - timing.navigationStart;
      metrics['First Byte Time'] = timing.responseStart - timing.navigationStart;
    }
    
    // Memory usage (if available)
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      metrics['Used JS Heap'] = memory.usedJSHeapSize;
      metrics['Total JS Heap'] = memory.totalJSHeapSize;
    }
    
    return metrics;
  }

  /**
   * Track custom performance metric
   */
  trackCustomMetric(name: string, value: number, unit: string = 'ms'): void {
    this.recordMetric(name, value);
    trackPerformance(name, value, unit);
  }

  /**
   * Start performance timer
   */
  startTimer(name: string): () => void {
    // Only run on client side
    if (typeof window === 'undefined') {
      return () => {};
    }
    
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.trackCustomMetric(name, duration);
    };
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const endTimer = this.startTimer(name);
    try {
      return fn();
    } finally {
      endTimer();
    }
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const endTimer = this.startTimer(name);
    try {
      return await fn();
    } finally {
      endTimer();
    }
  }

  /**
   * Clean up observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceService = PerformanceService.getInstance();

// Convenience functions
export const trackCustomMetric = performanceService.trackCustomMetric.bind(performanceService);
export const startTimer = performanceService.startTimer.bind(performanceService);
export const measureFunction = performanceService.measureFunction.bind(performanceService);
export const measureAsyncFunction = performanceService.measureAsyncFunction.bind(performanceService);
export const getMetricsSummary = performanceService.getMetricsSummary.bind(performanceService);
export const getCurrentMetrics = performanceService.getCurrentMetrics.bind(performanceService);
