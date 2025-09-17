import * as Sentry from '@sentry/nextjs';
import { env, isProduction } from '../config/environment';

/**
 * Sentry configuration and initialization
 */
export class SentryService {
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) {
      return;
    }

    if (!env.SENTRY_DSN) {
      console.warn('⚠️ Sentry DSN not provided, error tracking disabled');
      return;
    }

    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.SENTRY_ENVIRONMENT,
      enabled: isProduction && env.ENABLE_ERROR_REPORTING,
      
      // Performance monitoring
      tracesSampleRate: env.PERFORMANCE_SAMPLE_RATE,
      
      // Release tracking
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      
      // Error filtering
      beforeSend(event) {
        // Filter out non-error events in development
        if (!isProduction && event.level !== 'error') {
          return null;
        }
        
        // Filter out known non-critical errors
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.type === 'ChunkLoadError' || error?.type === 'Loading chunk failed') {
            return null;
          }
        }
        
        return event;
      },
      
      // Integration configuration
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
        Sentry.onUncaughtExceptionIntegration({ exitEvenIfOtherHandlersAreRegistered: false }),
        Sentry.onUnhandledRejectionIntegration({ mode: 'warn' }),
      ],
      
      // Additional options
      maxBreadcrumbs: 50,
      attachStacktrace: true,
      sendDefaultPii: false,
    });

    this.initialized = true;
    console.log('✅ Sentry initialized successfully');
  }

  /**
   * Capture an exception
   */
  static captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) return;
    
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Capture a message
   */
  static captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!this.initialized) return;
    Sentry.captureMessage(message, level);
  }

  /**
   * Add breadcrumb
   */
  static addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.initialized) return;
    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Set user context
   */
  static setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!this.initialized) return;
    Sentry.setUser(user);
  }

  /**
   * Set tags
   */
  static setTag(key: string, value: string): void {
    if (!this.initialized) return;
    Sentry.setTag(key, value);
  }

  /**
   * Set context
   */
  static setContext(key: string, context: Record<string, any>): void {
    if (!this.initialized) return;
    Sentry.setContext(key, context);
  }

  /**
   * Start a transaction
   */
  static startTransaction(name: string, op: string): any {
    if (!this.initialized) return undefined;
    return Sentry.startSpan({ name, op }, () => {});
  }

  /**
   * Get current transaction
   */
  static getCurrentTransaction(): any {
    if (!this.initialized) return undefined;
    return Sentry.getActiveSpan();
  }

  /**
   * Flush pending events
   */
  static async flush(timeout?: number): Promise<boolean> {
    if (!this.initialized) return true;
    return Sentry.flush(timeout);
  }
}

// Initialize Sentry on module load
SentryService.initialize();

// Export convenience functions
export const captureException = SentryService.captureException.bind(SentryService);
export const captureMessage = SentryService.captureMessage.bind(SentryService);
export const addBreadcrumb = SentryService.addBreadcrumb.bind(SentryService);
export const setUser = SentryService.setUser.bind(SentryService);
export const setTag = SentryService.setTag.bind(SentryService);
export const setContext = SentryService.setContext.bind(SentryService);
export const startTransaction = SentryService.startTransaction.bind(SentryService);
export const getCurrentTransaction = SentryService.getCurrentTransaction.bind(SentryService);
export const flush = SentryService.flush.bind(SentryService);
