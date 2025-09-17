import { IJobRepository } from '@/domain/repositories/IJobRepository';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';
import { logger } from '../config/logger';

/**
 * Robust Job Manager that ensures job persistence across all API requests
 * Uses a module-level singleton pattern that works reliably with Next.js
 */
class JobManager {
  private static instance: JobManager | null = null;
  private jobs: Map<string, OptimizationJob> = new Map();
  private readonly MAX_JOBS = 1000; // Prevent memory leaks
  private readonly JOB_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private _cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    logger.info('JobManager initialized');
    // Clean up expired jobs every hour
    this._cleanupInterval = setInterval(() => this.cleanupExpiredJobs(), 60 * 60 * 1000);
  }

  static getInstance(): JobManager {
    if (!JobManager.instance) {
      JobManager.instance = new JobManager();
      logger.info('Created new JobManager instance');
    }
    return JobManager.instance;
  }

  // Reset instance for testing
  static resetInstance(): void {
    JobManager.instance = null;
  }

  async create(job: OptimizationJob): Promise<OptimizationJob> {
    try {
      // Check if job already exists
      if (this.jobs.has(job.id)) {
        logger.warn('Job already exists, updating instead', { jobId: job.id });
        return this.update(job);
      }

      // Check job limit
      if (this.jobs.size >= this.MAX_JOBS) {
        this.cleanupOldestJobs();
      }

      this.jobs.set(job.id, { ...job });
      
      logger.info('Job created successfully', {
        jobId: job.id,
        status: job.status,
        totalJobs: this.jobs.size,
        availableJobs: Array.from(this.jobs.keys())
      });

      return job;
    } catch (error) {
      logger.error('Failed to create job', { jobId: job.id, error });
      throw error;
    }
  }

  async findById(id: string): Promise<OptimizationJob | null> {
    try {
      const job = this.jobs.get(id);
      
      if (!job) {
        logger.warn('Job not found', {
          requestedId: id,
          totalJobs: this.jobs.size,
          availableJobs: Array.from(this.jobs.keys())
        });
        return null;
      }

      // Check if job is expired
      if (this.isJobExpired(job)) {
        logger.info('Job expired, removing', { jobId: id });
        this.jobs.delete(id);
        return null;
      }

      logger.debug('Job found', { jobId: id, status: job.status });
      return job;
    } catch (error) {
      logger.error('Failed to find job', { jobId: id, error });
      throw error;
    }
  }

  async update(job: OptimizationJob): Promise<OptimizationJob> {
    try {
      if (!this.jobs.has(job.id)) {
        logger.warn('Job not found for update, creating new', { jobId: job.id });
        return this.create(job);
      }

      const updatedJob = { ...job, updatedAt: new Date() };
      this.jobs.set(job.id, updatedJob);
      
      logger.debug('Job updated', { jobId: job.id, status: job.status });
      return updatedJob;
    } catch (error) {
      logger.error('Failed to update job', { jobId: job.id, error });
      throw error;
    }
  }

  async updateStatus(id: string, status: JobStatus, error?: string): Promise<void> {
    try {
      const job = this.jobs.get(id);
      if (!job) {
        logger.warn('Job not found for status update', { jobId: id });
        return;
      }

      const updatedJob = {
        ...job,
        status,
        ...(error !== undefined && { error }),
        updatedAt: new Date(),
        ...(status === JobStatus.COMPLETED || status === JobStatus.FAILED ? { completedAt: new Date() } : {})
      };

      this.jobs.set(id, updatedJob);
      
      logger.info('Job status updated', { jobId: id, status, error });
    } catch (error) {
      logger.error('Failed to update job status', { jobId: id, status, error });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const deleted = this.jobs.delete(id);
      if (deleted) {
        logger.info('Job deleted', { jobId: id });
      } else {
        logger.warn('Job not found for deletion', { jobId: id });
      }
    } catch (error) {
      logger.error('Failed to delete job', { jobId: id, error });
      throw error;
    }
  }

  async findAll(): Promise<OptimizationJob[]> {
    try {
      const jobs = Array.from(this.jobs.values());
      logger.debug('Retrieved all jobs', { count: jobs.length });
      return jobs;
    } catch (error) {
      logger.error('Failed to retrieve all jobs', { error });
      throw error;
    }
  }

  // Health check method
  getHealthStatus(): { totalJobs: number; availableJobs: string[]; memoryUsage: number } {
    return {
      totalJobs: this.jobs.size,
      availableJobs: Array.from(this.jobs.keys()),
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  // Cleanup methods
  private cleanupExpiredJobs(): void {
    let cleanedCount = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (this.isJobExpired(job)) {
        this.jobs.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired jobs', { cleanedCount, remainingJobs: this.jobs.size });
    }
  }

  private cleanupOldestJobs(): void {
    const jobsArray = Array.from(this.jobs.entries());
    jobsArray.sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());
    
    const toRemove = jobsArray.slice(0, Math.floor(this.MAX_JOBS * 0.1)); // Remove 10% of oldest jobs
    
    for (const [id] of toRemove) {
      this.jobs.delete(id);
    }

    logger.info('Cleaned up oldest jobs', { removedCount: toRemove.length, remainingJobs: this.jobs.size });
  }

  private isJobExpired(job: OptimizationJob): boolean {
    const now = Date.now();
    const jobAge = now - job.createdAt.getTime();
    return jobAge > this.JOB_TTL;
  }

  // Debug methods
  getJobStats(): { totalJobs: number; statusCounts: Record<string, number>; oldestJob: string | null; newestJob: string | null } {
    const statusCounts: Record<string, number> = {};
    let oldestJob: string | null = null;
    let newestJob: string | null = null;
    let oldestTime = Infinity;
    let newestTime = 0;

    for (const [id, job] of this.jobs.entries()) {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
      
      const jobTime = job.createdAt.getTime();
      if (jobTime < oldestTime) {
        oldestTime = jobTime;
        oldestJob = id;
      }
      if (jobTime > newestTime) {
        newestTime = jobTime;
        newestJob = id;
      }
    }

    return {
      totalJobs: this.jobs.size,
      statusCounts,
      oldestJob,
      newestJob
    };
  }

  // Cleanup interval when shutting down
  cleanup(): void {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }

  // Additional repository methods
  async findByStatus(status: JobStatus): Promise<OptimizationJob[]> {
    const jobs = Array.from(this.jobs.values());
    return jobs.filter(job => job.status === status);
  }

  async findExpiredJobs(olderThan: Date): Promise<OptimizationJob[]> {
    const jobs = Array.from(this.jobs.values());
    return jobs.filter(job => job.createdAt < olderThan);
  }
}

