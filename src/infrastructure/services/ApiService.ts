import { OptimizationRequest } from '@/application/dto/OptimizationRequest.dto';
import { OptimizationResponse, JobProgress, ApiError } from '@/application/dto/OptimizationResponse.dto';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError['error'];
  timestamp?: string;
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred'
        },
        timestamp: data.timestamp
      };
    }

    return {
      success: true,
      data: data.data || data,
      timestamp: data.timestamp
    };
  }

  async startOptimization(request: OptimizationRequest): Promise<ApiResponse<OptimizationResponse['data']>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return this.handleResponse<OptimizationResponse['data']>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed'
        }
      };
    }
  }

  async getJobStatus(jobId: string): Promise<ApiResponse<JobProgress>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });

      return this.handleResponse<JobProgress>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed'
        }
      };
    }
  }

  async downloadImage(jobId: string, imageId: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/download/${jobId}/${imageId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Download failed:', error);
      return null;
    }
  }

  async downloadAllImages(jobId: string, imageIds: string[]): Promise<Blob[]> {
    const downloadPromises = imageIds.map(imageId => this.downloadImage(jobId, imageId));
    const results = await Promise.allSettled(downloadPromises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<Blob> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }
}

export const apiService = new ApiService();
