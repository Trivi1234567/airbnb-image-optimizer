import { useState, useCallback, useRef } from 'react';
import { OptimizationRequest } from '@/application/dto/OptimizationRequest.dto';
import { OptimizationResponse, JobProgress } from '@/application/dto/OptimizationResponse.dto';

interface UseOptimizationJobReturn {
  job: OptimizationResponse['data'] | null;
  progress: JobProgress | null;
  isLoading: boolean;
  error: string | null;
  startJob: (request: OptimizationRequest) => Promise<void>;
  refreshProgress: () => Promise<void>;
  clearState: () => void;
}

export function useOptimizationJob(): UseOptimizationJobReturn {
  const [job, setJob] = useState<OptimizationResponse['data'] | null>(null);
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  const startJob = useCallback(async (request: OptimizationRequest) => {
    // Prevent multiple simultaneous requests
    if (isLoading || currentJobIdRef.current) {
      console.log('Preventing multiple simultaneous requests');
      return;
    }

    setIsLoading(true);
    setError(null);
    setJob(null);
    setProgress(null);
    currentJobIdRef.current = null;

    try {
      const response = await fetch('/api/v1/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Failed to start optimization job';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('API Error:', { status: response.status, statusText: response.statusText });
        throw new Error(errorMessage);
      }

      // Parse JSON only if response is ok
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
        throw new Error('Invalid response from server. Please try again.');
      }

      console.log('Job created successfully:', { 
        jobId: data.jobId, 
        jobData: data.data 
      });

      // Store the job ID to prevent multiple requests
      currentJobIdRef.current = data.jobId;

      setJob(data.data);
      setProgress({
        jobId: data.jobId,
        status: data.data.job.status,
        progress: data.data.job.progress,
        currentStep: 'Job started'
      });

      // Start polling for progress after a short delay to ensure job is created
      setTimeout(async () => {
        console.log('Starting to poll job:', data.jobId);
        await pollProgress(data.jobId);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollProgress = useCallback(async (jobId: string) => {
    console.log('Setting up polling for job:', jobId);
    
    const poll = async () => {
      try {
        console.log('Polling job status:', jobId);
        const response = await fetch(`/api/v1/job/${jobId}`);
        
        if (!response.ok) {
          console.error('Polling failed:', { status: response.status, statusText: response.statusText });
          throw new Error(`Failed to check job status: ${response.statusText}`);
        }
        
        let data;
        try {
          data = await response.json();
        } catch (error) {
          console.error('Failed to parse polling response:', error);
          throw new Error('Invalid response from server during polling');
        }

        console.log('Polling response:', { 
          jobId, 
          status: response.status, 
          success: data.success, 
          jobStatus: data.data?.status 
        });

        if (response.ok && data.success) {
          console.log('Job status received:', { jobId, status: data.data.status });
          
          // Always update progress with the latest data
          setProgress(data.data);
          
          // Update job data for in-progress jobs to show current state
          if (data.data.status !== 'completed' && data.data.status !== 'failed') {
            setJob(prevJob => {
              if (!prevJob) {
                return {
                  job: data.data.job,
                  images: data.data.images || [],
                  imagePairs: data.data.imagePairs || []
                };
              }
              return {
                ...prevJob,
                job: {
                  ...prevJob.job,
                  status: data.data.status,
                  progress: data.data.progress
                },
                images: data.data.images || prevJob.images,
                imagePairs: data.data.imagePairs || prevJob.imagePairs
              };
            });
          }
          
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            // Clear the job ID ref when completed
            currentJobIdRef.current = null;
            // Update progress with final status
            setProgress(data.data);
            // Refresh the full job data when completed
            await refreshJobData(jobId);
            return;
          }
        } else if (response.status === 500 && data.error?.code === 'JOB_NOT_FOUND') {
          // Job not found - stop polling and show error
          console.error('Job not found, stopping polling:', jobId);
          console.error('Response details:', { status: response.status, data });
          currentJobIdRef.current = null;
          setError('Job not found. Please try again.');
          setIsLoading(false);
          return;
        } else {
          console.error('Polling error:', { jobId, status: response.status, data });
        }
      } catch (err) {
        console.error('Failed to poll job progress:', err);
        // If we get multiple errors, stop polling
        currentJobIdRef.current = null;
        setError('Failed to check job status. Please try again.');
        setIsLoading(false);
      }
    };

    // Poll every 5 seconds to avoid rate limiting
    const interval = setInterval(poll, 5000);
    
    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 300000);

    // Store interval and timeout for cleanup
    const cleanup = () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };

    // Initial poll
    await poll();

    // Return cleanup function
    return cleanup;
  }, []);

  const refreshJobData = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/v1/job/${jobId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        // Always update progress with the latest data
        setProgress(data.data);
        
        // If the job is completed, the API now returns full job data including imagePairs
        if (data.data.status === 'completed' && data.data.job && data.data.imagePairs) {
          setJob({
            job: data.data.job,
            images: data.data.images || [],
            imagePairs: data.data.imagePairs || []
          });
        } else {
          // For in-progress jobs, update the job with current data
          setJob(prevJob => {
            if (!prevJob) {
              // If no previous job, create a new one with the current data
              return {
                job: data.data.job,
                images: data.data.images || [],
                imagePairs: data.data.imagePairs || []
              };
            }
            return {
              ...prevJob,
              job: {
                ...prevJob.job,
                status: data.data.status,
                progress: data.data.progress
              },
              images: data.data.images || prevJob.images,
              imagePairs: data.data.imagePairs || prevJob.imagePairs
            };
          });
        }
      }
    } catch (err) {
      console.error('Failed to refresh job data:', err);
    }
  }, []);

  const refreshProgress = useCallback(async () => {
    if (progress?.jobId) {
      await refreshJobData(progress.jobId);
    }
  }, [progress?.jobId, refreshJobData]);

  const clearState = useCallback(() => {
    setJob(null);
    setProgress(null);
    setError(null);
    setIsLoading(false);
    currentJobIdRef.current = null;
  }, []);

  return {
    job,
    progress,
    isLoading,
    error,
    startJob,
    refreshProgress,
    clearState,
  };
}
