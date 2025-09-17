'use client';

import { useState } from 'react';
import { URLInput } from '@/presentation/components/URLInput/URLInput';
import { ProgressIndicator } from '@/presentation/components/ProgressIndicator/ProgressIndicator';
import { ImageComparison } from '@/presentation/components/ImageComparison/ImageComparison';
import { useOptimizationJob } from '@/presentation/hooks/useOptimizationJob';
import { OptimizationRequest } from '@/application/dto/OptimizationRequest.dto';
import { ImagePairResponse } from '@/application/dto/OptimizationResponse.dto';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function HomePage() {
  const { job, progress, isLoading, error, startJob, clearState } = useOptimizationJob();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleOptimize = async (request: OptimizationRequest) => {
    await startJob(request);
  };

  const handleDownloadImage = async (imagePair: ImagePairResponse) => {
    if (!imagePair.optimized || !job) return;

    console.log('Individual download debug:', {
      jobId: job?.job?.id,
      imageId: imagePair.optimized.id,
      fileName: imagePair.fileName,
      roomType: imagePair.roomType,
      hasOptimized: !!imagePair.optimized,
      optimizedId: imagePair.optimized.id,
      fullImagePair: imagePair
    });

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

  const handleDownloadAll = async () => {
    if (!job?.imagePairs) return;

    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      
      for (const imagePair of job.imagePairs) {
        if (imagePair.optimized) {
          try {
            // Download the optimized image via API
            const response = await fetch(`/api/v1/download/${job?.job?.id}/${imagePair.optimized.id}`);
            if (response.ok) {
              const blob = await response.blob();
              zip.file(imagePair.fileName, blob);
            }
          } catch (error) {
            console.error(`Failed to download image ${imagePair.fileName}:`, error);
          }
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'optimized-airbnb-images.zip');
    } catch (error) {
      console.error('Failed to create ZIP file:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Airbnb Image Optimizer
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              AI-Powered Image Enhancement
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!job && (
          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Transform Your Airbnb Images
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload your Airbnb listing URL and let our AI optimize your images 
                for maximum appeal and professional quality.
              </p>
            </div>
            
            <URLInput
              onSubmit={handleOptimize}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}

        {progress && !job && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Processing Status</h3>
                <button
                  onClick={clearState}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear State
                </button>
              </div>
              
              {/* Batch Processing Info */}
              {progress.progress.total >= 5 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Using Batch Processing</p>
                      <p className="text-xs text-blue-600">Processing {progress.progress.total} images with 50% cost savings</p>
                    </div>
                  </div>
                </div>
              )}
              
              <ProgressIndicator progress={progress} />
            </div>
          </div>
        )}

        {job && (
          <div className="space-y-8">
            {/* Job Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Optimization Results
                  </h2>
                  <p className="text-gray-600">
                    {job?.job?.airbnbUrl || 'Loading...'}
                  </p>
                  {job?.imagePairs && job.imagePairs.length >= 5 && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Processed using batch API (50% cost savings)
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDownloadAll}
                    disabled={isDownloading || !job?.imagePairs || job.imagePairs.some(pair => !pair.optimized)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDownloading ? (
                      <div className="flex items-center">
                        <div className="loading-spinner h-4 w-4 mr-2"></div>
                        Creating ZIP...
                      </div>
                    ) : (
                      'Download All'
                    )}
                  </button>
                </div>
              </div>
              
              {progress && (
                <ProgressIndicator progress={progress} />
              )}
            </div>

            {/* Image Comparisons */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Image Comparisons ({job.imagePairs.length})
              </h3>
              
              <div className="grid gap-6">
                {job.imagePairs.map((imagePair) => (
                  <ImageComparison
                    key={imagePair.original.id}
                    imagePair={imagePair}
                    onDownload={handleDownloadImage}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 Airbnb Image Optimizer. Powered by AI technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
