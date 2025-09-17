import { test, expect } from '@playwright/test';

test.describe('Batch API Optimization Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
  });

  test('should process multiple images using batch API', async ({ page }) => {
    // Mock the API responses for batch processing
    await page.route('**/api/v1/optimize', async (route) => {
      const request = route.request();
      const body = await request.postDataJSON();
      
      // Simulate batch processing response
      const mockResponse = {
        success: true,
        jobId: 'test-job-123',
        message: 'Optimization job started successfully with batch processing',
        data: {
          job: {
            id: 'test-job-123',
            airbnbUrl: body.airbnbUrl,
            status: 'PROCESSING',
            progress: {
              total: 5,
              completed: 0,
              failed: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: Array.from({ length: 5 }, (_, i) => ({
            id: `img-${i + 1}`,
            originalUrl: `https://example.com/image${i + 1}.jpg`,
            fileName: `image_${i + 1}.jpg`,
            roomType: 'bedroom',
            processingStatus: 'pending',
            error: null
          })),
          imagePairs: []
        }
      };
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      });
    });

    // Mock job status endpoint
    await page.route('**/api/v1/job/test-job-123', async (route) => {
      const mockJobStatus = {
        success: true,
        data: {
          job: {
            id: 'test-job-123',
            airbnbUrl: 'https://airbnb.com/rooms/123',
            status: 'COMPLETED',
            progress: {
              total: 5,
              completed: 5,
              failed: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: Array.from({ length: 5 }, (_, i) => ({
            id: `img-${i + 1}`,
            originalUrl: `https://example.com/image${i + 1}.jpg`,
            fileName: `image_${i + 1}.jpg`,
            roomType: 'bedroom',
            processingStatus: 'completed',
            error: null
          })),
          imagePairs: Array.from({ length: 5 }, (_, i) => ({
            original: {
              id: `img-${i + 1}`,
              originalUrl: `https://example.com/image${i + 1}.jpg`,
              fileName: `image_${i + 1}.jpg`,
              roomType: 'bedroom',
              processingStatus: 'completed',
              error: null
            },
            optimized: {
              id: `opt-${i + 1}`,
              originalUrl: `https://example.com/image${i + 1}.jpg`,
              fileName: `bedroom_${i + 1}.jpg`,
              roomType: 'bedroom',
              processingStatus: 'completed',
              error: null
            },
            roomType: 'bedroom',
            fileName: `bedroom_${i + 1}.jpg`,
            optimizationComment: `Enhanced bedroom: Lighting: brighten_rooms; Composition: reframe_wide_angle`
          }))
        }
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobStatus)
      });
    });

    // Test the complete flow
    await test.step('Submit optimization request', async () => {
      // Fill in the Airbnb URL
      await page.fill('[data-testid="airbnb-url-input"]', 'https://airbnb.com/rooms/123');
      
      // Set max images to 5 to trigger batch processing
      await page.fill('[data-testid="max-images-input"]', '5');
      
      // Submit the form
      await page.click('[data-testid="optimize-button"]');
      
      // Wait for the job to be created
      await expect(page.locator('[data-testid="job-status"]')).toContainText('PROCESSING');
    });

    await test.step('Verify batch processing started', async () => {
      // Check that batch processing message is displayed
      await expect(page.locator('[data-testid="batch-processing-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="batch-processing-message"]')).toContainText('Using batch processing for 5 images');
    });

    await test.step('Wait for job completion', async () => {
      // Wait for the job to complete
      await expect(page.locator('[data-testid="job-status"]')).toContainText('COMPLETED', { timeout: 10000 });
    });

    await test.step('Verify results', async () => {
      // Check that all images were processed
      const imagePairs = page.locator('[data-testid="image-pair"]');
      await expect(imagePairs).toHaveCount(5);
      
      // Check that each image pair has both original and optimized images
      for (let i = 0; i < 5; i++) {
        const imagePair = imagePairs.nth(i);
        await expect(imagePair.locator('[data-testid="original-image"]')).toBeVisible();
        await expect(imagePair.locator('[data-testid="optimized-image"]')).toBeVisible();
        await expect(imagePair.locator('[data-testid="room-type-badge"]')).toContainText('bedroom');
      }
    });

    await test.step('Verify cost savings information', async () => {
      // Check that cost savings information is displayed
      await expect(page.locator('[data-testid="cost-savings-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="cost-savings-info"]')).toContainText('50% cost savings with batch processing');
    });
  });

  test('should handle batch processing errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/v1/optimize', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BATCH_PROCESSING_FAILED',
            message: 'Batch processing failed due to API limits'
          }
        })
      });
    });

    // Submit optimization request
    await page.fill('[data-testid="airbnb-url-input"]', 'https://airbnb.com/rooms/123');
    await page.fill('[data-testid="max-images-input"]', '10');
    await page.click('[data-testid="optimize-button"]');

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Batch processing failed due to API limits');
  });

  test('should show progress updates during batch processing', async ({ page }) => {
    let progressUpdateCount = 0;
    
    // Mock job status endpoint with progressive updates
    await page.route('**/api/v1/job/test-job-123', async (route) => {
      const progressStates = [
        { completed: 0, status: 'PROCESSING' },
        { completed: 2, status: 'PROCESSING' },
        { completed: 4, status: 'PROCESSING' },
        { completed: 5, status: 'COMPLETED' }
      ];
      
      const currentState = progressStates[Math.min(progressUpdateCount, progressStates.length - 1)];
      progressUpdateCount++;
      
      const mockJobStatus = {
        success: true,
        data: {
          job: {
            id: 'test-job-123',
            status: currentState.status,
            progress: {
              total: 5,
              completed: currentState.completed,
              failed: 0
            }
          }
        }
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobStatus)
      });
    });

    // Mock initial optimization request
    await page.route('**/api/v1/optimize', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          jobId: 'test-job-123',
          message: 'Optimization job started successfully with batch processing'
        })
      });
    });

    // Submit request
    await page.fill('[data-testid="airbnb-url-input"]', 'https://airbnb.com/rooms/123');
    await page.fill('[data-testid="max-images-input"]', '5');
    await page.click('[data-testid="optimize-button"]');

    // Verify progress updates
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('[data-testid="job-status"]')).toContainText('COMPLETED', { timeout: 10000 });
    
    // Verify final progress
    await expect(page.locator('[data-testid="progress-text"]')).toContainText('5/5 completed');
  });
});
