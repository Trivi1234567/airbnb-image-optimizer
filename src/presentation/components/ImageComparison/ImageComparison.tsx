'use client';

import { useState, useRef, useCallback } from 'react';
import { ImagePairResponse } from '@/application/dto/OptimizationResponse.dto';
import { ROOM_TYPE_LABELS, ROOM_TYPE_COLORS } from '@/domain/entities/RoomType';

export interface ImageComparisonProps {
  imagePair: ImagePairResponse;
  onDownload?: (imagePair: ImagePairResponse) => void;
  onDownloadAll?: () => void;
  jobId?: string;
  className?: string;
  showDownloadAll?: boolean;
}

export interface ImageComparisonState {
  isZoomed: boolean;
  zoomLevel: number;
  isLoading: boolean;
  error: string | null;
  isDownloading: boolean;
}

const INITIAL_STATE: ImageComparisonState = {
  isZoomed: false,
  zoomLevel: 1,
  isLoading: false,
  error: null,
  isDownloading: false,
};

export function ImageComparison({ 
  imagePair, 
  onDownload,
  onDownloadAll,
  jobId: _jobId,
  className = '',
  showDownloadAll = false
}: ImageComparisonProps) {
  const [state, setState] = useState<ImageComparisonState>(INITIAL_STATE);
  const sliderRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { original, optimized, roomType, fileName, optimizationComment } = imagePair;

  // Debug logging to help identify the issue (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('ImageComparison Debug:', {
      hasOptimized: !!optimized,
      hasOptimizedBase64: !!(optimized?.optimizedBase64),
      optimizedBase64Length: optimized?.optimizedBase64?.length || 0,
      originalUrl: original?.originalUrl,
      optimizedUrl: optimized?.originalUrl,
      optimizedBase64Preview: optimized?.optimizedBase64?.substring(0, 50) + '...',
      roomType: roomType,
      fileName: fileName,
      optimizationComment: optimizationComment,
      imagePairStructure: {
        original: original,
        optimized: optimized,
        roomType,
        fileName,
        optimizationComment
      }
    });
  }




  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setState(prev => ({
      ...prev,
      zoomLevel: direction === 'in' 
        ? Math.min(prev.zoomLevel * 1.2, 3)
        : Math.max(prev.zoomLevel / 1.2, 0.5),
      isZoomed: true
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setState(prev => ({
      ...prev,
      isZoomed: false,
      zoomLevel: 1
    }));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!onDownload || !optimized) return;

    setState(prev => ({ ...prev, isDownloading: true, error: null }));

    try {
      await onDownload(imagePair);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Download failed' 
      }));
    } finally {
      setState(prev => ({ ...prev, isDownloading: false }));
    }
  }, [onDownload, optimized, imagePair]);

  const handleDownloadAll = useCallback(() => {
    if (onDownloadAll) {
      onDownloadAll();
    }
  }, [onDownloadAll]);

  const isProcessing = original.processingStatus === 'analyzing' || 
                     original.processingStatus === 'optimizing' ||
                     (optimized && (optimized.processingStatus === 'analyzing' || optimized.processingStatus === 'optimizing'));

  const hasError = original.processingStatus === 'failed' || 
                  (optimized && optimized.processingStatus === 'failed');

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`} role="region" aria-label="Image comparison">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium ${ROOM_TYPE_COLORS[roomType]}`}
              aria-label={`Room type: ${ROOM_TYPE_LABELS[roomType]}`}
            >
              {ROOM_TYPE_LABELS[roomType]}
            </span>
            <span className="text-sm text-gray-600" aria-label={`File: ${fileName}`}>
              {fileName}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleZoom('out')}
                className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Zoom out"
                disabled={state.zoomLevel <= 0.5}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 min-w-[3rem] text-center">
                {Math.round(state.zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom('in')}
                className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Zoom in"
                disabled={state.zoomLevel >= 3}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {state.isZoomed && (
                <button
                  onClick={resetZoom}
                  className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Reset zoom"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Download Button */}
            {optimized && (
              <button
                onClick={handleDownload}
                disabled={state.isDownloading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                aria-label={`Download optimized ${fileName}`}
              >
                {state.isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download</span>
                  </>
                )}
              </button>
            )}

            {/* Download All Button */}
            {showDownloadAll && onDownloadAll && (
              <button
                onClick={handleDownloadAll}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                aria-label="Download all optimized images"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Download All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mx-4 mt-4" role="alert">
          <p className="text-sm text-red-700">
            <span className="font-medium">Error:</span> {state.error}
          </p>
        </div>
      )}

      {/* Image Display */}
      <div className="relative" ref={sliderRef}>
        <div className="grid grid-cols-2 gap-0">
          <div className="relative">
            <img
              ref={imageRef}
              src={original.originalUrl}
              alt="Original image"
              className={`w-full h-64 object-cover transition-transform duration-200 ${
                state.isZoomed ? 'cursor-move' : 'cursor-zoom-in'
              }`}
              style={{ 
                transform: state.isZoomed ? `scale(${state.zoomLevel})` : 'scale(1)',
                transformOrigin: 'top left'
              }}
              onClick={() => !state.isZoomed && handleZoom('in')}
              onError={() => setState(prev => ({ ...prev, error: 'Failed to load original image' }))}
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
              Before
            </div>
          </div>
          
          <div className="relative">
            {optimized ? (
              <>
                <img
                  src={optimized.optimizedBase64 ? `data:image/jpeg;base64,${optimized.optimizedBase64}` : optimized.originalUrl}
                  alt="Optimized image"
                  onLoad={() => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Optimized image loaded successfully');
                    }
                  }}
                  onError={(e) => {
                    if (process.env.NODE_ENV === 'development') {
                      console.error('Failed to load optimized image:', e);
                      console.log('Falling back to original URL:', optimized.originalUrl);
                    }
                    setState(prev => ({ ...prev, error: 'Failed to load optimized image' }));
                  }}
                  className={`w-full h-64 object-cover transition-transform duration-200 ${
                    state.isZoomed ? 'cursor-move' : 'cursor-zoom-in'
                  }`}
                  style={{ 
                    transform: state.isZoomed ? `scale(${state.zoomLevel})` : 'scale(1)',
                    transformOrigin: 'top right'
                  }}
                  onClick={() => !state.isZoomed && handleZoom('in')}
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                  After
                </div>
              </>
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                {isProcessing ? (
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm">Processing...</p>
                  </div>
                ) : hasError ? (
                  <div className="text-center text-red-500">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p className="text-sm">Processing failed</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">⏳</div>
                    <p className="text-sm">Waiting to process...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimization Comment */}
      {optimizationComment && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-700 italic">
            <span className="font-medium">Optimization:</span> {optimizationComment}
          </p>
        </div>
      )}
    </div>
  );
}
