import { test, expect } from '@playwright/test';

test.describe('UI Batch Processing Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display batch processing indicator for large image sets', async ({ page }) => {
    // Mock the API responses for batch processing
    await page.route('**/api/v1/optimize', async (route) => {
      const request = route.request();
      const body = await request.postDataJSON();
      
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
              total: 8,
              completed: 0,
              failed: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: Array.from({ length: 8 }, (_, i) => ({
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
              total: 8,
              completed: 8,
              failed: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: Array.from({ length: 8 }, (_, i) => ({
            id: `img-${i + 1}`,
            originalUrl: `https://example.com/image${i + 1}.jpg`,
            fileName: `image_${i + 1}.jpg`,
            roomType: 'bedroom',
            processingStatus: 'completed',
            error: null
          })),
          imagePairs: Array.from({ length: 8 }, (_, i) => ({
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
    await test.step('Submit optimization request with 8 images', async () => {
      // Fill in the Airbnb URL
      await page.fill('[data-testid="airbnb-url-input"]', 'https://airbnb.com/rooms/123');
      
      // Set max images to 8 to trigger batch processing
      await page.fill('[data-testid="max-images-input"]', '8');
      
      // Submit the form
      await page.click('[data-testid="optimize-button"]');
      
      // Wait for the job to be created
      await expect(page.locator('[data-testid="job-status"]')).toContainText('PROCESSING');
    });

    await test.step('Verify batch processing indicator is displayed', async () => {
      // Check that batch processing indicator is visible
      await expect(page.locator('text=Using Batch Processing')).toBeVisible();
      await expect(page.locator('text=Processing 8 images with 50% cost savings')).toBeVisible();
    });

    await test.step('Verify batch processing status label', async () => {
      // Check that the status shows "Batch Processing Images"
      await expect(page.locator('text=Batch Processing Images')).toBeVisible();
    });

    await test.step('Wait for job completion', async () => {
      // Wait for the job to complete
      await expect(page.locator('[data-testid="job-status"]')).toContainText('COMPLETED', { timeout: 10000 });
    });

    await test.step('Verify batch processing completion message', async () => {
      // Check that batch processing completion message is displayed
      await expect(page.locator('text=Batch Processing Complete!')).toBeVisible();
      await expect(page.locator('text=All 8 images have been successfully processed and optimized using batch API (50% cost savings)')).toBeVisible();
    });

    await test.step('Verify results show batch processing indicator', async () => {
      // Check that the results section shows batch processing was used
      await expect(page.locator('text=Processed using batch API (50% cost savings)')).toBeVisible();
    });
  });

  test('should not display batch processing indicator for small image sets', async ({ page }) => {
    // Mock the API responses for individual processing
    await page.route('**/api/v1/optimize', async (route) => {
      const request = route.request();
      const body = await request.postDataJSON();
      
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
              total: 3,
              completed: 0,
              failed: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: Array.from({ length: 3 }, (_, i) => ({
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
              total: 3,
              completed: 3,
              failed: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: Array.from({ length: 3 }, (_, i) => ({
            id: `img-${i + 1}`,
            originalUrl: `https://example.com/image${i + 1}.jpg`,
            fileName: `image_${i + 1}.jpg`,
            roomType: 'bedroom',
            processingStatus: 'completed',
            error: null
          })),
          imagePairs: Array.from({ length: 3 }, (_, i) => ({
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
    await test.step('Submit optimization request with 3 images', async () => {
      // Fill in the Airbnb URL
      await page.fill('[data-testid="airbnb-url-input"]', 'https://airbnb.com/rooms/123');
      
      // Set max images to 3 (below batch threshold)
      await page.fill('[data-testid="max-images-input"]', '3');
      
      // Submit the form
      await page.click('[data-testid="optimize-button"]');
      
      // Wait for the job to be created
      await expect(page.locator('[data-testid="job-status"]')).toContainText('PROCESSING');
    });

    await test.step('Verify batch processing indicator is NOT displayed', async () => {
      // Check that batch processing indicator is not visible for small sets
      await expect(page.locator('text=Using Batch Processing')).not.toBeVisible();
      await expect(page.locator('text=Processing 3 images with 50% cost savings')).not.toBeVisible();
    });

    await test.step('Wait for job completion', async () => {
      // Wait for the job to complete
      await expect(page.locator('[data-testid="job-status"]')).toContainText('COMPLETED', { timeout: 10000 });
    });

    await test.step('Verify results do not show batch processing indicator', async () => {
      // Check that the results section does not show batch processing was used
      await expect(page.locator('text=Processed using batch API (50% cost savings)')).not.toBeVisible();
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
});
