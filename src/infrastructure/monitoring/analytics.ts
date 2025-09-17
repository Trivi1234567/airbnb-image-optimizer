import { env, features } from '../config/environment';

/**
 * Analytics service for tracking user interactions and performance
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private initialize(): void {
    if (!features.analytics || this.isInitialized) {
      return;
    }

    // Initialize Google Analytics
    if (env.NEXT_PUBLIC_GA_ID) {
      this.initializeGoogleAnalytics();
    }

    // Initialize Mixpanel
    if (env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      this.initializeMixpanel();
    }

    this.isInitialized = true;
    console.log('✅ Analytics initialized successfully');
  }

  private initializeGoogleAnalytics(): void {
    if (typeof window === 'undefined') return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${env.NEXT_PUBLIC_GA_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.gtag = window.gtag || function() {
      (window.gtag as any).q = (window.gtag as any).q || [];
      (window.gtag as any).q.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', env.NEXT_PUBLIC_GA_ID!, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  private initializeMixpanel(): void {
    if (typeof window === 'undefined') return;

    // Load Mixpanel script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
    document.head.appendChild(script);

    script.onload = () => {
      if (window.mixpanel) {
        window.mixpanel.init(env.NEXT_PUBLIC_MIXPANEL_TOKEN!);
      }
    };
  }

  /**
   * Track a page view
   */
  trackPageView(page: string, title?: string): void {
    if (!this.isInitialized) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('config', env.NEXT_PUBLIC_GA_ID!, {
        page_title: title || document.title,
        page_location: page,
      });
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track('Page View', {
        page,
        title: title || document.title,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Track an event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) return;

    const eventData = {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, eventData);
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track(eventName, eventData);
    }
  }

  /**
   * Track optimization job events
   */
  trackOptimizationEvent(event: 'job_started' | 'job_completed' | 'job_failed', properties?: Record<string, any>): void {
    this.trackEvent(`Optimization ${event}`, {
      ...properties,
      category: 'optimization',
    });
  }

  /**
   * Track image processing events
   */
  trackImageEvent(event: 'image_processed' | 'image_failed' | 'image_downloaded', properties?: Record<string, any>): void {
    this.trackEvent(`Image ${event}`, {
      ...properties,
      category: 'image_processing',
    });
  }

  /**
   * Track user interaction events
   */
  trackUserEvent(event: 'url_submitted' | 'download_started' | 'error_occurred', properties?: Record<string, any>): void {
    this.trackEvent(`User ${event}`, {
      ...properties,
      category: 'user_interaction',
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent('Performance Metric', {
      metric,
      value,
      unit,
      category: 'performance',
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('config', env.NEXT_PUBLIC_GA_ID!, {
        custom_map: properties,
      });
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.people.set(properties);
    }
  }

  /**
   * Track API performance
   */
  trackAPIPerformance(endpoint: string, duration: number, status: number): void {
    this.trackPerformance(`API ${endpoint}`, duration);
    this.trackEvent('API Call', {
      endpoint,
      duration,
      status,
      category: 'api',
    });
  }

  /**
   * Track error events
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent('Error Occurred', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
      category: 'error',
    });
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Convenience functions
export const trackPageView = analytics.trackPageView.bind(analytics);
export const trackEvent = analytics.trackEvent.bind(analytics);
export const trackOptimizationEvent = analytics.trackOptimizationEvent.bind(analytics);
export const trackImageEvent = analytics.trackImageEvent.bind(analytics);
export const trackUserEvent = analytics.trackUserEvent.bind(analytics);
export const trackPerformance = analytics.trackPerformance.bind(analytics);
export const setUserProperties = analytics.setUserProperties.bind(analytics);
export const trackAPIPerformance = analytics.trackAPIPerformance.bind(analytics);
export const trackError = analytics.trackError.bind(analytics);

// Type declarations for global objects
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    mixpanel: {
      init: (token: string) => void;
      track: (event: string, properties?: Record<string, any>) => void;
      people: {
        set: (properties: Record<string, any>) => void;
      };
    };
  }
}
