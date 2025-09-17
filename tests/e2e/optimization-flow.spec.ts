import { test, expect, Page } from '@playwright/test';

test.describe('Airbnb Image Optimization Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the landing page correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
    await expect(page.getByPlaceholder('https://www.airbnb.com/rooms/12345678')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Optimize Images' })).toBeVisible();
  });

  test('should validate Airbnb URL input', async ({ page }) => {
    // Test invalid URL
    await page.fill('input[type="url"]', 'https://example.com');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('Please enter a valid Airbnb URL')).toBeVisible();
    
    // Test valid Airbnb URL
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await expect(page.getByText('Please enter a valid Airbnb URL')).not.toBeVisible();
  });

  test('should handle form submission', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/v1/optimize', async route => {
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
              progress: { total: 0, completed: 0, failed: 0 },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            images: [],
            imagePairs: []
          }
        })
      });
    });

    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Should show loading state
    await expect(page.getByText('Processing...')).toBeVisible();
    
    // Should eventually show results (mocked)
    await expect(page.getByText('Optimization Results')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/optimize', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid URL format'
          },
          timestamp: new Date().toISOString()
        })
      });
    });

    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Invalid URL format')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
    await expect(page.getByPlaceholder('https://www.airbnb.com/rooms/12345678')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Optimize Images' })).toBeVisible();
  });
});

