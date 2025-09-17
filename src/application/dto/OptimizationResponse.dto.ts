import { z } from 'zod';
import { JobStatus } from '@/domain/entities/OptimizationJob';
import { RoomType } from '@/domain/entities/RoomType';

export const ImageResponseSchema = z.object({
  id: z.string(),
  originalUrl: z.string(),
  originalBase64: z.string().optional(),
  optimizedBase64: z.string().optional(),
  fileName: z.string(),
  roomType: z.nativeEnum(RoomType),
  processingStatus: z.enum(['pending', 'analyzing', 'optimizing', 'completed', 'failed']),
  error: z.string().optional()
});

export const ImagePairResponseSchema = z.object({
  original: ImageResponseSchema,
  optimized: ImageResponseSchema.optional(),
  roomType: z.nativeEnum(RoomType),
  fileName: z.string(),
  optimizationComment: z.string().optional()
});

export const JobProgressSchema = z.object({
  jobId: z.string(),
  status: z.nativeEnum(JobStatus),
  progress: z.object({
    total: z.number(),
    completed: z.number(),
    failed: z.number()
  }),
  currentStep: z.string().optional(),
  error: z.string().optional(),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string().optional(),
    totalImages: z.number(),
    completedImages: z.number(),
    failedImages: z.number()
  }).optional()
});

export const OptimizationResponseSchema = z.object({
  success: z.boolean(),
  jobId: z.string(),
  message: z.string(),
  data: z.object({
    job: z.object({
      id: z.string(),
      airbnbUrl: z.string(),
      status: z.nativeEnum(JobStatus),
      progress: z.object({
        total: z.number(),
        completed: z.number(),
        failed: z.number()
      }),
      createdAt: z.string(),
      updatedAt: z.string()
    }),
    images: z.array(ImageResponseSchema),
    imagePairs: z.array(ImagePairResponseSchema)
  }).optional()
});

export type ImageResponse = z.infer<typeof ImageResponseSchema>;
export type ImagePairResponse = z.infer<typeof ImagePairResponseSchema>;
export type JobProgress = z.infer<typeof JobProgressSchema>;
export type OptimizationResponse = z.infer<typeof OptimizationResponseSchema>;

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
