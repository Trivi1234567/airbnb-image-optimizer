import '@testing-library/jest-dom';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.APIFY_TOKEN = 'test-apify-token';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.RATE_LIMIT_MAX_REQUESTS = '5';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.JOB_CLEANUP_INTERVAL_MS = '3600000';
process.env.MAX_IMAGES_PER_JOB = '10';
process.env.IMAGE_PROCESSING_TIMEOUT_MS = '300000';

// Polyfill for setImmediate in Node.js test environment
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(callback, 0, ...args);
  };
}

if (typeof clearImmediate === 'undefined') {
  global.clearImmediate = (id) => {
    clearTimeout(id);
  };
}

// Mock logger to avoid setImmediate issues in tests
jest.mock('@/infrastructure/config/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.matchMedia (only in browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
