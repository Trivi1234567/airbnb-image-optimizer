import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageComparison, ImageComparisonProps } from './ImageComparison';
import { ImagePairResponse } from '@/application/dto/OptimizationResponse.dto';
import { RoomType } from '@/domain/entities/RoomType';
import { apiService } from '@/infrastructure/services/ApiService';

// Mock the API service
jest.mock('@/infrastructure/services/ApiService', () => ({
  apiService: {
    downloadImage: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock data
const mockImagePair: ImagePairResponse = {
  original: {
    id: 'original-1',
    originalUrl: 'https://example.com/original.jpg',
    fileName: 'bedroom-1.jpg',
    roomType: RoomType.BEDROOM,
    processingStatus: 'completed',
  },
  optimized: {
    id: 'optimized-1',
    originalUrl: 'https://example.com/optimized.jpg',
    fileName: 'bedroom-1-optimized.jpg',
    roomType: RoomType.BEDROOM,
    processingStatus: 'completed',
  },
  roomType: RoomType.BEDROOM,
  fileName: 'bedroom-1.jpg',
};

const mockImagePairProcessing: ImagePairResponse = {
  original: {
    id: 'original-2',
    originalUrl: 'https://example.com/original2.jpg',
    fileName: 'kitchen-1.jpg',
    roomType: RoomType.KITCHEN,
    processingStatus: 'analyzing',
  },
  optimized: undefined,
  roomType: RoomType.KITCHEN,
  fileName: 'kitchen-1.jpg',
};

const mockImagePairFailed: ImagePairResponse = {
  original: {
    id: 'original-3',
    originalUrl: 'https://example.com/original3.jpg',
    fileName: 'bathroom-1.jpg',
    roomType: RoomType.BATHROOM,
    processingStatus: 'failed',
    error: 'Processing failed',
  },
  optimized: undefined,
  roomType: RoomType.BATHROOM,
  fileName: 'bathroom-1.jpg',
};

describe('ImageComparison', () => {
  const defaultProps: ImageComparisonProps = {
    imagePair: mockImagePair,
    jobId: 'test-job-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('Rendering', () => {
    it('renders with basic props', () => {
      render(<ImageComparison {...defaultProps} />);
      
      expect(screen.getByText('Bedroom')).toBeInTheDocument();
      expect(screen.getByText('bedroom-1.jpg')).toBeInTheDocument();
      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });

    it('renders with processing state', () => {
      render(<ImageComparison {...defaultProps} imagePair={mockImagePairProcessing} />);
      
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('renders with failed state', () => {
      render(<ImageComparison {...defaultProps} imagePair={mockImagePairFailed} />);
      
      expect(screen.getByText('Bathroom')).toBeInTheDocument();
      expect(screen.getByText('Processing failed')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <ImageComparison {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('View Mode Toggle', () => {
    it('switches between view modes', async () => {
      const user = userEvent.setup();
      render(<ImageComparison {...defaultProps} />);
      
      // Default is side-by-side
      expect(screen.getByText('side by side')).toHaveClass('bg-white');
      
      // Switch to slider
      await user.click(screen.getByText('slider'));
      expect(screen.getByText('slider')).toHaveClass('bg-white');
      expect(screen.getByText('Drag to compare')).toBeInTheDocument();
      
      // Switch to toggle
      await user.click(screen.getByText('toggle'));
      expect(screen.getByText('toggle')).toHaveClass('bg-white');
      expect(screen.getByText('Hover to see optimized')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for view mode buttons', () => {
      render(<ImageComparison {...defaultProps} />);
      
      const sideBySideButton = screen.getByText('side by side');
      expect(sideBySideButton).toHaveAttribute('role', 'tab');
      expect(sideBySideButton).toHaveAttribute('aria-selected', 'true');
      expect(sideBySideButton).toHaveAttribute('aria-label', 'Switch to side by side view');
    });
  });

  describe('Zoom Functionality', () => {
    it('zooms in and out', async () => {
      const user = userEvent.setup();
      render(<ImageComparison {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      const zoomOutButton = screen.getByLabelText('Zoom out');
      const zoomLevel = screen.getByText('100%');
      
      // Zoom in
      await user.click(zoomInButton);
      expect(zoomLevel).toHaveTextContent('120%');
      
      // Zoom in again
      await user.click(zoomInButton);
      expect(zoomLevel).toHaveTextContent('144%');
      
      // Zoom out
      await user.click(zoomOutButton);
      expect(zoomLevel).toHaveTextContent('120%');
    });

    it('shows reset zoom button when zoomed', async () => {
      const user = userEvent.setup();
      render(<ImageComparison {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      
      // Initially no reset button
      expect(screen.queryByLabelText('Reset zoom')).not.toBeInTheDocument();
      
      // Zoom in
      await user.click(zoomInButton);
      expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
    });

    it('resets zoom when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageComparison {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      const resetButton = screen.getByLabelText('Reset zoom');
      const zoomLevel = screen.getByText('100%');
      
      // Zoom in
      await user.click(zoomInButton);
      expect(zoomLevel).toHaveTextContent('120%');
      
      // Reset zoom
      await user.click(resetButton);
      expect(zoomLevel).toHaveTextContent('100%');
      expect(screen.queryByLabelText('Reset zoom')).not.toBeInTheDocument();
    });

    it('disables zoom buttons at limits', async () => {
      const user = userEvent.setup();
      render(<ImageComparison {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      const zoomOutButton = screen.getByLabelText('Zoom out');
      
      // Zoom to maximum
      for (let i = 0; i < 10; i++) {
        await user.click(zoomInButton);
      }
      
      expect(zoomInButton).toBeDisabled();
      expect(zoomOutButton).not.toBeDisabled();
      
      // Zoom to minimum
      for (let i = 0; i < 10; i++) {
        await user.click(zoomOutButton);
      }
      
      expect(zoomOutButton).toBeDisabled();
      expect(zoomInButton).not.toBeDisabled();
    });
  });

  describe('Download Functionality', () => {
    it('downloads image when download button is clicked', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      mockApiService.downloadImage.mockResolvedValue(mockBlob);
      
      render(<ImageComparison {...defaultProps} />);
      
      const downloadButton = screen.getByLabelText('Download optimized bedroom-1.jpg');
      await user.click(downloadButton);
      
      expect(mockApiService.downloadImage).toHaveBeenCalledWith('test-job-id', 'optimized-1');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('shows loading state during download', async () => {
      const user = userEvent.setup();
      let resolveDownload: (value: Blob) => void;
      const downloadPromise = new Promise<Blob>((resolve) => {
        resolveDownload = resolve;
      });
      mockApiService.downloadImage.mockReturnValue(downloadPromise);
      
      render(<ImageComparison {...defaultProps} />);
      
      const downloadButton = screen.getByLabelText('Download optimized bedroom-1.jpg');
      await user.click(downloadButton);
      
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
      expect(downloadButton).toBeDisabled();
      
      // Resolve the download
      act(() => {
        resolveDownload(new Blob(['test'], { type: 'image/jpeg' }));
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Downloading...')).not.toBeInTheDocument();
      });
    });

    it('shows error when download fails', async () => {
      const user = userEvent.setup();
      mockApiService.downloadImage.mockResolvedValue(null);
      
      render(<ImageComparison {...defaultProps} />);
      
      const downloadButton = screen.getByLabelText('Download optimized bedroom-1.jpg');
      await user.click(downloadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error: Failed to download image')).toBeInTheDocument();
      });
    });

    it('does not show download button when no optimized image', () => {
      render(<ImageComparison {...defaultProps} imagePair={mockImagePairProcessing} />);
      
      expect(screen.queryByLabelText(/Download/)).not.toBeInTheDocument();
    });

    it('calls onDownloadAll when download all button is clicked', async () => {
      const user = userEvent.setup();
      const onDownloadAll = jest.fn();
      
      render(
        <ImageComparison 
          {...defaultProps} 
          onDownloadAll={onDownloadAll}
          showDownloadAll={true}
        />
      );
      
      const downloadAllButton = screen.getByLabelText('Download all optimized images');
      await user.click(downloadAllButton);
      
      expect(onDownloadAll).toHaveBeenCalled();
    });
  });

  describe('Slider Functionality', () => {
    it('moves slider on mouse down and move', async () => {
      render(<ImageComparison {...defaultProps} />);
      
      // Switch to slider view
      await userEvent.click(screen.getByText('slider'));
      
      const slider = screen.getByLabelText('Drag to compare images');
      const sliderContainer = slider.parentElement;
      
      // Mock getBoundingClientRect
      const mockRect = {
        left: 0,
        width: 100,
        top: 0,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };
      jest.spyOn(sliderContainer!, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
      
      // Simulate mouse down and move
      fireEvent.mouseDown(slider, { clientX: 50 });
      fireEvent.mouseMove(document, { clientX: 75 });
      fireEvent.mouseUp(document);
      
      // Check that slider position changed
      expect(slider).toHaveStyle({ left: '75%' });
    });
  });

  describe('Error Handling', () => {
    it('shows error when image fails to load', () => {
      render(<ImageComparison {...defaultProps} />);
      
      const originalImage = screen.getByAltText('Original image');
      fireEvent.error(originalImage);
      
      expect(screen.getByText('Error: Failed to load original image')).toBeInTheDocument();
    });

    it('shows error when optimized image fails to load', () => {
      render(<ImageComparison {...defaultProps} />);
      
      const optimizedImage = screen.getByAltText('Optimized image');
      fireEvent.error(optimizedImage);
      
      expect(screen.getByText('Error: Failed to load optimized image')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ImageComparison {...defaultProps} />);
      
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Image comparison');
      expect(screen.getByLabelText('Room type: Bedroom')).toBeInTheDocument();
      expect(screen.getByLabelText('File: bedroom-1.jpg')).toBeInTheDocument();
    });

    it('has proper form validation attributes', () => {
      render(<ImageComparison {...defaultProps} />);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });
  });

  describe('Status Display', () => {
    it('shows correct status colors and icons', () => {
      render(<ImageComparison {...defaultProps} />);
      
      const statusElements = screen.getAllByText('completed');
      statusElements.forEach(element => {
        expect(element).toHaveClass('text-green-600', 'bg-green-100');
      });
    });

    it('shows processing status correctly', () => {
      render(<ImageComparison {...defaultProps} imagePair={mockImagePairProcessing} />);
      
      expect(screen.getByText('analyzing')).toHaveClass('text-blue-600', 'bg-blue-100');
    });

    it('shows failed status correctly', () => {
      render(<ImageComparison {...defaultProps} imagePair={mockImagePairFailed} />);
      
      expect(screen.getByText('failed')).toHaveClass('text-red-600', 'bg-red-100');
    });
  });

  describe('Image Loading States', () => {
    it('shows loading skeleton for processing images', () => {
      render(<ImageComparison {...defaultProps} imagePair={mockImagePairProcessing} />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    it('shows error state for failed images', () => {
      render(<ImageComparison {...defaultProps} imagePair={mockImagePairFailed} />);
      
      expect(screen.getByText('Processing failed')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('shows waiting state for pending images', () => {
      const pendingImagePair = {
        ...mockImagePairProcessing,
        original: {
          ...mockImagePairProcessing.original,
          processingStatus: 'pending' as const,
        },
      };
      
      render(<ImageComparison {...defaultProps} imagePair={pendingImagePair} />);
      
      expect(screen.getByText('Waiting to process...')).toBeInTheDocument();
    });
  });
});
