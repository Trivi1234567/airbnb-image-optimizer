export interface BatchJob {
  id: string;
  type: 'room_detection' | 'image_optimization';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  resultCount?: number;
  failedCount?: number;
}

export interface IBatchJobManager {
  /**
   * Create a new batch job
   * @param type Type of batch job
   * @param requests Array of requests to process
   * @returns Promise with batch job ID
   */
  createBatchJob(type: 'room_detection' | 'image_optimization', requests: any[]): Promise<string>;

  /**
   * Get batch job status
   * @param jobId Batch job ID
   * @returns Promise with batch job status
   */
  getBatchJobStatus(jobId: string): Promise<BatchJob>;

  /**
   * Get batch job results
   * @param jobId Batch job ID
   * @returns Promise with batch job results
   */
  getBatchJobResults(jobId: string): Promise<any[]>;

  /**
   * Cancel a batch job
   * @param jobId Batch job ID
   * @returns Promise indicating success
   */
  cancelBatchJob(jobId: string): Promise<boolean>;

  /**
   * Delete a batch job
   * @param jobId Batch job ID
   * @returns Promise indicating success
   */
  deleteBatchJob(jobId: string): Promise<boolean>;
}
