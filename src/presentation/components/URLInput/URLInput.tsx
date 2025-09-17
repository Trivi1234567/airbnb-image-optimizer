'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { OptimizationRequest } from '@/application/dto/OptimizationRequest.dto';

export interface URLInputProps {
  onSubmit: (request: OptimizationRequest) => void;
  isLoading: boolean;
  error?: string | null;
  className?: string;
  placeholder?: string;
  maxImages?: number;
  showAdvancedOptions?: boolean;
}

export interface URLInputState {
  url: string;
  validationError: string | null;
  isPasteDetected: boolean;
  isValidating: boolean;
  showAdvanced: boolean;
  maxImages: number;
}

const INITIAL_STATE: URLInputState = {
  url: '',
  validationError: null,
  isPasteDetected: false,
  isValidating: false,
  showAdvanced: false,
  maxImages: 10,
};

const AIRBNB_DOMAINS = [
  'airbnb.com',
  'airbnb.co.uk',
  'airbnb.ca',
  'airbnb.com.au',
  'airbnb.fr',
  'airbnb.de',
  'airbnb.es',
  'airbnb.it',
  'airbnb.nl',
  'airbnb.se',
  'airbnb.no',
  'airbnb.dk',
  'airbnb.fi',
  'airbnb.pl',
  'airbnb.pt',
  'airbnb.be',
  'airbnb.at',
  'airbnb.ch',
  'airbnb.ie',
  'airbnb.co.nz',
  'airbnb.co.za',
  'airbnb.com.br',
  'airbnb.com.mx',
  'airbnb.com.ar',
  'airbnb.cl',
  'airbnb.co',
  'airbnb.com.co',
  'airbnb.com.pe',
  'airbnb.com.uy',
  'airbnb.com.ve',
];

