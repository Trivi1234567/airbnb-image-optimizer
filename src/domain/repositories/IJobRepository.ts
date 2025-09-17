import { OptimizationJob, JobStatus } from '../entities/OptimizationJob';

export interface IJobRepository {
  create(job: OptimizationJob): Promise<OptimizationJob>;
  findById(id: string): Promise<OptimizationJob | null>;
  update(job: OptimizationJob): Promise<OptimizationJob>;
  updateStatus(id: string, status: JobStatus, error?: string): Promise<void>;
  delete(id: string): Promise<void>;
  findByStatus(status: JobStatus): Promise<OptimizationJob[]>;
  findExpiredJobs(olderThan: Date): Promise<OptimizationJob[]>;
}
