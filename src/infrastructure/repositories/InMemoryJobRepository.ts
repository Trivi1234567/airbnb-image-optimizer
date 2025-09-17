import { IJobRepository } from '@/domain/repositories/IJobRepository';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';
import { logger } from '../config/logger';

export class InMemoryJobRepository implements IJobRepository {
  private jobs: Map<string, OptimizationJob> = new Map();

  async create(job: OptimizationJob): Promise<OptimizationJob> {
    this.jobs.set(job.id, { ...job });
    console.log('✅ Job created:', { 
      jobId: job.id, 
      status: job.status, 
      totalJobs: this.jobs.size,
      availableJobs: Array.from(this.jobs.keys())
    });
    logger.debug('Job created', { jobId: job.id, status: job.status, totalJobs: this.jobs.size });
    return job;
  }

  async findById(id: string): Promise<OptimizationJob | null> {
    const job = this.jobs.get(id);
    console.log('🔍 Job lookup:', { 
      requestedId: id, 
      found: !!job, 
      totalJobs: this.jobs.size, 
      availableJobs: Array.from(this.jobs.keys()) 
    });
    logger.debug('Job retrieved', { jobId: id, found: !!job, totalJobs: this.jobs.size, availableJobs: Array.from(this.jobs.keys()) });
    if (!job) {
      console.error('❌ Job not found in repository:', { 
        requestedId: id, 
        totalJobs: this.jobs.size, 
        availableJobs: Array.from(this.jobs.keys()) 
      });
      logger.warn('Job not found in repository', { jobId: id, totalJobs: this.jobs.size, availableJobs: Array.from(this.jobs.keys()) });
    }
    return job ? { ...job } : null;
  }

  async update(job: OptimizationJob): Promise<OptimizationJob> {
    this.jobs.set(job.id, { ...job });
    logger.debug('Job updated', { jobId: job.id, status: job.status });
    return job;
  }

  async updateStatus(id: string, status: JobStatus, error?: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Job not found: ${id}`);
    }

    const updatedJob: OptimizationJob = {
      ...job,
      status,
      ...(error && { error }),
      updatedAt: new Date(),
      ...(status === JobStatus.COMPLETED || status === JobStatus.FAILED ? { completedAt: new Date() } : {})
    };

    this.jobs.set(id, updatedJob);
    logger.debug('Job status updated', { jobId: id, status, error });
  }

  async delete(id: string): Promise<void> {
    const deleted = this.jobs.delete(id);
    logger.debug('Job deleted', { jobId: id, deleted });
  }

  async findByStatus(status: JobStatus): Promise<OptimizationJob[]> {
    const jobs = Array.from(this.jobs.values()).filter(job => job.status === status);
    logger.debug('Jobs found by status', { status, count: jobs.length });
    return jobs.map(job => ({ ...job }));
  }

  async findExpiredJobs(olderThan: Date): Promise<OptimizationJob[]> {
    const jobs = Array.from(this.jobs.values()).filter(job => 
      job.createdAt < olderThan && 
      (job.status === JobStatus.PENDING || job.status === JobStatus.PROCESSING)
    );
    logger.debug('Expired jobs found', { count: jobs.length, olderThan });
    return jobs.map(job => ({ ...job }));
  }
}
