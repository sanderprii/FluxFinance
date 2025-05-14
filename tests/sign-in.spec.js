import { test, expect } from '@playwright/test';

test.describe('Sign In', () => {

    test('unauthenticated visitor on protected URL shows sign-in form', async ({ page }) => {
        // Külasta kaitstud URL-i
        await page.goto('/invoices');

        // Oota, et lehekülg laadiks
        await page.waitForLoadState('networkidle');

        // Kontrolli, et URL jääb samaks
        expect(page.url()).toBe('http://localhost:3000/invoices');

        // Kontrolli, et sign-in vorm kuvatakse
        await expect(page.locator('[data-testid="sign-in-form"]')).toBeVisible();
        await expect(page.locator('#signInOverlay input[name="email"]')).toBeVisible();
        await expect(page.locator('#signInOverlay input[name="password"]')).toBeVisible();
        await expect(page.locator('#signInOverlay button[type="submit"]')).toBeVisible();
    });

    test('can enter email and password and submit form via AJAX', async ({ page }) => {
        await page.goto('/invoices');
        await page.waitForLoadState('networkidle');

        // Täida email ja parool
        await page.fill('#signInOverlay input[name="email"]', 'test@example.com');
        await page.fill('#signInOverlay input[name="password"]', 'testpassword');

        // Kontrolli, et submit nupp on aktiivne
        await expect(page.locator('#signInOverlay button[type="submit"]')).toBeEnabled();

        // Jälgi AJAX päringut
        const responsePromise = page.waitForResponse('/api/sign-in');

        // Esita vorm
        await page.click('#signInOverlay button[type="submit"]');

        // Oota vastust
        const response = await responsePromise;
        expect(response.status()).toBeGreaterThanOrEqual(200);
    });

    test('shows error message for invalid credentials', async ({ page }) => {
        await page.goto('/invoices');
        await page.waitForLoadState('networkidle');

        // Sisesta vale aga kehtiv e-mail ja parool
        await page.fill('#signInOverlay input[name="email"]', 'wrong@example.com');
        await page.fill('#signInOverlay input[name="password"]', 'wrongpassword');

        // Setup response listener ENNE klicki
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/api/sign-in')
        );

        // Esita vorm
        await page.click('#signInOverlay button[type="submit"]');

        // Oota API vastust
        const response = await responsePromise;
        expect(response.status()).toBe(401);

        // Kontrolli veateadet
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).toHaveText('Email or password is incorrect');
    });
    test('authenticated user accesses protected URL directly', async ({ page }) => {
        // Simuleeri autentimist (küpsis või session storage)
        await page.addInitScript(() => {
            localStorage.setItem('auth-token', 'valid-token');
        });

        // Mine kaitstud URL-ile
        await page.goto('/invoices');

        // Oota, et JavaScript töötleks localStorage'i
        await page.waitForTimeout(200);

        // Kontrolli, et sign-in vorm ei kuvata
        await expect(page.locator('[data-testid="sign-in-form"]')).not.toBeVisible();

        // Kontrolli, et lehekülg kuvatakse
        await expect(page.locator('h1')).toContainText('Invoice');
    });

    test('sign-in form is keyboard navigable and accessible', async ({ page }) => {
        await page.goto('/invoices');
        await page.waitForLoadState('networkidle');

        // Tab navigeerimine - kasutan täpsemaid selectoreid
        await page.keyboard.press('Tab');
        await expect(page.locator('#signInOverlay input[name="email"]')).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(page.locator('#signInOverlay input[name="password"]')).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(page.locator('#signInOverlay button[type="submit"]')).toBeFocused();

        // Kontrolli label-eid
        await expect(page.locator('#signInOverlay label[for="email"]')).toBeVisible();
        await expect(page.locator('#signInOverlay label[for="password"]')).toBeVisible();

        // Kontrolli aria-label-eid või aria-describedby-d
        await expect(page.locator('#signInOverlay input[name="email"]')).toHaveAttribute('aria-label');
        await expect(page.locator('#signInOverlay input[name="password"]')).toHaveAttribute('aria-label');
    });

    test('successful sign-in refreshes page and shows protected content', async ({ page }) => {
        // Mock successful API response
        await page.route('/api/sign-in', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, token: 'valid-token' })
            });
        });

        await page.goto('/invoices');
        await page.waitForLoadState('networkidle');

        // Sisesta õiged andmed
        await page.fill('#signInOverlay input[name="email"]', 'test@example.com');
        await page.fill('#signInOverlay input[name="password"]', 'testpassword');

        // Submit vorm
        await page.click('#signInOverlay button[type="submit"]');

        // Oota lehekülge värskendamist
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(200);

        // Kontrolli, et sign-in vorm on peidetud
        await expect(page.locator('[data-testid="sign-in-form"]')).not.toBeVisible();

        // Kontrolli, et kaitstud sisu kuvatakse
        await expect(page.locator('h1')).toContainText('Invoice');

        // Kontrolli, et URL jääb samaks
        expect(page.url()).toBe('http://localhost:3000/invoices');
    });
});