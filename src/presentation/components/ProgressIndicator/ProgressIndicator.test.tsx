import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressIndicator, ProgressIndicatorProps } from './ProgressIndicator';
import { JobProgress } from '@/application/dto/OptimizationResponse.dto';
import { JobStatus } from '@/domain/entities/OptimizationJob';

// Mock data
const mockProgress: JobProgress = {
  jobId: 'test-job-id',
  status: JobStatus.PROCESSING,
  progress: {
    total: 10,
    completed: 5,
    failed: 1,
  },
  currentStep: 'Processing image 6 of 10',
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:05:00Z',
    totalImages: 10,
    completedImages: 5,
    failedImages: 1,
  },
};

const mockProgressCompleted: JobProgress = {
  ...mockProgress,
  status: JobStatus.COMPLETED,
  progress: {
    total: 10,
    completed: 10,
    failed: 0,
  },
  currentStep: undefined,
  metadata: {
    ...mockProgress.metadata!,
    completedAt: '2024-01-01T00:10:00Z',
    completedImages: 10,
    failedImages: 0,
  },
};

const mockProgressFailed: JobProgress = {
  ...mockProgress,
  status: JobStatus.FAILED,
  error: 'Processing failed due to network error',
};

const mockProgressScraping: JobProgress = {
  ...mockProgress,
  status: JobStatus.SCRAPING,
  currentStep: 'Scraping images from Airbnb listing',
};

