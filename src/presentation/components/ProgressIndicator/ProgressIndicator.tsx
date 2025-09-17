'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { JobProgress } from '@/application/dto/OptimizationResponse.dto';
import { JobStatus } from '@/domain/entities/OptimizationJob';

export interface ProgressIndicatorProps {
  progress: JobProgress;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
  showDetailedProgress?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface ProgressIndicatorState {
  isExpanded: boolean;
  estimatedTimeRemaining: number | null;
  lastUpdateTime: number;
  isRefreshing: boolean;
  refreshCount: number;
}

const INITIAL_STATE: ProgressIndicatorState = {
  isExpanded: false,
  estimatedTimeRemaining: null,
  lastUpdateTime: Date.now(),
  isRefreshing: false,
  refreshCount: 0,
};

export function ProgressIndicator({ 
  progress, 
  onCancel, 
  onRetry,
  className = '',
  showDetailedProgress = true,
  autoRefresh = true,
  refreshInterval = 2000
}: ProgressIndicatorProps) {
  const [state, setState] = useState<ProgressIndicatorState>(INITIAL_STATE);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const { status, progress: progressData, currentStep, error, metadata } = progress;
  const { total, completed, failed } = progressData;

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isActive = status === JobStatus.PROCESSING || status === JobStatus.SCRAPING;
  const isCompleted = status === JobStatus.COMPLETED;
  const isFailed = status === JobStatus.FAILED;
  const isCancelled = status === JobStatus.CANCELLED;

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED:
        return 'text-green-600 bg-green-100';
      case JobStatus.FAILED:
        return 'text-red-600 bg-red-100';
      case JobStatus.PROCESSING:
        return 'text-blue-600 bg-blue-100';
      case JobStatus.SCRAPING:
        return 'text-yellow-600 bg-yellow-100';
      case JobStatus.CANCELLED:
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED:
        return '✓';
      case JobStatus.FAILED:
        return '✗';
      case JobStatus.PROCESSING:
      case JobStatus.SCRAPING:
        return '⟳';
      case JobStatus.CANCELLED:
        return '⏹';
      default:
        return '○';
    }
  };

  const getStatusLabel = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PROCESSING:
        return 'Batch Processing Images';
      case JobStatus.SCRAPING:
        return 'Scraping Images';
      case JobStatus.COMPLETED:
        return 'Completed';
      case JobStatus.FAILED:
        return 'Failed';
      case JobStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  const calculateEstimatedTime = useCallback(() => {
    if (!isActive || completed === 0) return null;

    const elapsed = Date.now() - startTimeRef.current;
    const rate = completed / elapsed; // images per millisecond
    const remaining = total - completed;
    
    if (rate > 0) {
      return Math.round((remaining / rate) / 1000); // seconds
    }
    
    return null;
  }, [isActive, completed, total]);

  const formatTime = useCallback((seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }, []);

  const handleToggleExpanded = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  const handleRefresh = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isRefreshing: true, 
      refreshCount: prev.refreshCount + 1 
    }));
    
    // Simulate refresh delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }, 500);
  }, []);

  // Update estimated time remaining
  useEffect(() => {
    if (isActive) {
      const estimated = calculateEstimatedTime();
      setState(prev => ({ ...prev, estimatedTimeRemaining: estimated }));
    }
  }, [isActive, calculateEstimatedTime]);

  // Auto-refresh when active
  useEffect(() => {
    if (autoRefresh && isActive) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({ 
          ...prev, 
          lastUpdateTime: Date.now(),
          refreshCount: prev.refreshCount + 1
        }));
      }, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, isActive, refreshInterval]);

  const getProgressBarColor = () => {
    if (isFailed) return 'bg-red-500';
    if (isCompleted) return 'bg-green-500';
    if (isCancelled) return 'bg-gray-500';
    return 'bg-blue-500';
  };

  const getProgressBarAnimation = () => {
    if (isActive) return 'animate-pulse';
    return '';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`} role="region" aria-label="Processing progress">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Processing Status</h3>
            <span 
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
              aria-label={`Status: ${getStatusLabel(status)}`}
            >
              <span className="mr-2" aria-hidden="true">{getStatusIcon(status)}</span>
              {getStatusLabel(status)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={state.isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              aria-label="Refresh progress"
            >
              <svg 
                className={`w-4 h-4 ${state.isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Expand/Collapse button */}
            {showDetailedProgress && (
              <button
                onClick={handleToggleExpanded}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={state.isExpanded ? 'Collapse details' : 'Expand details'}
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${state.isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {/* Cancel button */}
            {isActive && onCancel && (
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                aria-label="Cancel processing"
              >
                Cancel
              </button>
            )}

            {/* Retry button */}
            {isFailed && onRetry && (
              <button
                onClick={handleRetry}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                aria-label="Retry processing"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Current Step */}
        {currentStep && (
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-medium">Current step:</span> {currentStep}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{completed} of {total} images</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${getProgressBarColor()} ${getProgressBarAnimation()}`}
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${percentage}% complete`}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>{percentage}% complete</span>
            {failed > 0 && (
              <span className="text-red-600">{failed} failed</span>
            )}
            {state.estimatedTimeRemaining && (
              <span className="text-blue-600">
                ~{formatTime(state.estimatedTimeRemaining)} remaining
              </span>
            )}
          </div>
        </div>

        {/* Detailed Progress */}
        {showDetailedProgress && state.isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{completed}</div>
                <div className="text-xs text-blue-600">Completed</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-600">{total - completed - failed}</div>
                <div className="text-xs text-yellow-600">Processing</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">{failed}</div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
            </div>

            {metadata && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>Created: {new Date(metadata.createdAt).toLocaleString()}</div>
                <div>Updated: {new Date(metadata.updatedAt).toLocaleString()}</div>
                {metadata.completedAt && (
                  <div>Completed: {new Date(metadata.completedAt).toLocaleString()}</div>
                )}
              </div>
            )}

            <div className="text-xs text-gray-400">
              Last updated: {new Date(state.lastUpdateTime).toLocaleTimeString()}
              {state.refreshCount > 0 && ` (${state.refreshCount} refreshes)`}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 p-4" role="alert">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Processing Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isCompleted && (
        <div className="bg-green-50 border-t border-green-200 p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-800">Batch Processing Complete!</h4>
              <p className="text-sm text-green-700">
                All {completed} images have been successfully processed and optimized using batch API (50% cost savings).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
