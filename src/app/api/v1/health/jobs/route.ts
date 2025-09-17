import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/container';
import { RobustJobRepository } from '@/infrastructure/repositories/JobManager';

export async function GET(_request: NextRequest) {
  try {
    const jobRepository = container.get<RobustJobRepository>('jobRepository');
    
    // Get health status
    const healthStatus = jobRepository.getHealthStatus();
    const jobStats = jobRepository.getJobStats();
    
    return NextResponse.json({
      success: true,
      data: {
        health: healthStatus,
        stats: jobStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
