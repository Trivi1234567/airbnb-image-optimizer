import { NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/container';

export async function GET(): Promise<NextResponse> {
  try {
    console.log('🔍 Testing container services...');
    
    const services = [
      'jobRepository',
      'imageScraper', 
      'batchRoomDetector',
      'batchImageOptimizer',
      'processOptimizationJob'
    ];
    
    const results: Record<string, any> = {};
    
    for (const serviceName of services) {
      try {
        const service = container.get(serviceName);
        const serviceType = (service as any)?.constructor?.name || 'Unknown';
        results[serviceName] = {
          status: 'success',
          type: serviceType,
          message: 'Service retrieved successfully'
        };
        console.log(`✅ ${serviceName}: ${serviceType}`);
      } catch (error) {
        results[serviceName] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to retrieve service'
        };
        console.error(`❌ ${serviceName}:`, error);
      }
    }
    
    const allHealthy = Object.values(results).every(r => r.status === 'success');
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: results,
      message: allHealthy ? 'All services are working' : 'Some services failed to initialize'
    }, {
      status: allHealthy ? 200 : 500
    });
    
  } catch (error) {
    console.error('💥 Container debug failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Container debug failed'
    }, {
      status: 500
    });
  }
}
