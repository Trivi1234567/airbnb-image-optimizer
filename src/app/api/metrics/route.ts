import { NextResponse } from 'next/server';
import { env, features } from '@/infrastructure/config/environment';
import { getCurrentMetrics, getMetricsSummary } from '@/infrastructure/monitoring/performance';

/**
 * Metrics endpoint for Prometheus scraping
 * Provides system and application metrics in Prometheus format
 */
export async function GET(): Promise<NextResponse> {
  try {
    const metrics: string[] = [];
    
    // System metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    metrics.push('# HELP nodejs_memory_usage_bytes Node.js memory usage in bytes');
    metrics.push('# TYPE nodejs_memory_usage_bytes gauge');
    metrics.push(`nodejs_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`);
    metrics.push(`nodejs_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}`);
    metrics.push(`nodejs_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}`);
    metrics.push(`nodejs_memory_usage_bytes{type="external"} ${memoryUsage.external}`);
    metrics.push(`nodejs_memory_usage_bytes{type="arrayBuffers"} ${memoryUsage.arrayBuffers}`);
    
    metrics.push('# HELP nodejs_cpu_usage_microseconds Node.js CPU usage in microseconds');
    metrics.push('# TYPE nodejs_cpu_usage_microseconds counter');
    metrics.push(`nodejs_cpu_usage_microseconds{type="user"} ${cpuUsage.user}`);
    metrics.push(`nodejs_cpu_usage_microseconds{type="system"} ${cpuUsage.system}`);
    
    // Process metrics
    metrics.push('# HELP nodejs_process_uptime_seconds Process uptime in seconds');
    metrics.push('# TYPE nodejs_process_uptime_seconds gauge');
    metrics.push(`nodejs_process_uptime_seconds ${process.uptime()}`);
    
    metrics.push('# HELP nodejs_process_version_info Node.js version information');
    metrics.push('# TYPE nodejs_process_version_info gauge');
    metrics.push(`nodejs_process_version_info{version="${process.version}"} 1`);
    
    // Application metrics
    metrics.push('# HELP app_requests_total Total number of requests');
    metrics.push('# TYPE app_requests_total counter');
    metrics.push(`app_requests_total{method="GET",endpoint="/api/health"} 1`);
    metrics.push(`app_requests_total{method="GET",endpoint="/api/metrics"} 1`);
    
    // Performance metrics (if enabled)
    if (features.performanceMonitoring) {
      const currentMetrics = getCurrentMetrics();
      const summaryMetrics = getMetricsSummary();
      
      // Current performance metrics
      Object.entries(currentMetrics).forEach(([name, value]) => {
        const metricName = `app_performance_${name.toLowerCase().replace(/\s+/g, '_')}`;
        metrics.push(`# HELP ${metricName} ${name}`);
        metrics.push(`# TYPE ${metricName} gauge`);
        metrics.push(`${metricName} ${value}`);
      });
      
      // Summary performance metrics
      Object.entries(summaryMetrics).forEach(([name, data]) => {
        const baseName = `app_performance_${name.toLowerCase().replace(/\s+/g, '_')}`;
        
        metrics.push(`# HELP ${baseName}_avg Average ${name}`);
        metrics.push(`# TYPE ${baseName}_avg gauge`);
        metrics.push(`${baseName}_avg ${data.avg}`);
        
        metrics.push(`# HELP ${baseName}_min Minimum ${name}`);
        metrics.push(`# TYPE ${baseName}_min gauge`);
        metrics.push(`${baseName}_min ${data.min}`);
        
        metrics.push(`# HELP ${baseName}_max Maximum ${name}`);
        metrics.push(`# TYPE ${baseName}_max gauge`);
        metrics.push(`${baseName}_max ${data.max}`);
        
        metrics.push(`# HELP ${baseName}_count Count of ${name} measurements`);
        metrics.push(`# TYPE ${baseName}_count counter`);
        metrics.push(`${baseName}_count ${data.count}`);
      });
    }
    
    // Feature flags
    metrics.push('# HELP app_feature_flags Feature flags status');
    metrics.push('# TYPE app_feature_flags gauge');
    metrics.push(`app_feature_flags{flag="analytics"} ${features.analytics ? 1 : 0}`);
    metrics.push(`app_feature_flags{flag="error_reporting"} ${features.errorReporting ? 1 : 0}`);
    metrics.push(`app_feature_flags{flag="performance_monitoring"} ${features.performanceMonitoring ? 1 : 0}`);
    metrics.push(`app_feature_flags{flag="debug"} ${features.debug ? 1 : 0}`);
    metrics.push(`app_feature_flags{flag="beta"} ${features.beta ? 1 : 0}`);
    
    // Environment info
    metrics.push('# HELP app_environment_info Application environment information');
    metrics.push('# TYPE app_environment_info gauge');
    metrics.push(`app_environment_info{environment="${env.NODE_ENV}"} 1`);
    
    // Build info
    const buildInfo = {
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      build_time: process.env.VERCEL_GIT_COMMIT_DATE || 'unknown',
    };
    
    metrics.push('# HELP app_build_info Application build information');
    metrics.push('# TYPE app_build_info gauge');
    metrics.push(`app_build_info{version="${buildInfo.version}",build_time="${buildInfo.build_time}"} 1`);
    
    // Add timestamp
    metrics.push(`# HELP app_metrics_timestamp_seconds Timestamp of metrics collection`);
    metrics.push(`# TYPE app_metrics_timestamp_seconds gauge`);
    metrics.push(`app_metrics_timestamp_seconds ${Date.now() / 1000}`);
    
    return new NextResponse(metrics.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('Metrics collection failed:', error);
    
    return new NextResponse(`# ERROR: Failed to collect metrics\n# ${error instanceof Error ? error.message : 'Unknown error'}\n`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
