// Global test setup
import '@testing-library/jest-dom';

// Mock environment variables
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true
});
process.env.APIFY_TOKEN = 'test-apify-token';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.RATE_LIMIT_MAX_REQUESTS = '10';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.JOB_CLEANUP_INTERVAL_MS = '3600000';
process.env.MAX_IMAGES_PER_JOB = '10';
process.env.IMAGE_PROCESSING_TIMEOUT_MS = '300000';

// Mock Next.js router
const mockRouter = {
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  push: () => Promise.resolve(true),
  pop: () => {},
  reload: () => {},
  back: () => {},
  prefetch: () => Promise.resolve(),
  beforePopState: () => {},
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
  isFallback: false,
};

// Mock Next.js navigation
const mockNextNavigation = {
  useRouter() {
    return {
      push: () => Promise.resolve(true),
      replace: () => Promise.resolve(true),
      prefetch: () => Promise.resolve(),
      back: () => {},
      forward: () => {},
      refresh: () => {},
    };
  },
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
};

// Mock fetch globally
global.fetch = () => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
} as Response);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  
  constructor() {}
  
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// Export mocks for use in tests
export { mockRouter, mockNextNavigation };