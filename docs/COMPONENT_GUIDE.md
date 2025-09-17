# Component Guide

## Overview

This guide provides detailed documentation for all React components in the Airbnb Image Optimizer application. Components are organized by functionality and include props, usage examples, and implementation details.

## Table of Contents
1. [URLInput Component](#urlinput-component)
2. [ImageComparison Component](#imagecomparison-component)
3. [ProgressIndicator Component](#progressindicator-component)
4. [ErrorBoundary Component](#errorboundary-component)
5. [Custom Hooks](#custom-hooks)
6. [Component Patterns](#component-patterns)

## URLInput Component

### Overview
Advanced URL input component with real-time validation, paste detection, and accessibility features.

### Location
`src/presentation/components/URLInput/URLInput.tsx`

### Props
```typescript
interface URLInputProps {
  onSubmit: (request: OptimizationRequest) => void;
  isLoading: boolean;
  error?: string | null;
  className?: string;
  placeholder?: string;
  maxImages?: number;
  showAdvancedOptions?: boolean;
}
```

### State
```typescript
interface URLInputState {
  url: string;
  validationError: string | null;
  isPasteDetected: boolean;
  isValidating: boolean;
  showAdvanced: boolean;
  maxImages: number;
}
```

### Features
- **Real-time Validation**: Validates Airbnb URLs as user types
- **Paste Detection**: Visual feedback when URL is pasted
- **Advanced Options**: Collapsible section for max images setting
- **Accessibility**: Full ARIA support and keyboard navigation
- **Error Handling**: Clear error messages and validation states
- **Debounced Input**: Prevents excessive validation calls

### Usage Example
```tsx
import { URLInput } from '@/presentation/components/URLInput/URLInput';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (request: OptimizationRequest) => {
    setIsLoading(true);
    try {
      // Process optimization request
      await processOptimization(request);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <URLInput
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      maxImages={10}
      showAdvancedOptions={true}
      placeholder="https://www.airbnb.com/rooms/12345678"
    />
  );
}
```

### Validation Rules
- Must be a valid URL format
- Must be from supported Airbnb domains
- Must contain `/rooms/` or `/listings/` path
- Room ID must be at least 8 characters long

### Supported Domains
- airbnb.com
- airbnb.co.uk
- airbnb.ca
- airbnb.com.au
- And 20+ other international domains

## ImageComparison Component

### Overview
Before/after image comparison component with zoom controls, download functionality, and room type badges.

### Location
`src/presentation/components/ImageComparison/ImageComparison.tsx`

### Props
```typescript
interface ImageComparisonProps {
  imagePair: ImagePairResponse;
  onDownload?: (imagePair: ImagePairResponse) => void;
  onDownloadAll?: () => void;
  jobId?: string;
  className?: string;
  showDownloadAll?: boolean;
}
```

### State
```typescript
interface ImageComparisonState {
  isZoomed: boolean;
  zoomLevel: number;
  isLoading: boolean;
  error: string | null;
  isDownloading: boolean;
}
```

### Features
- **Side-by-Side Display**: Original and optimized images
- **Zoom Controls**: Zoom in/out with reset functionality
- **Download Functionality**: 
  - Individual download buttons work correctly
  - Bulk download functionality
  - Proper file naming based on room type
- **Room Type Badges**: Visual room type indicators with proper detection
- **Optimization Comments**: Detailed enhancement descriptions
- **Error Handling**: Graceful error states and fallbacks
- **Loading States**: Processing indicators

### Usage Example
```tsx
import { ImageComparison } from '@/presentation/components/ImageComparison/ImageComparison';

function MyComponent() {
  const imagePair = {
    original: { /* original image data */ },
    optimized: { /* optimized image data */ },
    roomType: 'bedroom',
    fileName: 'bedroom_1.jpg',
    optimizationComment: 'Enhanced lighting and composition'
  };

  const handleDownload = async (imagePair: ImagePairResponse) => {
    if (!imagePair.optimized || !job) return;

    try {
      // Call the download API to get the optimized image
      const response = await fetch(`/api/v1/download/${job?.job?.id}/${imagePair.optimized.id}`);
      if (!response.ok) {
        throw new Error('Failed to download image');
      }
      
      const blob = await response.blob();
      saveAs(blob, imagePair.fileName);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleDownloadAll = () => {
    // Download all images
    downloadAllImages();
  };

  return (
    <ImageComparison
      imagePair={imagePair}
      onDownload={handleDownload}
      onDownloadAll={handleDownloadAll}
      jobId="job-uuid"
      showDownloadAll={true}
    />
  );
}
```

### Room Type Colors
- **Bedroom**: Blue (`bg-blue-100 text-blue-800`)
- **Kitchen**: Green (`bg-green-100 text-green-800`)
- **Bathroom**: Purple (`bg-purple-100 text-purple-800`)
- **Living Room**: Orange (`bg-orange-100 text-orange-800`)
- **Exterior**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Other**: Gray (`bg-gray-100 text-gray-800`)

### Zoom Functionality
- **Zoom In**: 1.2x multiplier (max 3x)
- **Zoom Out**: 0.83x multiplier (min 0.5x)
- **Reset**: Return to 1x zoom
- **Transform Origin**: Top-left for original, top-right for optimized

## ProgressIndicator Component

### Overview
Real-time progress tracking component with detailed metrics, time estimation, and auto-refresh functionality.

### Location
`src/presentation/components/ProgressIndicator/ProgressIndicator.tsx`

### Props
```typescript
interface ProgressIndicatorProps {
  progress: JobProgress;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
  showDetailedProgress?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}
```

### State
```typescript
interface ProgressIndicatorState {
  isExpanded: boolean;
  estimatedTimeRemaining: number | null;
  lastUpdateTime: number;
  isRefreshing: boolean;
  refreshCount: number;
}
```

### Features
- **Progress Bar**: Animated progress visualization
- **Status Indicators**: Color-coded status badges
- **Time Estimation**: Calculated remaining time
- **Detailed Metrics**: Expandable progress details
- **Auto-Refresh**: Configurable polling interval
- **Action Buttons**: Cancel and retry functionality
- **Error Display**: Clear error messaging

### Usage Example
```tsx
import { ProgressIndicator } from '@/presentation/components/ProgressIndicator/ProgressIndicator';

function MyComponent() {
  const progress = {
    jobId: 'job-uuid',
    status: 'processing',
    progress: { total: 10, completed: 5, failed: 0 },
    currentStep: 'Processing images',
    metadata: {
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:05:00.000Z'
    }
  };

  const handleCancel = () => {
    // Cancel processing
    cancelJob(progress.jobId);
  };

  const handleRetry = () => {
    // Retry failed job
    retryJob(progress.jobId);
  };

  return (
    <ProgressIndicator
      progress={progress}
      onCancel={handleCancel}
      onRetry={handleRetry}
      showDetailedProgress={true}
      autoRefresh={true}
      refreshInterval={2000}
    />
  );
}
```

### Status Colors
- **Completed**: Green (`text-green-600 bg-green-100`)
- **Failed**: Red (`text-red-600 bg-red-100`)
- **Processing**: Blue (`text-blue-600 bg-blue-100`)
- **Scraping**: Yellow (`text-yellow-600 bg-yellow-100`)
- **Cancelled**: Gray (`text-gray-600 bg-gray-100`)

### Time Estimation Algorithm
```typescript
const calculateEstimatedTime = () => {
  if (!isActive || completed === 0) return null;
  
  const elapsed = Date.now() - startTime;
  const rate = completed / elapsed; // images per millisecond
  const remaining = total - completed;
  
  if (rate > 0) {
    return Math.round((remaining / rate) / 1000); // seconds
  }
  
  return null;
};
```

## ErrorBoundary Component

### Overview
React error boundary component for graceful error handling and user feedback.

### Location
`src/presentation/components/ErrorBoundary/ErrorBoundary.tsx`

### Features
- **Error Catching**: Catches JavaScript errors in child components
- **Fallback UI**: Displays user-friendly error message
- **Error Reporting**: Logs errors for debugging
- **Recovery Options**: Provides retry functionality

### Usage Example
```tsx
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Custom Hooks

### useOptimizationJob

#### Overview
Custom hook for managing optimization job lifecycle, progress tracking, and state management.

#### Location
`src/presentation/hooks/useOptimizationJob.ts`

#### Return Interface
```typescript
interface UseOptimizationJobReturn {
  job: OptimizationResponse['data'] | null;
  progress: JobProgress | null;
  isLoading: boolean;
  error: string | null;
  startJob: (request: OptimizationRequest) => Promise<void>;
  refreshProgress: () => Promise<void>;
  clearState: () => void;
}
```

#### Features
- **Job Creation**: Starts new optimization jobs
- **Progress Polling**: Automatic progress updates every 5 seconds
- **State Management**: Centralized job state
- **Error Handling**: Comprehensive error management
- **Cleanup**: Automatic cleanup on unmount

#### Usage Example
```tsx
import { useOptimizationJob } from '@/presentation/hooks/useOptimizationJob';

function MyComponent() {
  const { job, progress, isLoading, error, startJob, clearState } = useOptimizationJob();

  const handleOptimize = async (url: string) => {
    await startJob({
      airbnbUrl: url,
      maxImages: 10
    });
  };

  return (
    <div>
      {isLoading && <div>Processing...</div>}
      {error && <div>Error: {error}</div>}
      {progress && <ProgressIndicator progress={progress} />}
      {job && <ImageComparison imagePair={job.imagePairs[0]} />}
    </div>
  );
}
```

#### Polling Configuration
- **Interval**: 5 seconds
- **Timeout**: 5 minutes maximum
- **Cleanup**: Automatic on component unmount
- **Error Handling**: Stops polling on repeated errors

## Component Patterns

### State Management Pattern
All components use the following state management pattern:

```typescript
interface ComponentState {
  // State properties
}

const INITIAL_STATE: ComponentState = {
  // Initial values
};

function Component() {
  const [state, setState] = useState<ComponentState>(INITIAL_STATE);
  
  // State update functions
  const updateState = useCallback((updates: Partial<ComponentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Component logic
}
```

### Error Handling Pattern
Consistent error handling across all components:

```typescript
const [error, setError] = useState<string | null>(null);

const handleError = useCallback((err: unknown) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
  console.error('Component error:', err);
}, []);

// Clear error on successful operations
const clearError = useCallback(() => {
  setError(null);
}, []);
```

### Loading State Pattern
Standardized loading state management:

```typescript
const [isLoading, setIsLoading] = useState(false);

const executeAsyncOperation = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    await asyncOperation();
  } catch (err) {
    handleError(err);
  } finally {
    setIsLoading(false);
  }
}, []);
```

### Accessibility Pattern
All components follow accessibility best practices:

```typescript
// ARIA labels and roles
<button
  aria-label="Download optimized image"
  aria-describedby="download-help"
  role="button"
>
  Download
</button>

// Error announcements
{error && (
  <div role="alert" aria-live="polite">
    Error: {error}
  </div>
)}

// Form validation
<input
  aria-invalid={!!validationError}
  aria-describedby={validationError ? 'validation-error' : undefined}
/>
```

### Performance Optimization Pattern
Components are optimized for performance:

```typescript
// Memoized callbacks
const handleClick = useCallback((id: string) => {
  // Handle click
}, [dependency]);

// Memoized components
const MemoizedComponent = memo(Component);

// Debounced functions
const debouncedFunction = useMemo(
  () => debounce(originalFunction, 300),
  [dependency]
);
```

## Styling Guidelines

### Tailwind CSS Classes
Components use consistent Tailwind CSS patterns:

```typescript
// Status colors
const statusColors = {
  success: 'text-green-600 bg-green-100',
  error: 'text-red-600 bg-red-100',
  warning: 'text-yellow-600 bg-yellow-100',
  info: 'text-blue-600 bg-blue-100'
};

// Button variants
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white'
};

// Layout patterns
const layoutClasses = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  card: 'bg-white rounded-lg shadow-md overflow-hidden',
  grid: 'grid gap-6'
};
```

### Responsive Design
All components are responsive:

```typescript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Title
</h1>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>
```

## Troubleshooting

### Download Issues

#### Individual Download Not Working
**Problem**: Individual download buttons don't work with "onDownload is not defined" error
**Solution**: Ensure the `onDownload` prop is properly destructured in the component and passed from parent:
```tsx
// In parent component (page.tsx)
const handleDownload = async (imagePair: ImagePairResponse) => {
  if (!imagePair.optimized || !job) return;
  
  // Debug logging to help identify issues
  console.log('Individual download debug:', {
    jobId: job?.job?.id,
    imageId: imagePair.optimized.id,
    fileName: imagePair.fileName,
    hasOptimized: !!imagePair.optimized,
    optimizedId: imagePair.optimized.id
  });
  
  try {
    const response = await fetch(`/api/v1/download/${job?.job?.id}/${imagePair.optimized.id}`);
    if (!response.ok) throw new Error('Failed to download image');
    
    const blob = await response.blob();
    saveAs(blob, imagePair.fileName);
  } catch (error) {
    console.error('Download failed:', error);
  }
};

// In ImageComparison component - ensure onDownload is destructured
export function ImageComparison({ 
  imagePair, 
  onDownload,  // ← This was missing!
  onDownloadAll,
  jobId,
  className = '',
  showDownloadAll = false
}: ImageComparisonProps) {
  // ... rest of component
}
```

#### Room Type Detection Issues
**Problem**: All images showing as "other" room type
**Solution**: The system now uses Gemini AI to detect room types when Apify returns "other" or no room type. Each image gets individual room type detection.

## Testing Components

### Unit Testing
Each component has comprehensive unit tests:

```typescript
// Example test structure
describe('URLInput Component', () => {
  it('should validate Airbnb URLs correctly', () => {
    // Test validation logic
  });
  
  it('should handle form submission', () => {
    // Test form submission
  });
  
  it('should display error messages', () => {
    // Test error handling
  });
});
```

### Integration Testing
Components are tested in integration scenarios:

```typescript
// Example integration test
describe('Image Optimization Flow', () => {
  it('should complete full optimization workflow', async () => {
    // Test complete user workflow
  });
});
```

This component guide provides comprehensive documentation for all React components, including their props, usage patterns, and implementation details. Each component is designed to be reusable, accessible, and performant.