test.describe('Complete User Journey', () => {
  test('should complete full optimization flow from URL submission to download', async ({ page }) => {
    // Mock the complete flow
    await mockOptimizationFlow(page);

    // Navigate to the page
    await page.goto('/');

    // Submit a valid Airbnb URL
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Wait for processing to start
    await expect(page.getByText('Processing...')).toBeVisible();

    // Wait for progress updates
    await expect(page.getByText('Scraping images...')).toBeVisible();
    await expect(page.getByText('Analyzing images...')).toBeVisible();
    await expect(page.getByText('Optimizing images...')).toBeVisible();

    // Wait for completion
    await expect(page.getByText('Optimization Complete!')).toBeVisible();

    // Verify results display
    await expect(page.getByText('Before & After Comparison')).toBeVisible();
    await expect(page.locator('[data-testid="image-comparison"]')).toHaveCount(3);

    // Test individual image download
    await page.click('[data-testid="download-single"][data-image-id="img1"]');
    // Verify download was triggered (in real test, would check for file download)

    // Test download all images
    await page.click('[data-testid="download-all"]');
    // Verify ZIP download was triggered
  });

  test('should handle partial failures gracefully', async ({ page }) => {
    // Mock partial failure scenario
    await mockPartialFailureFlow(page);

    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Wait for processing
    await expect(page.getByText('Processing...')).toBeVisible();
    await expect(page.getByText('Optimization Complete!')).toBeVisible();

    // Verify partial results
    await expect(page.getByText('2 of 3 images processed successfully')).toBeVisible();
    await expect(page.locator('[data-testid="image-comparison"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="failed-image"]')).toHaveCount(1);
  });

  test('should handle complete failure gracefully', async ({ page }) => {
    // Mock complete failure
    await mockCompleteFailureFlow(page);

    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    // Wait for failure
    await expect(page.getByText('Optimization Failed')).toBeVisible();
    await expect(page.getByText('Unable to process this listing. Please try again.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });
});

test.describe('Error Scenarios', () => {
  test('should handle invalid URL format', async ({ page }) => {
    await page.goto('/');
    
    // Test various invalid URLs
    const invalidUrls = [
      'not-a-url',
      'https://example.com',
      'https://booking.com/rooms/123',
      'ftp://www.airbnb.com/rooms/123'
    ];

    for (const url of invalidUrls) {
      await page.fill('input[type="url"]', url);
      await page.click('button[type="submit"]');
      await expect(page.getByText('Please enter a valid Airbnb URL')).toBeVisible();
      await page.fill('input[type="url"]', '');
    }
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network error
    await page.route('**/api/v1/optimize', async route => {
      await route.abort('Failed');
    });

    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Network error. Please check your connection.')).toBeVisible();
  });

  test('should handle server errors', async ({ page }) => {
    // Mock server error
    await page.route('**/api/v1/optimize', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong on our end'
          }
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Server error. Please try again later.')).toBeVisible();
  });

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limit error
    await page.route('**/api/v1/optimize', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please wait before trying again.',
            retryAfter: 60
          }
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Too many requests. Please wait 60 seconds before trying again.')).toBeVisible();
  });

  test('should handle authentication errors', async ({ page }) => {
    // Mock auth error
    await page.route('**/api/v1/optimize', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Authentication required. Please refresh the page.')).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('should load initial page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
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
});

test.describe('Accessibility Tests', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="url"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Optimize Images' })).toBeFocused();

    // Test form submission with keyboard
    await page.keyboard.press('Enter');
    await expect(page.getByText('Please enter a valid Airbnb URL')).toBeVisible();
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading structure
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check form labels
    const urlInput = page.locator('input[type="url"]');
    await expect(urlInput).toHaveAttribute('aria-label', 'Airbnb listing URL');
    
    // Check button accessibility
    const submitButton = page.getByRole('button', { name: 'Optimize Images' });
    await expect(submitButton).toHaveAttribute('type', 'submit');
  });

  test('should work with screen reader', async ({ page }) => {
    await page.goto('/');

    // Check for screen reader accessible content
    await expect(page.getByText('Transform Your Airbnb Images')).toBeVisible();
    await expect(page.getByText('Enter your Airbnb listing URL to get started')).toBeVisible();
    
    // Check form validation messages are accessible
    await page.fill('input[type="url"]', 'invalid-url');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Please enter a valid Airbnb URL')).toBeVisible();
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    // Check that content is still visible and readable
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
    await expect(page.getByPlaceholder('https://www.airbnb.com/rooms/12345678')).toBeVisible();
  });
});

// Helper functions for mocking API responses
async function mockOptimizationFlow(page: Page) {
  // Mock initial optimization request
  await page.route('**/api/v1/optimize', async route => {
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

  // Mock job status polling
  let pollCount = 0;
  await page.route('**/api/v1/job/test-job-id', async route => {
    pollCount++;
    
    if (pollCount === 1) {
      // First poll - scraping
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            jobId: 'test-job-id',
            status: 'scraping',
            progress: { total: 3, completed: 0, failed: 0 },
            images: [],
            imagePairs: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
    } else if (pollCount === 2) {
      // Second poll - processing
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            jobId: 'test-job-id',
            status: 'processing',
            progress: { total: 3, completed: 1, failed: 0 },
            images: [],
            imagePairs: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
    } else {
      // Final poll - completed
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
            imagePairs: [
              {
                original: { id: 'img1', originalUrl: 'https://example.com/img1.jpg', originalBase64: 'base64_original_1', optimizedBase64: null, fileName: 'image_1.jpg', roomType: 'bedroom', processingStatus: 'completed', error: null },
                optimized: { id: 'img1-opt', originalUrl: 'https://example.com/img1.jpg', originalBase64: 'base64_original_1', optimizedBase64: 'base64_optimized_1', fileName: 'bedroom_1.jpg', roomType: 'bedroom', processingStatus: 'completed', error: null },
                roomType: 'bedroom',
                fileName: 'bedroom_1.jpg'
              },
              {
                original: { id: 'img2', originalUrl: 'https://example.com/img2.jpg', originalBase64: 'base64_original_2', optimizedBase64: null, fileName: 'image_2.jpg', roomType: 'kitchen', processingStatus: 'completed', error: null },
                optimized: { id: 'img2-opt', originalUrl: 'https://example.com/img2.jpg', originalBase64: 'base64_original_2', optimizedBase64: 'base64_optimized_2', fileName: 'kitchen_2.jpg', roomType: 'kitchen', processingStatus: 'completed', error: null },
                roomType: 'kitchen',
                fileName: 'kitchen_2.jpg'
              },
              {
                original: { id: 'img3', originalUrl: 'https://example.com/img3.jpg', originalBase64: 'base64_original_3', optimizedBase64: null, fileName: 'image_3.jpg', roomType: 'living_room', processingStatus: 'completed', error: null },
                optimized: { id: 'img3-opt', originalUrl: 'https://example.com/img3.jpg', originalBase64: 'base64_original_3', optimizedBase64: 'base64_optimized_3', fileName: 'living_room_3.jpg', roomType: 'living_room', processingStatus: 'completed', error: null },
                roomType: 'living_room',
                fileName: 'living_room_3.jpg'
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
    }
  });
}

async function mockPartialFailureFlow(page: Page) {
  await page.route('**/api/v1/optimize', async route => {
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

  await page.route('**/api/v1/job/test-job-id', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          jobId: 'test-job-id',
          status: 'completed',
          progress: { total: 3, completed: 2, failed: 1 },
          images: [],
          imagePairs: [
            {
              original: { id: 'img1', originalUrl: 'https://example.com/img1.jpg', fileName: 'image_1.jpg', roomType: 'bedroom', processingStatus: 'completed', error: null },
              optimized: { id: 'img1-opt', originalUrl: 'https://example.com/img1.jpg', fileName: 'bedroom_1.jpg', roomType: 'bedroom', processingStatus: 'completed', error: null },
              roomType: 'bedroom',
              fileName: 'bedroom_1.jpg'
            },
            {
              original: { id: 'img2', originalUrl: 'https://example.com/img2.jpg', fileName: 'image_2.jpg', roomType: 'kitchen', processingStatus: 'completed', error: null },
              optimized: { id: 'img2-opt', originalUrl: 'https://example.com/img2.jpg', fileName: 'kitchen_2.jpg', roomType: 'kitchen', processingStatus: 'completed', error: null },
              roomType: 'kitchen',
              fileName: 'kitchen_2.jpg'
            },
            {
              original: { id: 'img3', originalUrl: 'https://example.com/img3.jpg', fileName: 'image_3.jpg', roomType: 'other', processingStatus: 'failed', error: 'Processing failed' },
              roomType: 'other',
              fileName: 'image_3.jpg'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    });
  });
}

async function mockCompleteFailureFlow(page: Page) {
  await page.route('**/api/v1/optimize', async route => {
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
            progress: { total: 0, completed: 0, failed: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: [],
          imagePairs: []
        }
      })
    });
  });

  await page.route('**/api/v1/job/test-job-id', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          jobId: 'test-job-id',
          status: 'failed',
          progress: { total: 0, completed: 0, failed: 0 },
          images: [],
          imagePairs: [],
          error: 'Unable to process this listing. Please try again.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    });
  });
}

async function mockLargeImageProcessing(page: Page) {
  await page.route('**/api/v1/optimize', async route => {
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

  await page.route('**/api/v1/job/test-job-id', async route => {
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
          imagePairs: Array.from({ length: 10 }, (_, i) => ({
            original: { id: `img${i+1}`, originalUrl: `https://example.com/img${i+1}.jpg`, originalBase64: `base64_original_${i+1}`, optimizedBase64: null, fileName: `image_${i+1}.jpg`, roomType: 'bedroom', processingStatus: 'completed', error: null },
            optimized: { id: `img${i+1}-opt`, originalUrl: `https://example.com/img${i+1}.jpg`, originalBase64: `base64_original_${i+1}`, optimizedBase64: `base64_optimized_${i+1}`, fileName: `bedroom_${i+1}.jpg`, roomType: 'bedroom', processingStatus: 'completed', error: null },
            roomType: 'bedroom',
            fileName: `bedroom_${i+1}.jpg`
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    });
  });
}
