import { z } from 'zod';

export const OptimizationRequestSchema = z.object({
  airbnbUrl: z.string().url('Invalid URL format').refine(
    (url) => url.includes('airbnb.com') || url.includes('airbnb.co.uk'),
    'Must be a valid Airbnb URL'
  ),
  maxImages: z.number().int().min(1).max(10).optional().default(10)
});

export type OptimizationRequest = z.infer<typeof OptimizationRequestSchema>;

export const JobStatusRequestSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format')
});

export type JobStatusRequest = z.infer<typeof JobStatusRequestSchema>;
