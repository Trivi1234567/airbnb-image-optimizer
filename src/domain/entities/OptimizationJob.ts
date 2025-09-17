import { Image, ImagePair } from './Image';

export enum JobStatus {
  PENDING = 'pending',
  SCRAPING = 'scraping',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface OptimizationJob {
  id: string;
  airbnbUrl: string;
  status: JobStatus;
  roomType?: string; // Room type from Apify scraper
  images: Image[];
  imagePairs: ImagePair[];
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface JobProgress {
  jobId: string;
  status: JobStatus;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  currentStep?: string;
  error?: string;
  // Full job data when completed
  job?: {
    id: string;
    airbnbUrl: string;
    status: JobStatus;
    progress: {
      total: number;
      completed: number;
      failed: number;
    };
    createdAt: string;
    updatedAt: string;
  };
  images?: Array<{
    id: string;
    originalUrl: string;
    fileName: string;
    roomType: string;
    processingStatus: string;
    error?: string;
  }>;
  imagePairs?: Array<{
    original: {
      id: string;
      originalUrl: string;
      fileName: string;
      roomType: string;
      processingStatus: string;
      error?: string;
    };
    optimized?: {
      id: string;
      originalUrl: string;
      fileName: string;
      roomType: string;
      processingStatus: string;
      error?: string;
    };
    roomType: string;
    fileName: string;
  }>;
}
