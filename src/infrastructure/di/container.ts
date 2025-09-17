import { IJobRepository } from '@/domain/repositories/IJobRepository';
import { IImageScraper } from '@/domain/services/IImageScraper';
import { IBatchRoomDetector } from '@/domain/services/IBatchRoomDetector';
import { IBatchImageOptimizer } from '@/domain/services/IBatchImageOptimizer';
import { RobustJobRepository } from '../repositories/JobManager';
import { ApifyScraperService } from '../services/ApifyScraperService';
import { GeminiBatchRoomDetectionService } from '../services/GeminiBatchRoomDetectionService';
import { GeminiBatchImageOptimizationService } from '../services/GeminiBatchImageOptimizationService';
import { GeminiBatchJobManager } from '../services/GeminiBatchJobManager';
import { ProcessOptimizationJob } from '@/application/use-cases/ProcessOptimizationJob';
import { GetJobStatus } from '@/application/use-cases/GetJobStatus';

// Global singleton instances to persist across API requests
let globalJobRepository: RobustJobRepository | null = null;
let globalDIContainer: DIContainer | null = null;

// Ensure we have a single job repository instance
function getGlobalJobRepository(): RobustJobRepository {
  if (!globalJobRepository) {
    globalJobRepository = new RobustJobRepository();
    console.log('🏗️ Created robust job repository instance:', globalJobRepository);
  }
  return globalJobRepository;
}

// Initialize the global repository immediately to ensure it persists
getGlobalJobRepository();

class DIContainer {
  private services: Map<string, any> = new Map();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): DIContainer {
    if (!globalDIContainer) {
      globalDIContainer = new DIContainer();
    }
    return globalDIContainer;
  }

  private initializeServices(): void {
    try {
      // Infrastructure services - create singleton instances
      const jobRepository = getGlobalJobRepository();
      console.log('🏗️ Creating DI Container with job repository instance:', jobRepository);
      
      this.services.set('jobRepository', jobRepository);
      
      // Initialize services with error handling
      try {
        this.services.set('imageScraper', new ApifyScraperService());
        console.log('✅ ApifyScraperService initialized');
      } catch (error) {
        console.error('❌ Failed to initialize ApifyScraperService:', error);
        throw error;
      }
      
      // Batch services only
      try {
        this.services.set('batchRoomDetector', new GeminiBatchRoomDetectionService());
        console.log('✅ GeminiBatchRoomDetectionService initialized');
      } catch (error) {
        console.error('❌ Failed to initialize GeminiBatchRoomDetectionService:', error);
        throw error;
      }
      
      try {
        this.services.set('batchImageOptimizer', new GeminiBatchImageOptimizationService());
        console.log('✅ GeminiBatchImageOptimizationService initialized');
      } catch (error) {
        console.error('❌ Failed to initialize GeminiBatchImageOptimizationService:', error);
        throw error;
      }
      
      try {
        this.services.set('batchJobManager', new GeminiBatchJobManager());
        console.log('✅ GeminiBatchJobManager initialized');
      } catch (error) {
        console.error('❌ Failed to initialize GeminiBatchJobManager:', error);
        throw error;
      }

      // Application services - only batch processing
      try {
        this.services.set('processOptimizationJob', new ProcessOptimizationJob(
          this.get<IJobRepository>('jobRepository'),
          this.get<IImageScraper>('imageScraper'),
          this.get<IBatchRoomDetector>('batchRoomDetector'),
          this.get<IBatchImageOptimizer>('batchImageOptimizer')
        ));
        console.log('✅ ProcessOptimizationJob initialized');
      } catch (error) {
        console.error('❌ Failed to initialize ProcessOptimizationJob:', error);
        throw error;
      }

      try {
        this.services.set('getJobStatus', new GetJobStatus(
          this.get<IJobRepository>('jobRepository')
        ));
        console.log('✅ GetJobStatus initialized');
      } catch (error) {
        console.error('❌ Failed to initialize GetJobStatus:', error);
        throw error;
      }
      
      console.log('🎉 All services initialized successfully');
    } catch (error) {
      console.error('💥 DI Container initialization failed:', error);
      throw new Error(`DI Container initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found in container`);
    }
    if (serviceName === 'jobRepository') {
      console.log('📦 Getting job repository instance:', service);
    }
    return service as T;
  }

  register<T>(serviceName: string, service: T): void {
    this.services.set(serviceName, service);
  }
}

export const container = DIContainer.getInstance();
