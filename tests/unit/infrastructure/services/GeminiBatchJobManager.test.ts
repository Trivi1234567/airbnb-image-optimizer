import { GeminiBatchJobManager } from '@/infrastructure/services/GeminiBatchJobManager';

// Mock the GoogleGenerativeAI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    batches: {
      create: jest.fn(),
      get: jest.fn(),
      cancel: jest.fn(),
      delete: jest.fn()
    },
    files: {
      upload: jest.fn(),
      download: jest.fn()
    }
  }))
}));

// Mock the logger
jest.mock('@/infrastructure/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('GeminiBatchJobManager', () => {
  let service: GeminiBatchJobManager;
  let mockGenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeminiBatchJobManager();
    
    // Get the mocked instance
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    mockGenAI = new GoogleGenerativeAI();
  });

  describe('createBatchJob', () => {
    it('should create a batch job with inline requests for small batches', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      const mockBatchJob = {
        name: 'batches/123456789'
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);

      const jobId = await service.createBatchJob('room_detection', requests);

      expect(jobId).toMatch(/^batch_room_detection_\d+_[a-z0-9]+$/);
      expect(mockGenAI.batches.create).toHaveBeenCalledWith({
        model: 'models/gemini-2.5-flash',
        src: expect.any(Array),
        config: {
          displayName: expect.stringContaining('room-detection-batch')
        }
      });
    });

    it('should create a batch job with file upload for large batches', async () => {
      const requests = Array.from({ length: 150 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      const mockFile = {
        name: 'uploaded-file-123'
      };

      const mockBatchJob = {
        name: 'batches/123456789'
      };

      mockGenAI.files.upload = jest.fn().mockResolvedValue(mockFile);
      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);

      const jobId = await service.createBatchJob('image_optimization', requests);

      expect(jobId).toMatch(/^batch_image_optimization_\d+_[a-z0-9]+$/);
      expect(mockGenAI.files.upload).toHaveBeenCalled();
      expect(mockGenAI.batches.create).toHaveBeenCalledWith({
        model: 'models/gemini-2.5-flash-image-preview',
        src: 'uploaded-file-123',
        config: {
          displayName: expect.stringContaining('image-optimization-batch')
        }
      });
    });

    it('should handle batch job creation errors', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      mockGenAI.batches.create = jest.fn().mockRejectedValue(new Error('Batch creation failed'));

      await expect(service.createBatchJob('room_detection', requests))
        .rejects.toThrow('Failed to create batch job: Batch creation failed');
    });
  });

  describe('getBatchJobStatus', () => {
    it('should return job status for existing job', async () => {
      const jobId = 'batch_room_detection_123_abc';
      
      // Create a job first
      const requests = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      const mockBatchJob = {
        name: 'batches/123456789'
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      await service.createBatchJob('room_detection', requests);

      const status = await service.getBatchJobStatus(jobId);

      expect(status).toMatchObject({
        id: jobId,
        type: 'room_detection',
        status: 'running',
        createdAt: expect.any(Date)
      });
    });

    it('should throw error for non-existent job', async () => {
      await expect(service.getBatchJobStatus('non-existent-job'))
        .rejects.toThrow('Batch job not found: non-existent-job');
    });
  });

  describe('getBatchJobResults', () => {
    it('should return results for completed job', async () => {
      const jobId = 'batch_room_detection_123_abc';
      
      // Create and complete a job
      const requests = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      const mockBatchJob = {
        name: 'batches/123456789'
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      await service.createBatchJob('room_detection', requests);

      // Mock completed job
      const completedJob = {
        id: jobId,
        type: 'room_detection' as const,
        status: 'completed' as const,
        createdAt: new Date(),
        completedAt: new Date(),
        resultCount: 5,
        failedCount: 0
      };

      // Manually set the job status to completed
      (service as any).batchJobs.set(jobId, completedJob);

      const results = await service.getBatchJobResults(jobId);

      expect(results).toEqual([]);
    });

    it('should throw error for non-completed job', async () => {
      const jobId = 'batch_room_detection_123_abc';
      
      // Create a job
      const requests = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      const mockBatchJob = {
        name: 'batches/123456789'
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      await service.createBatchJob('room_detection', requests);

      await expect(service.getBatchJobResults(jobId))
        .rejects.toThrow('Batch job not completed: running');
    });
  });

  describe('cancelBatchJob', () => {
    it('should cancel a running job', async () => {
      const jobId = 'batch_room_detection_123_abc';
      
      // Create a job
      const requests = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      const mockBatchJob = {
        name: 'batches/123456789'
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      await service.createBatchJob('room_detection', requests);

      const result = await service.cancelBatchJob(jobId);

      expect(result).toBe(true);
      
      const status = await service.getBatchJobStatus(jobId);
      expect(status.status).toBe('cancelled');
    });

    it('should return false for non-existent job', async () => {
      const result = await service.cancelBatchJob('non-existent-job');
      expect(result).toBe(false);
    });

    it('should return false for completed job', async () => {
      const jobId = 'batch_room_detection_123_abc';
      
      // Create a completed job
      const completedJob = {
        id: jobId,
        type: 'room_detection' as const,
        status: 'completed' as const,
        createdAt: new Date(),
        completedAt: new Date()
      };

      (service as any).batchJobs.set(jobId, completedJob);

      const result = await service.cancelBatchJob(jobId);
      expect(result).toBe(false);
    });
  });

  describe('deleteBatchJob', () => {
    it('should delete an existing job', async () => {
      const jobId = 'batch_room_detection_123_abc';
      
      // Create a job
      const requests = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      const mockBatchJob = {
        name: 'batches/123456789'
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      await service.createBatchJob('room_detection', requests);

      const result = await service.deleteBatchJob(jobId);

      expect(result).toBe(true);
      
      await expect(service.getBatchJobStatus(jobId))
        .rejects.toThrow('Batch job not found: batch_room_detection_123_abc');
    });

    it('should return false for non-existent job', async () => {
      const result = await service.deleteBatchJob('non-existent-job');
      expect(result).toBe(false);
    });
  });

  describe('pollBatchJobStatus', () => {
    it('should handle job completion', async () => {
      const jobId = 'batch_room_detection_123_abc';
      const geminiJobName = 'batches/123456789';
      
      // Create a job
      const requests = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      const mockBatchJob = {
        name: geminiJobName
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      await service.createBatchJob('room_detection', requests);

      // Mock job completion
      const completedJob = {
        name: geminiJobName,
        state: { name: 'JOB_STATE_SUCCEEDED' },
        dest: {
          inlined_responses: [
            { response: { text: '{"lighting": {"quality": "good"}}' } }
          ]
        }
      };

      mockGenAI.batches.get = jest.fn().mockResolvedValue(completedJob);

      // Wait for polling to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = await service.getBatchJobStatus(jobId);
      expect(status.status).toBe('completed');
    });

    it('should handle job failure', async () => {
      const jobId = 'batch_room_detection_123_abc';
      const geminiJobName = 'batches/123456789';
      
      // Create a job
      const requests = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      const mockBatchJob = {
        name: geminiJobName
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      await service.createBatchJob('room_detection', requests);

      // Mock job failure
      const failedJob = {
        name: geminiJobName,
        state: { name: 'JOB_STATE_FAILED' },
        error: { message: 'Batch processing failed' }
      };

      mockGenAI.batches.get = jest.fn().mockResolvedValue(failedJob);

      // Wait for polling to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = await service.getBatchJobStatus(jobId);
      expect(status.status).toBe('failed');
      expect(status.error).toBe('Batch processing failed');
    });
  });
});