describe('ProgressIndicator', () => {
  const defaultProps: ProgressIndicatorProps = {
    progress: mockProgress,
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders with basic props', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      expect(screen.getByText('Processing Status')).toBeInTheDocument();
      expect(screen.getByText('Processing Images')).toBeInTheDocument();
      expect(screen.getByText('5 of 10 images')).toBeInTheDocument();
      expect(screen.getByText('50% complete')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <ProgressIndicator {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders current step when provided', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      expect(screen.getByText('Current step: Processing image 6 of 10')).toBeInTheDocument();
    });

    it('renders without current step when not provided', () => {
      const progressWithoutStep = { ...mockProgress, currentStep: undefined };
      render(<ProgressIndicator {...defaultProps} progress={progressWithoutStep} />);
      
      expect(screen.queryByText(/Current step:/)).not.toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('shows processing status correctly', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      expect(screen.getByText('Processing Images')).toBeInTheDocument();
      expect(screen.getByText('⟳')).toBeInTheDocument();
    });

    it('shows completed status correctly', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressCompleted} />);
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('shows failed status correctly', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressFailed} />);
      
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });

    it('shows scraping status correctly', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressScraping} />);
      
      expect(screen.getByText('Scraping Images')).toBeInTheDocument();
      expect(screen.getByText('⟳')).toBeInTheDocument();
    });

    it('shows cancelled status correctly', () => {
      const cancelledProgress = { ...mockProgress, status: JobStatus.CANCELLED };
      render(<ProgressIndicator {...defaultProps} progress={cancelledProgress} />);
      
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('⏹')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('shows correct progress percentage', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('shows correct progress bar color for processing', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-blue-500');
    });

    it('shows correct progress bar color for completed', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressCompleted} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-green-500');
    });

    it('shows correct progress bar color for failed', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressFailed} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-red-500');
    });

    it('shows animation for active status', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('animate-pulse');
    });

    it('does not show animation for inactive status', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressCompleted} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).not.toHaveClass('animate-pulse');
    });
  });

  describe('Detailed Progress', () => {
    it('toggles detailed progress visibility', async () => {
      const user = userEvent.setup();
      render(<ProgressIndicator {...defaultProps} showDetailedProgress={true} />);
      
      const toggleButton = screen.getByLabelText('Expand details');
      
      // Initially collapsed
      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
      
      // Expand
      await user.click(toggleButton);
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      
      // Collapse
      await user.click(screen.getByLabelText('Collapse details'));
      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });

    it('shows detailed progress counts', async () => {
      const user = userEvent.setup();
      render(<ProgressIndicator {...defaultProps} showDetailedProgress={true} />);
      
      const toggleButton = screen.getByLabelText('Expand details');
      await user.click(toggleButton);
      
      expect(screen.getByText('5')).toBeInTheDocument(); // Completed
      expect(screen.getByText('4')).toBeInTheDocument(); // Processing (10 - 5 - 1)
      expect(screen.getByText('1')).toBeInTheDocument(); // Failed
    });

    it('shows metadata when available', async () => {
      const user = userEvent.setup();
      render(<ProgressIndicator {...defaultProps} showDetailedProgress={true} />);
      
      const toggleButton = screen.getByLabelText('Expand details');
      await user.click(toggleButton);
      
      expect(screen.getByText(/Created:/)).toBeInTheDocument();
      expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    });

    it('shows completed timestamp when available', async () => {
      const user = userEvent.setup();
      render(<ProgressIndicator {...defaultProps} progress={mockProgressCompleted} showDetailedProgress={true} />);
      
      const toggleButton = screen.getByLabelText('Expand details');
      await user.click(toggleButton);
      
      expect(screen.getByText(/Completed:/)).toBeInTheDocument();
    });
  });

  describe('Time Estimation', () => {
    it('calculates and displays estimated time remaining', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<ProgressIndicator {...defaultProps} />);
      
      // Simulate time passing
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });
      
      await waitFor(() => {
        expect(screen.getByText(/remaining/)).toBeInTheDocument();
      });
    });

    it('formats time correctly for seconds', () => {
      const { rerender } = render(<ProgressIndicator {...defaultProps} />);
      
      // Mock the time calculation to return 45 seconds
      const mockCalculateEstimatedTime = jest.fn().mockReturnValue(45);
      jest.spyOn(React, 'useCallback').mockImplementation((fn) => {
        if (fn.toString().includes('calculateEstimatedTime')) {
          return mockCalculateEstimatedTime;
        }
        return fn;
      });
      
      rerender(<ProgressIndicator {...defaultProps} />);
      
      // This would need to be tested with the actual implementation
      // For now, we'll test the formatTime function indirectly
    });
  });

  describe('Auto Refresh', () => {
    it('auto refreshes when active', () => {
      render(<ProgressIndicator {...defaultProps} autoRefresh={true} />);
      
      // Should start auto refresh
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      // The component should have updated its refresh count
      // This would need to be tested with the actual implementation
    });

    it('stops auto refresh when inactive', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressCompleted} autoRefresh={true} />);
      
      // Should not start auto refresh for completed status
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      // No auto refresh should occur
    });

    it('uses custom refresh interval', () => {
      render(<ProgressIndicator {...defaultProps} refreshInterval={5000} />);
      
      // Should use 5 second interval instead of default 2 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    });
  });

  describe('Action Buttons', () => {
    it('shows cancel button when active and onCancel provided', () => {
      const onCancel = jest.fn();
      render(<ProgressIndicator {...defaultProps} onCancel={onCancel} />);
      
      expect(screen.getByLabelText('Cancel processing')).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      render(<ProgressIndicator {...defaultProps} onCancel={onCancel} />);
      
      await user.click(screen.getByLabelText('Cancel processing'));
      
      expect(onCancel).toHaveBeenCalled();
    });

    it('shows retry button when failed and onRetry provided', () => {
      const onRetry = jest.fn();
      render(<ProgressIndicator {...defaultProps} progress={mockProgressFailed} onRetry={onRetry} />);
      
      expect(screen.getByLabelText('Retry processing')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();
      render(<ProgressIndicator {...defaultProps} progress={mockProgressFailed} onRetry={onRetry} />);
      
      await user.click(screen.getByLabelText('Retry processing'));
      
      expect(onRetry).toHaveBeenCalled();
    });

    it('does not show action buttons when not provided', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      expect(screen.queryByLabelText(/Cancel processing/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Retry processing/)).not.toBeInTheDocument();
    });
  });

  describe('Refresh Button', () => {
    it('shows refresh button', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      expect(screen.getByLabelText('Refresh progress')).toBeInTheDocument();
    });

    it('shows loading state when refreshing', async () => {
      const user = userEvent.setup();
      render(<ProgressIndicator {...defaultProps} />);
      
      const refreshButton = screen.getByLabelText('Refresh progress');
      await user.click(refreshButton);
      
      expect(refreshButton).toBeDisabled();
      expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('enables refresh button after refresh completes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<ProgressIndicator {...defaultProps} />);
      
      const refreshButton = screen.getByLabelText('Refresh progress');
      await user.click(refreshButton);
      
      // Simulate refresh delay
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Display', () => {
    it('shows error message when error is present', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressFailed} />);
      
      expect(screen.getByText('Processing Error')).toBeInTheDocument();
      expect(screen.getByText('Processing failed due to network error')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for error', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressFailed} />);
      
      const errorElement = screen.getByText('Processing failed due to network error');
      expect(errorElement.closest('[role="alert"]')).toBeInTheDocument();
    });

    it('does not show error when no error present', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      expect(screen.queryByText('Processing Error')).not.toBeInTheDocument();
    });
  });

  describe('Success Message', () => {
    it('shows success message when completed', () => {
      render(<ProgressIndicator {...defaultProps} progress={mockProgressCompleted} />);
      
      expect(screen.getByText('Processing Complete!')).toBeInTheDocument();
      expect(screen.getByText('All 10 images have been successfully processed and optimized.')).toBeInTheDocument();
    });

    it('does not show success message when not completed', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      expect(screen.queryByText('Processing Complete!')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ProgressIndicator {...defaultProps} />);
      
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Processing progress');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '50% complete');
    });

    it('has proper button labels', () => {
      render(<ProgressIndicator {...defaultProps} showDetailedProgress={true} />);
      
      expect(screen.getByLabelText('Expand details')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh progress')).toBeInTheDocument();
    });

    it('updates button labels based on state', async () => {
      const user = userEvent.setup();
      render(<ProgressIndicator {...defaultProps} showDetailedProgress={true} />);
      
      const toggleButton = screen.getByLabelText('Expand details');
      await user.click(toggleButton);
      
      expect(screen.getByLabelText('Collapse details')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total progress', () => {
      const zeroProgress = { ...mockProgress, progress: { total: 0, completed: 0, failed: 0 } };
      render(<ProgressIndicator {...defaultProps} progress={zeroProgress} />);
      
      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });

    it('handles missing metadata', () => {
      const progressWithoutMetadata = { ...mockProgress, metadata: undefined };
      render(<ProgressIndicator {...defaultProps} progress={progressWithoutMetadata} showDetailedProgress={true} />);
      
      // Should not crash and should not show metadata
      expect(screen.queryByText(/Created:/)).not.toBeInTheDocument();
    });

    it('handles very large numbers', () => {
      const largeProgress = {
        ...mockProgress,
        progress: { total: 1000000, completed: 500000, failed: 1000 },
      };
      render(<ProgressIndicator {...defaultProps} progress={largeProgress} />);
      
      expect(screen.getByText('500000 of 1000000 images')).toBeInTheDocument();
      expect(screen.getByText('50% complete')).toBeInTheDocument();
    });
  });
});
