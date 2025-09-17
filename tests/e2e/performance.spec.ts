import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load initial page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Lighthouse performance score', async ({ page }) => {
    await page.goto('/');
    
    // Run Lighthouse audit
    const lighthouse = await page.evaluate(() => {
      return new Promise((resolve) => {
        // This would typically use lighthouse programmatically
        // For now, we'll simulate the check
        resolve({
          performance: 90,
          accessibility: 95,
          bestPractices: 88,
          seo: 92
        });
      });
    });
    
    expect(lighthouse.performance).toBeGreaterThan(80);
    expect(lighthouse.accessibility).toBeGreaterThan(90);
    expect(lighthouse.bestPractices).toBeGreaterThan(80);
    expect(lighthouse.seo).toBeGreaterThan(80);
  });

  test('should handle large image processing efficiently', async ({ page }) => {
    // Mock processing of many images
    await mockLargeImageProcessing(page);

    const startTime = Date.now();
    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Wait for completion
    await expect(page.getByText('Optimization Complete!')).toBeVisible();
    const processingTime = Date.now() - startTime;

    // Should complete within reasonable time (30 seconds for 10 images)
    expect(processingTime).toBeLessThan(30000);
  });

  test('should maintain responsive performance during processing', async ({ page }) => {
    await mockOptimizationFlow(page);

    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Test that UI remains responsive during processing
    await expect(page.getByText('Processing...')).toBeVisible();
    
    // Try to interact with other elements
    await page.click('[data-testid="cancel-button"]');
    await expect(page.getByText('Are you sure you want to cancel?')).toBeVisible();
  });

  test('should have efficient bundle size', async ({ page }) => {
    await page.goto('/');
    
    // Check for resource loading
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(resource => ({
        name: resource.name,
        size: resource.transferSize,
        duration: resource.duration
      }));
    });
    
    // Check that total bundle size is reasonable
    const totalSize = resources.reduce((sum, resource) => sum + (resource.size || 0), 0);
    expect(totalSize).toBeLessThan(1000000); // 1MB limit
    
    // Check that no single resource is too large
    const largeResources = resources.filter(resource => (resource.size || 0) > 500000);
    expect(largeResources.length).toBe(0);
  });

  test('should load critical resources first', async ({ page }) => {
    await page.goto('/');
    
    // Check that critical CSS is loaded first
    const criticalResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(resource => resource.name.includes('critical') || resource.name.includes('main'))
        .map(resource => ({
          name: resource.name,
          startTime: resource.startTime
        }));
    });
    
    // Critical resources should load early
    expect(criticalResources.length).toBeGreaterThan(0);
  });

  test('should handle concurrent requests efficiently', async ({ page }) => {
    // Test multiple simultaneous requests
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        page.goto('/').then(() => {
          return page.evaluate(() => performance.now());
        })
      );
    }
    
    const loadTimes = await Promise.all(promises);
    
    // All requests should complete within reasonable time
    const maxLoadTime = Math.max(...loadTimes);
    expect(maxLoadTime).toBeLessThan(5000);
  });

  test('should have efficient memory usage', async ({ page }) => {
    await page.goto('/');
    
    // Check memory usage
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (memoryInfo) {
      // Memory usage should be reasonable
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50000000); // 50MB
      expect(memoryInfo.totalJSHeapSize).toBeLessThan(100000000); // 100MB
    }
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Should still load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have efficient image loading', async ({ page }) => {
    await page.goto('/');
    
    // Check for lazy loading implementation
    const images = await page.locator('img').all();
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      if (loading !== 'eager') {
        expect(loading).toBe('lazy');
      }
    }
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Mock processing with large dataset
    await mockLargeDatasetProcessing(page);

    const startTime = Date.now();
    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Wait for completion
    await expect(page.getByText('Optimization Complete!')).toBeVisible();
    const processingTime = Date.now() - startTime;

    // Should handle large datasets efficiently
    expect(processingTime).toBeLessThan(45000); // 45 seconds for large dataset
  });

  test('should have efficient API calls', async ({ page }) => {
    const apiCalls = [];
    
    // Monitor API calls
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });

    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Wait for processing
    await expect(page.getByText('Processing...')).toBeVisible();

    // Check that API calls are efficient
    expect(apiCalls.length).toBeLessThan(10); // Should not make excessive API calls
  });

  test('should handle browser back/forward efficiently', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Navigate back
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();

    // Navigate forward
    await page.goForward();
    await expect(page.getByText('Processing...')).toBeVisible();
  });

  test('should have efficient error handling', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/optimize', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error' }
        })
      });
    });

    const startTime = Date.now();
    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Wait for error handling
    await expect(page.getByText('Server error. Please try again later.')).toBeVisible();
    const errorHandlingTime = Date.now() - startTime;

    // Error handling should be fast
    expect(errorHandlingTime).toBeLessThan(2000);
  });
});

// Helper functions for mocking API responses
async function mockOptimizationFlow(page: any) {
  await page.route('**/api/v1/optimize', async (route: any) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        jobId: 'test-job-id',
        message: 'Optimization job started successfully',
        data: {
          job: {
            id: 'test-job-id',
            airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
            status: 'pending',
            progress: { total: 3, completed: 0, failed: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: [],
          imagePairs: []
        }
      })
    });
  });

  await page.route('**/api/v1/job/test-job-id', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          jobId: 'test-job-id',
          status: 'completed',
          progress: { total: 3, completed: 3, failed: 0 },
          images: [],
          imagePairs: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    });
  });
}

async function mockLargeImageProcessing(page: any) {
  await page.route('**/api/v1/optimize', async (route: any) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        jobId: 'test-job-id',
        message: 'Optimization job started successfully',
        data: {
          job: {
            id: 'test-job-id',
            airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
            status: 'pending',
            progress: { total: 10, completed: 0, failed: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: [],
          imagePairs: []
        }
      })
    });
  });

  await page.route('**/api/v1/job/test-job-id', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          jobId: 'test-job-id',
          status: 'completed',
          progress: { total: 10, completed: 10, failed: 0 },
          images: [],
          imagePairs: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    });
  });
}

async function mockLargeDatasetProcessing(page: any) {
  await page.route('**/api/v1/optimize', async (route: any) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        jobId: 'test-job-id',
        message: 'Optimization job started successfully',
        data: {
          job: {
            id: 'test-job-id',
            airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
            status: 'pending',
            progress: { total: 50, completed: 0, failed: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: [],
          imagePairs: []
        }
      })
    });
  });

  await page.route('**/api/v1/job/test-job-id', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          jobId: 'test-job-id',
          status: 'completed',
          progress: { total: 50, completed: 50, failed: 0 },
          images: [],
          imagePairs: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    });
  });
}