// Create a truly global singleton that persists across all API requests
// This ensures the same instance is used across all Next.js API routes
declare global {
  // eslint-disable-next-line no-var
  var __jobManager: JobManager | undefined;
}

// Use global variable to ensure persistence across Next.js API routes
const jobManager = globalThis.__jobManager ?? (globalThis.__jobManager = JobManager.getInstance());

// Export the job manager as a repository implementation
export class RobustJobRepository implements IJobRepository {
  async create(job: OptimizationJob): Promise<OptimizationJob> {
    return jobManager.create(job);
  }

  async findById(id: string): Promise<OptimizationJob | null> {
    return jobManager.findById(id);
  }

  async update(job: OptimizationJob): Promise<OptimizationJob> {
    return jobManager.update(job);
  }

  async updateStatus(id: string, status: JobStatus, error?: string): Promise<void> {
    return jobManager.updateStatus(id, status, error);
  }

  async delete(id: string): Promise<void> {
    return jobManager.delete(id);
  }

  async findAll(): Promise<OptimizationJob[]> {
    return jobManager.findAll();
  }

  // Additional methods for monitoring
  getHealthStatus() {
    return jobManager.getHealthStatus();
  }

  getJobStats() {
    return jobManager.getJobStats();
  }

  async findByStatus(status: JobStatus): Promise<OptimizationJob[]> {
    return jobManager.findByStatus(status);
  }

  async findExpiredJobs(olderThan: Date): Promise<OptimizationJob[]> {
    return jobManager.findExpiredJobs(olderThan);
  }
}

export default jobManager;