export function URLInput({ 
  onSubmit, 
  isLoading, 
  error, 
  className = '',
  placeholder = 'https://www.airbnb.com/rooms/12345678',
  maxImages = 10,
  showAdvancedOptions = false
}: URLInputProps) {
  const [state, setState] = useState<URLInputState>({ ...INITIAL_STATE, maxImages });
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validateUrl = useCallback((inputUrl: string): { isValid: boolean; error?: string } => {
    if (!inputUrl.trim()) {
      return { isValid: false, error: 'Please enter a URL' };
    }

    try {
      const urlObj = new URL(inputUrl);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check if it's an Airbnb domain
      const isValidAirbnb = AIRBNB_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      );
      
      if (!isValidAirbnb) {
        return { 
          isValid: false, 
          error: 'Please enter a valid Airbnb listing URL (e.g., airbnb.com, airbnb.co.uk, etc.)' 
        };
      }

      // Check if it looks like a listing URL
      const pathname = urlObj.pathname.toLowerCase();
      const isListingUrl = pathname.includes('/rooms/') || pathname.includes('/listings/');
      
      if (!isListingUrl) {
        return { 
          isValid: false, 
          error: 'Please enter a valid Airbnb listing URL (should contain /rooms/ or /listings/)' 
        };
      }

      // Check if the room ID looks valid (not just short numbers like 123456)
      const roomIdMatch = pathname.match(/\/rooms\/(\d+)/);
      if (roomIdMatch && roomIdMatch[1] && roomIdMatch[1].length < 8) {
        return {
          isValid: false,
          error: 'Please enter a valid Airbnb listing URL with a proper room ID (e.g., https://www.airbnb.com/rooms/1234567890123456)'
        };
      }

      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Please enter a valid URL format' };
    }
  }, []);

  const handleUrlChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, url: value, validationError: null }));
    
    // Debounced validation
    if (pasteTimeoutRef.current) {
      clearTimeout(pasteTimeoutRef.current);
    }
    
    pasteTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        setState(prev => ({ ...prev, isValidating: true }));
        const validation = validateUrl(value);
        setState(prev => ({ 
          ...prev, 
          validationError: validation.error || null,
          isValidating: false
        }));
      }
    }, 300);
  }, [validateUrl]);

  const handlePaste = useCallback((_e: React.ClipboardEvent) => {
    setState(prev => ({ ...prev, isPasteDetected: true }));
    
    // Clear paste indicator after animation
    setTimeout(() => {
      setState(prev => ({ ...prev, isPasteDetected: false }));
    }, 1000);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }
    
    // Debounce submissions (prevent rapid-fire submissions)
    const now = Date.now();
    if (now - lastSubmitTime < 2000) { // 2 second debounce
      return;
    }
    setLastSubmitTime(now);
    
    const validation = validateUrl(state.url);
    if (!validation.isValid) {
      setState(prev => ({ ...prev, validationError: validation.error || 'Invalid URL' }));
      return;
    }

    onSubmit({
      airbnbUrl: state.url.trim(),
      maxImages: state.maxImages
    });
  }, [state.url, state.maxImages, validateUrl, onSubmit, isLoading, lastSubmitTime]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  const handleMaxImagesChange = useCallback((value: number) => {
    setState(prev => ({ ...prev, maxImages: Math.max(1, Math.min(10, value)) }));
  }, []);

  const toggleAdvanced = useCallback(() => {
    setState(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }));
  }, []);

  const clearInput = useCallback(() => {
    setState(prev => ({ ...prev, url: '', validationError: null }));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pasteTimeoutRef.current) {
        clearTimeout(pasteTimeoutRef.current);
      }
    };
  }, []);

  // Validate initial URL on mount
  useEffect(() => {
    if (state.url) {
      const validation = validateUrl(state.url);
      setState(prev => ({ 
        ...prev, 
        validationError: validation.error || null,
        isValidating: false
      }));
    }
  }, [validateUrl]);

  const displayError = state.validationError || error;
  const isFormValid = state.url.trim() && !state.validationError && !isLoading;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label 
            htmlFor="airbnb-url" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Airbnb Listing URL
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          </label>
          
          <div className="relative">
            <input
              ref={inputRef}
              id="airbnb-url"
              type="url"
              value={state.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full px-4 py-3 pr-20 border rounded-lg transition-all duration-200 ${
                displayError 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : state.isPasteDetected
                  ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              } focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isLoading}
              aria-describedby={displayError ? 'url-error' : undefined}
              aria-invalid={!!displayError}
              autoComplete="url"
              autoFocus
            />
            
            {/* Clear button */}
            {state.url && !isLoading && (
              <button
                type="button"
                onClick={clearInput}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear URL"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Paste indicator */}
            {state.isPasteDetected && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}

            {/* Validation indicator */}
            {state.url && !state.isValidating && !displayError && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Loading indicator */}
            {state.isValidating && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>

          {/* Error message */}
          {displayError && (
            <p 
              id="url-error" 
              className="mt-2 text-sm text-red-600 flex items-center"
              role="alert"
            >
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {displayError}
            </p>
          )}

          {/* Success message */}
          {state.url && !state.validationError && !state.isValidating && (
            <p className="mt-2 text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Valid Airbnb listing URL
            </p>
          )}
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={toggleAdvanced}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg 
                className={`w-4 h-4 mr-2 transition-transform ${state.showAdvanced ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Advanced Options
            </button>

            {state.showAdvanced && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label 
                    htmlFor="max-images" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Maximum Images to Process
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      id="max-images"
                      type="range"
                      min="1"
                      max="10"
                      value={state.maxImages}
                      onChange={(e) => handleMaxImagesChange(parseInt(e.target.value))}
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-gray-700 min-w-[2rem] text-center">
                      {state.maxImages}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Select how many images to process (1-10)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          aria-describedby={!isFormValid ? 'submit-help' : undefined}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Optimize Images</span>
            </>
          )}
        </button>

        {!isFormValid && (
          <p id="submit-help" className="text-sm text-gray-500 text-center">
            {!state.url.trim() 
              ? 'Enter a valid Airbnb listing URL to continue'
              : 'Please fix the validation errors above'
            }
          </p>
        )}
      </form>
      
      <div className="mt-6 text-sm text-gray-600">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">How it works</h4>
              <ul className="text-blue-700 space-y-1 text-xs">
                <li>• Enter any Airbnb listing URL from supported domains</li>
                <li>• We&apos;ll automatically detect and optimize up to {maxImages} images</li>
                <li>• Each image is analyzed and enhanced based on room type</li>
                <li>• Download individual images or all at once</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
