import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check for section headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Verify heading text is descriptive
    const mainHeading = page.getByRole('heading', { level: 1 });
    await expect(mainHeading).toContainText('Transform Your Airbnb Images');
  });

  test('should have proper form labels and descriptions', async ({ page }) => {
    // Check URL input has proper label
    const urlInput = page.locator('input[type="url"]');
    await expect(urlInput).toHaveAttribute('aria-label');
    
    // Check for placeholder text
    await expect(urlInput).toHaveAttribute('placeholder');
    
    // Check for form description
    await expect(page.getByText('Enter your Airbnb listing URL to get started')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test tab navigation through form elements
    await page.keyboard.press('Tab');
    await expect(urlInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Optimize Images' })).toBeFocused();
    
    // Test form submission with keyboard
    await page.keyboard.press('Enter');
    await expect(page.getByText('Please enter a valid Airbnb URL')).toBeVisible();
  });

  test('should have proper button roles and states', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: 'Optimize Images' });
    
    // Check button has proper type
    await expect(submitButton).toHaveAttribute('type', 'submit');
    
    // Check button is focusable
    await submitButton.focus();
    await expect(submitButton).toBeFocused();
    
    // Check button has proper ARIA attributes
    await expect(submitButton).toHaveAttribute('aria-label');
  });

  test('should provide clear error messages', async ({ page }) => {
    // Test invalid URL submission
    await page.fill('input[type="url"]', 'invalid-url');
    await page.click('button[type="submit"]');
    
    // Check error message is visible and descriptive
    const errorMessage = page.getByText('Please enter a valid Airbnb URL');
    await expect(errorMessage).toBeVisible();
    
    // Check error message has proper ARIA attributes
    await expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  test('should support screen readers', async ({ page }) => {
    // Check for screen reader only content
    const srOnlyElements = page.locator('.sr-only, [aria-hidden="false"]');
    await expect(srOnlyElements.first()).toBeVisible();
    
    // Check for proper landmark roles
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should have proper color contrast', async ({ page }) => {
    // Test in light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    
    // Check that text is readable
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
    
    // Test in dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    // Check that text is still readable
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    await page.goto('/');
    
    // Check that all interactive elements are visible
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
    await expect(page.locator('input[type="url"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Optimize Images' })).toBeVisible();
  });

  test('should have proper focus management', async ({ page }) => {
    // Test initial focus
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="url"]')).toBeFocused();
    
    // Test focus after form submission
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await page.click('button[type="submit"]');
    
    // Focus should move to appropriate element after submission
    // (This would depend on the actual implementation)
  });

  test('should have proper ARIA live regions for dynamic content', async ({ page }) => {
    // Mock API response to test live regions
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

    // Check for live region announcements
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeVisible();
  });

  test('should have proper form validation', async ({ page }) => {
    // Test required field validation
    await page.click('button[type="submit"]');
    await expect(page.getByText('Please enter a valid Airbnb URL')).toBeVisible();
    
    // Test URL format validation
    await page.fill('input[type="url"]', 'not-a-url');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Please enter a valid Airbnb URL')).toBeVisible();
    
    // Test valid URL
    await page.fill('input[type="url"]', 'https://www.airbnb.com/rooms/12345678');
    await expect(page.getByText('Please enter a valid Airbnb URL')).not.toBeVisible();
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Check that content is still accessible
    await expect(page.getByRole('heading', { name: 'Transform Your Airbnb Images' })).toBeVisible();
    await expect(page.locator('input[type="url"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Optimize Images' })).toBeVisible();
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Check for proper semantic elements
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="url"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check that h1 is unique
    const h1Elements = await page.locator('h1').all();
    expect(h1Elements.length).toBe(1);
  });

  test('should provide alternative text for images', async ({ page }) => {
    // Check for images with proper alt text
    const images = await page.locator('img').all();
    for (const img of images) {
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });

  test('should have proper link accessibility', async ({ page }) => {
    // Check for links with proper text
    const links = await page.locator('a').all();
    for (const link of links) {
      const linkText = await link.textContent();
      expect(linkText).toBeTruthy();
      expect(linkText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should support voice control', async ({ page }) => {
    // Test that interactive elements have proper labels for voice control
    const interactiveElements = page.locator('input, button, select, textarea');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      const accessibleName = await element.evaluate(el => {
        return el.getAttribute('aria-label') || 
               el.getAttribute('aria-labelledby') || 
               el.textContent || 
               el.getAttribute('placeholder');
      });
      expect(accessibleName).toBeTruthy();
    }
  });
});
