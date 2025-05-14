import { test, expect } from '@playwright/test';

test.describe('Purchase Invoice', () => {
    test.beforeEach(async ({ page }) => {
        // Set authentication token
        await page.addInitScript(() => {
            localStorage.setItem('auth-token', 'valid-token');
        });
        await page.goto('/invoices');
        await page.waitForLoadState('networkidle');
    });

    test('shows New invoice button on invoices page', async ({ page }) => {
        await expect(page.locator('button:has-text("New invoice")')).toBeVisible();
    });

    test('clicking New invoice button opens modal with all required fields', async ({ page }) => {
        await page.click('button:has-text("New invoice")');

        // Check modal is visible
        await expect(page.locator('[data-testid="invoice-modal"]')).toBeVisible();

        // Check all required fields are present
        await expect(page.locator('#invoiceModal input[name="date"]')).toBeVisible();
        await expect(page.locator('#invoiceModal input[name="description"]')).toBeVisible();
        await expect(page.locator('#invoiceModal input[name="quantity"]')).toBeVisible();
        await expect(page.locator('#invoiceModal select[name="paymentMethod"]')).toBeVisible();
        await expect(page.locator('#invoiceModal select[name="currency"]')).toBeVisible();
        await expect(page.locator('#invoiceModal input[name="invoiceNumber"]')).toBeVisible();
        await expect(page.locator('#invoiceModal input[name="vatPercentage"]')).toBeVisible();
        await expect(page.locator('#invoiceModal input[name="price"]')).toBeVisible();

        // Check buttons are present
        await expect(page.locator('#invoiceModal button:has-text("Cancel")')).toBeVisible();
        await expect(page.locator('#invoiceModal button[type="submit"]')).toBeVisible();
    });

    test('automatically calculates sum when price and quantity are entered', async ({ page }) => {
        await page.click('button:has-text("New invoice")');

        // Fill in quantity, VAT percentage, and price
        await page.fill('#invoiceModal input[name="quantity"]', '2');
        await page.fill('#invoiceModal input[name="vatPercentage"]', '20');
        await page.fill('#invoiceModal input[name="price"]', '100');

        // Check that sum is calculated: (100 * 2) + (200 * 0.20) = 240
        await expect(page.locator('[data-testid="calculated-sum"]')).toHaveText('240.00');
    });

    test('updates sum when any calculation field changes', async ({ page }) => {
        await page.click('button:has-text("New invoice")');

        // Initial calculation
        await page.fill('#invoiceModal input[name="quantity"]', '1');
        await page.fill('#invoiceModal input[name="vatPercentage"]', '10');
        await page.fill('#invoiceModal input[name="price"]', '100');
        await expect(page.locator('[data-testid="calculated-sum"]')).toHaveText('110.00');

        // Change quantity
        await page.fill('#invoiceModal input[name="quantity"]', '3');
        await expect(page.locator('[data-testid="calculated-sum"]')).toHaveText('330.00');

        // Change VAT
        await page.fill('#invoiceModal input[name="vatPercentage"]', '25');
        await expect(page.locator('[data-testid="calculated-sum"]')).toHaveText('375.00');
    });

    test('cancel button closes modal without saving', async ({ page }) => {
        await page.click('button:has-text("New invoice")');

        // Fill some data
        await page.fill('#invoiceModal input[name="description"]', 'Test invoice');

        // Click cancel
        await page.click('#invoiceModal button:has-text("Cancel")');

        // Modal should be hidden
        await expect(page.locator('[data-testid="invoice-modal"]')).not.toBeVisible();
    });

    test('save button saves invoice and closes modal', async ({ page }) => {
        // Mock both API endpoints
        await page.route('/api/invoices', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        invoice: {
                            id: 1,
                            date: '2024-01-15',
                            description: 'Office supplies',
                            quantity: 2,
                            paymentMethod: 'credit-card',
                            currency: 'EUR',
                            invoiceNumber: 'INV-001',
                            vatPercentage: 20,
                            price: 100,
                            sum: 240
                        }
                    })
                });
            } else {
                // GET request for fetching invoices
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        invoices: [
                            {
                                id: 1,
                                date: '2024-01-15',
                                description: 'Office supplies',
                                quantity: 2,
                                paymentMethod: 'credit-card',
                                currency: 'EUR',
                                invoiceNumber: 'INV-001',
                                vatPercentage: 20,
                                price: 100,
                                sum: 240
                            }
                        ]
                    })
                });
            }
        });

        await page.click('button:has-text("New invoice")');

        // Fill all required fields
        await page.fill('#invoiceModal input[name="date"]', '2024-01-15');
        await page.fill('#invoiceModal input[name="description"]', 'Office supplies');
        await page.fill('#invoiceModal input[name="quantity"]', '2');
        await page.selectOption('#invoiceModal select[name="paymentMethod"]', 'credit-card');
        await page.selectOption('#invoiceModal select[name="currency"]', 'EUR');
        await page.fill('#invoiceModal input[name="invoiceNumber"]', 'INV-001');
        await page.fill('#invoiceModal input[name="vatPercentage"]', '20');
        await page.fill('#invoiceModal input[name="price"]', '100');

        // Click save
        await page.click('#invoiceModal button[type="submit"]');

        // Modal should be hidden
        await expect(page.locator('[data-testid="invoice-modal"]')).not.toBeVisible();

        // Wait for the page to reload content
        await page.waitForTimeout(1000);

        // Invoice should appear in the list
        await expect(page.locator('[data-testid="invoice-list"]')).toContainText('INV-001');
        await expect(page.locator('[data-testid="invoice-list"]')).toContainText('Office supplies');
    });

    test('displays created invoice in the list after saving', async ({ page }) => {
        // Mock the API responses
        await page.route('/api/invoices', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        invoice: {
                            id: 1,
                            date: '2024-01-15',
                            description: 'Test invoice',
                            quantity: 1,
                            paymentMethod: 'bank-transfer',
                            currency: 'EUR',
                            invoiceNumber: 'INV-TEST',
                            vatPercentage: 21,
                            price: 50,
                            sum: 60.50
                        }
                    })
                });
            } else {
                // GET request for fetching invoices
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        invoices: [
                            {
                                id: 1,
                                date: '2024-01-15',
                                description: 'Test invoice',
                                quantity: 1,
                                paymentMethod: 'bank-transfer',
                                currency: 'EUR',
                                invoiceNumber: 'INV-TEST',
                                vatPercentage: 21,
                                price: 50,
                                sum: 60.50
                            }
                        ]
                    })
                });
            }
        });

        await page.click('button:has-text("New invoice")');

        // Fill and save invoice
        await page.fill('#invoiceModal input[name="date"]', '2024-01-15');
        await page.fill('#invoiceModal input[name="description"]', 'Test invoice');
        await page.fill('#invoiceModal input[name="quantity"]', '1');
        await page.selectOption('#invoiceModal select[name="paymentMethod"]', 'bank-transfer');
        await page.selectOption('#invoiceModal select[name="currency"]', 'EUR');
        await page.fill('#invoiceModal input[name="invoiceNumber"]', 'INV-TEST');
        await page.fill('#invoiceModal input[name="vatPercentage"]', '21');
        await page.fill('#invoiceModal input[name="price"]', '50');

        await page.click('#invoiceModal button[type="submit"]');

        // Wait for the content to reload
        await page.waitForTimeout(1000);

        // Check that invoice appears in the list
        await expect(page.locator('[data-testid="invoice-list"]')).toContainText('INV-TEST');
        await expect(page.locator('[data-testid="invoice-list"]')).toContainText('Test invoice');
        await expect(page.locator('[data-testid="invoice-list"]')).toContainText('60.50');
    });
});