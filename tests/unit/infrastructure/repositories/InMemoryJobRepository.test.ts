import { InMemoryJobRepository } from '@/infrastructure/repositories/InMemoryJobRepository';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';
import { RoomType } from '@/domain/entities/RoomType';

describe('InMemoryJobRepository', () => {
  let repository: InMemoryJobRepository;
  let mockJob: OptimizationJob;

  beforeEach(() => {
    repository = new InMemoryJobRepository();
    
    mockJob = {
      id: 'test-job-123',
      airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
      status: JobStatus.PENDING,
      images: [],
      imagePairs: [],
      progress: {
        total: 0,
        completed: 0,
        failed: 0
      },
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };
  });

  describe('create', () => {
    it('should create a new job successfully', async () => {
      const result = await repository.create(mockJob);

      expect(result).toEqual(mockJob);
      expect(result.id).toBe('test-job-123');
      expect(result.status).toBe(JobStatus.PENDING);
    });

    it('should store job in memory', async () => {
      await repository.create(mockJob);

      const retrieved = await repository.findById('test-job-123');
      expect(retrieved).toEqual(mockJob);
    });

    it('should handle multiple job creations', async () => {
      const job1 = { ...mockJob, id: 'job-1' };
      const job2 = { ...mockJob, id: 'job-2' };

      await repository.create(job1);
      await repository.create(job2);

      const retrieved1 = await repository.findById('job-1');
      const retrieved2 = await repository.findById('job-2');

      expect(retrieved1).toEqual(job1);
      expect(retrieved2).toEqual(job2);
    });
  });

  describe('findById', () => {
    it('should return job when found', async () => {
      await repository.create(mockJob);

      const result = await repository.findById('test-job-123');

      expect(result).toEqual(mockJob);
    });

    it('should return null when job not found', async () => {
      const result = await repository.findById('non-existent-job');

      expect(result).toBeNull();
    });

    it('should return a copy of the job to prevent mutation', async () => {
      await repository.create(mockJob);

      const result = await repository.findById('test-job-123');
      
      if (result) {
        result.status = JobStatus.COMPLETED;
        
        const retrievedAgain = await repository.findById('test-job-123');
        expect(retrievedAgain?.status).toBe(JobStatus.PENDING);
      }
    });
  });

  describe('update', () => {
    it('should update existing job successfully', async () => {
      await repository.create(mockJob);

      const updatedJob = {
        ...mockJob,
        status: JobStatus.PROCESSING,
        progress: { total: 5, completed: 2, failed: 0 }
      };

      const result = await repository.update(updatedJob);

      expect(result).toEqual(updatedJob);
      expect(result.status).toBe(JobStatus.PROCESSING);
    });

    it('should store updated job in memory', async () => {
      await repository.create(mockJob);

      const updatedJob = {
        ...mockJob,
        status: JobStatus.COMPLETED
      };

      await repository.update(updatedJob);

      const retrieved = await repository.findById('test-job-123');
      expect(retrieved?.status).toBe(JobStatus.COMPLETED);
    });

    it('should return a copy of the updated job', async () => {
      await repository.create(mockJob);

      const updatedJob = {
        ...mockJob,
        status: JobStatus.PROCESSING
      };

      const result = await repository.update(updatedJob);
      
      result.status = JobStatus.FAILED;
      
      const retrieved = await repository.findById('test-job-123');
      expect(retrieved?.status).toBe(JobStatus.PROCESSING);
    });
  });

  describe('updateStatus', () => {
    it('should update job status successfully', async () => {
      await repository.create(mockJob);

      await repository.updateStatus('test-job-123', JobStatus.PROCESSING);

      const retrieved = await repository.findById('test-job-123');
      expect(retrieved?.status).toBe(JobStatus.PROCESSING);
    });

    it('should update job status with error message', async () => {
      await repository.create(mockJob);

      await repository.updateStatus('test-job-123', JobStatus.FAILED, 'Processing failed');

      const retrieved = await repository.findById('test-job-123');
      expect(retrieved?.status).toBe(JobStatus.FAILED);
      expect(retrieved?.error).toBe('Processing failed');
    });

    it('should update updatedAt timestamp', async () => {
      const originalDate = new Date('2024-01-01T00:00:00Z');
      const job = { ...mockJob, updatedAt: originalDate };
      await repository.create(job);

      await repository.updateStatus('test-job-123', JobStatus.PROCESSING);

      const retrieved = await repository.findById('test-job-123');
      expect(retrieved?.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('should set completedAt for completed status', async () => {
      await repository.create(mockJob);

      await repository.updateStatus('test-job-123', JobStatus.COMPLETED);

      const retrieved = await repository.findById('test-job-123');
      expect(retrieved?.completedAt).toBeDefined();
      expect(retrieved?.completedAt).toBeInstanceOf(Date);
    });

    it('should set completedAt for failed status', async () => {
      await repository.create(mockJob);

      await repository.updateStatus('test-job-123', JobStatus.FAILED);

      const retrieved = await repository.findById('test-job-123');
      expect(retrieved?.completedAt).toBeDefined();
      expect(retrieved?.completedAt).toBeInstanceOf(Date);
    });

    it('should not set completedAt for other statuses', async () => {
      await repository.create(mockJob);

      await repository.updateStatus('test-job-123', JobStatus.PROCESSING);

      const retrieved = await repository.findById('test-job-123');
      expect(retrieved?.completedAt).toBeUndefined();
    });

    it('should throw error when job not found', async () => {
      await expect(repository.updateStatus('non-existent-job', JobStatus.PROCESSING))
        .rejects
        .toThrow('Job not found: non-existent-job');
    });
  });

  describe('delete', () => {
    it('should delete existing job successfully', async () => {
      await repository.create(mockJob);

      await repository.delete('test-job-123');

      const retrieved = await repository.findById('test-job-123');
      expect(retrieved).toBeNull();
    });

    it('should handle deletion of non-existent job gracefully', async () => {
      await expect(repository.delete('non-existent-job')).resolves.not.toThrow();
    });
  });

  describe('findByStatus', () => {
    it('should return jobs with matching status', async () => {
      const pendingJob = { ...mockJob, id: 'pending-job', status: JobStatus.PENDING };
      const processingJob = { ...mockJob, id: 'processing-job', status: JobStatus.PROCESSING };
      const completedJob = { ...mockJob, id: 'completed-job', status: JobStatus.COMPLETED };

      await repository.create(pendingJob);
      await repository.create(processingJob);
      await repository.create(completedJob);

      const pendingJobs = await repository.findByStatus(JobStatus.PENDING);
      const processingJobs = await repository.findByStatus(JobStatus.PROCESSING);
      const completedJobs = await repository.findByStatus(JobStatus.COMPLETED);

      expect(pendingJobs).toHaveLength(1);
      expect(pendingJobs[0].id).toBe('pending-job');

      expect(processingJobs).toHaveLength(1);
      expect(processingJobs[0].id).toBe('processing-job');

      expect(completedJobs).toHaveLength(1);
      expect(completedJobs[0].id).toBe('completed-job');
    });

    it('should return empty array when no jobs match status', async () => {
      const result = await repository.findByStatus(JobStatus.PENDING);
      expect(result).toEqual([]);
    });

    it('should return copies of jobs to prevent mutation', async () => {
      const job = { ...mockJob, status: JobStatus.PENDING };
      await repository.create(job);

      const jobs = await repository.findByStatus(JobStatus.PENDING);
      
      if (jobs.length > 0) {
        jobs[0].status = JobStatus.COMPLETED;
        
        const retrievedAgain = await repository.findByStatus(JobStatus.PENDING);
        expect(retrievedAgain[0].status).toBe(JobStatus.PENDING);
      }
    });
  });

  describe('findExpiredJobs', () => {
    it('should return jobs older than specified date', async () => {
      const oldDate = new Date('2024-01-01T00:00:00Z');
      const recentDate = new Date('2024-01-02T00:00:00Z');
      const cutoffDate = new Date('2024-01-01T12:00:00Z');

      const oldJob = { ...mockJob, id: 'old-job', createdAt: oldDate, status: JobStatus.PENDING };
      const recentJob = { ...mockJob, id: 'recent-job', createdAt: recentDate, status: JobStatus.PENDING };

      await repository.create(oldJob);
      await repository.create(recentJob);

      const expiredJobs = await repository.findExpiredJobs(cutoffDate);

      expect(expiredJobs).toHaveLength(1);
      expect(expiredJobs[0].id).toBe('old-job');
    });

    it('should only return pending or processing jobs', async () => {
      const oldDate = new Date('2024-01-01T00:00:00Z');
      const cutoffDate = new Date('2024-01-01T12:00:00Z');

      const pendingJob = { ...mockJob, id: 'pending-job', createdAt: oldDate, status: JobStatus.PENDING };
      const processingJob = { ...mockJob, id: 'processing-job', createdAt: oldDate, status: JobStatus.PROCESSING };
      const completedJob = { ...mockJob, id: 'completed-job', createdAt: oldDate, status: JobStatus.COMPLETED };

      await repository.create(pendingJob);
      await repository.create(processingJob);
      await repository.create(completedJob);

      const expiredJobs = await repository.findExpiredJobs(cutoffDate);

      expect(expiredJobs).toHaveLength(2);
      expect(expiredJobs.map(job => job.id)).toContain('pending-job');
      expect(expiredJobs.map(job => job.id)).toContain('processing-job');
      expect(expiredJobs.map(job => job.id)).not.toContain('completed-job');
    });

    it('should return empty array when no expired jobs found', async () => {
      const recentDate = new Date('2024-01-02T00:00:00Z');
      const cutoffDate = new Date('2024-01-01T12:00:00Z');

      const recentJob = { ...mockJob, id: 'recent-job', createdAt: recentDate, status: JobStatus.PENDING };
      await repository.create(recentJob);

      const expiredJobs = await repository.findExpiredJobs(cutoffDate);
      expect(expiredJobs).toEqual([]);
    });

    it('should return copies of jobs to prevent mutation', async () => {
      const oldDate = new Date('2024-01-01T00:00:00Z');
      const cutoffDate = new Date('2024-01-01T12:00:00Z');

      const oldJob = { ...mockJob, id: 'old-job', createdAt: oldDate, status: JobStatus.PENDING };
      await repository.create(oldJob);

      const expiredJobs = await repository.findExpiredJobs(cutoffDate);
      
      if (expiredJobs.length > 0) {
        expiredJobs[0].status = JobStatus.COMPLETED;
        
        const retrievedAgain = await repository.findExpiredJobs(cutoffDate);
        expect(retrievedAgain[0].status).toBe(JobStatus.PENDING);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle concurrent operations', async () => {
      const job1 = { ...mockJob, id: 'job-1' };
      const job2 = { ...mockJob, id: 'job-2' };

      // Simulate concurrent operations
      const operations = [
        repository.create(job1),
        repository.create(job2),
        repository.findById('job-1'),
        repository.findById('job-2')
      ];

      const results = await Promise.all(operations);

      expect(results[0]).toEqual(job1);
      expect(results[1]).toEqual(job2);
      expect(results[2]).toEqual(job1);
      expect(results[3]).toEqual(job2);
    });

    it('should handle large number of jobs', async () => {
      const jobs = Array.from({ length: 1000 }, (_, i) => ({
        ...mockJob,
        id: `job-${i}`,
        status: i % 2 === 0 ? JobStatus.PENDING : JobStatus.COMPLETED
      }));

      // Create all jobs
      await Promise.all(jobs.map(job => repository.create(job)));

      // Find pending jobs
      const pendingJobs = await repository.findByStatus(JobStatus.PENDING);
      expect(pendingJobs).toHaveLength(500);

      // Find completed jobs
      const completedJobs = await repository.findByStatus(JobStatus.COMPLETED);
      expect(completedJobs).toHaveLength(500);
    });

    it('should handle jobs with complex data structures', async () => {
      const complexJob = {
        ...mockJob,
        images: [
          {
            id: 'img-1',
            originalUrl: 'https://example.com/img1.jpg',
            fileName: 'image1.jpg',
            processingStatus: 'completed' as const,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        imagePairs: [
          {
            original: {
              id: 'img-1',
              originalUrl: 'https://example.com/img1.jpg',
              fileName: 'image1.jpg',
              processingStatus: 'completed' as const,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            optimized: {
              id: 'img-1-opt',
              originalUrl: 'https://example.com/img1.jpg',
              optimizedBase64: 'base64-data',
              fileName: 'bedroom_1.jpg',
              processingStatus: 'completed' as const,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            roomType: RoomType.BEDROOM,
            fileName: 'bedroom_1.jpg'
          }
        ]
      };

      await repository.create(complexJob);
      const retrieved = await repository.findById('test-job-123');

      expect(retrieved).toEqual(complexJob);
      expect(retrieved?.images).toHaveLength(1);
      expect(retrieved?.imagePairs).toHaveLength(1);
    });
  });
});
