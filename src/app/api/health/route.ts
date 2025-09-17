import { NextResponse } from 'next/server';
import { env, features } from '@/infrastructure/config/environment';
import { getSecretsSummary, validateSecrets } from '@/infrastructure/config/secrets';
import { getCurrentMetrics, getMetricsSummary } from '@/infrastructure/monitoring/performance';

/**
 * Health check endpoint
 * Provides comprehensive system health information
 */
export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      environment: env.NODE_ENV,
    };

    // System information
    const system = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        external: Math.round(process.memoryUsage().external / 1024 / 1024), // MB
      },
      cpu: process.cpuUsage(),
    };

    // Feature flags status
    const featureFlags = {
      analytics: features.analytics,
      errorReporting: features.errorReporting,
      performanceMonitoring: features.performanceMonitoring,
      debug: features.debug,
      beta: features.beta,
    };

    // Secrets validation
    const secrets = {
      valid: validateSecrets(),
      summary: getSecretsSummary(),
    };

    // Performance metrics
    const performance = features.performanceMonitoring ? {
      current: getCurrentMetrics(),
      summary: getMetricsSummary(),
    } : null;

    // External service health
    const externalServices = await checkExternalServices();
    
    // Container health
    const containerHealth = await checkContainerHealth();

    // Database health (if configured)
    const database = env.DATABASE_URL ? await checkDatabaseHealth() : null;

    // Cache health (if configured)
    const cache = env.REDIS_URL ? await checkCacheHealth() : null;

    // Overall health status
    const isHealthy = secrets.valid && 
                     externalServices.apify.status === 'healthy' && 
                     externalServices.gemini.status === 'healthy';

    const response = {
      ...health,
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        system,
        featureFlags,
        secrets,
        externalServices,
        container: containerHealth,
        database,
        cache,
        performance,
      },
      responseTime: Date.now() - startTime,
    };

    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Check external services health
 */
async function checkExternalServices() {
  const services = {
    apify: { status: 'unknown', responseTime: 0, error: null as string | null },
    gemini: { status: 'unknown', responseTime: 0, error: null as string | null },
  };

  // Check Apify service
  try {
    const apifyStart = Date.now();
    const apifyResponse = await fetch(`${env.APIFY_API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${env.APIFY_TOKEN}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    
    services.apify = {
      status: apifyResponse.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - apifyStart,
      error: apifyResponse.ok ? null : `HTTP ${apifyResponse.status}`,
    };
  } catch (error) {
    services.apify = {
      status: 'unhealthy',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Gemini service
  try {
    const geminiStart = Date.now();
    const geminiResponse = await fetch(`${env.GEMINI_API_BASE_URL}/models`, {
      headers: {
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      signal: AbortSignal.timeout(5000),
    });
    
    services.gemini = {
      status: geminiResponse.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - geminiStart,
      error: geminiResponse.ok ? null : `HTTP ${geminiResponse.status}`,
    };
  } catch (error) {
    services.gemini = {
      status: 'unhealthy',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  return services;
}

/**
 * Check container health
 */
async function checkContainerHealth() {
  try {
    const startTime = Date.now();
    
    // Test if we can get services from the container
    const container = (await import('@/infrastructure/di/container')).container;
    
    // Test key services
    const services = [
      'jobRepository',
      'imageScraper', 
      'roomDetector',
      'imageOptimizer',
      'batchRoomDetector',
      'batchImageOptimizer',
      'processOptimizationJobWithBatch'
    ];
    
    const serviceStatus: Record<string, string> = {};
    let allHealthy = true;
    
    for (const serviceName of services) {
      try {
        container.get(serviceName);
        serviceStatus[serviceName] = 'healthy';
      } catch {
        serviceStatus[serviceName] = 'unhealthy';
        allHealthy = false;
      }
    }
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - startTime,
      services: serviceStatus
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check database health (placeholder for future implementation)
 */
async function checkDatabaseHealth() {
  try {
    // This would be implemented when database is added
    return {
      status: 'not_implemented',
      message: 'Database health check not yet implemented',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check cache health (placeholder for future implementation)
 */
async function checkCacheHealth() {
  try {
    // This would be implemented when Redis is added
    return {
      status: 'not_implemented',
      message: 'Cache health check not yet implemented',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
