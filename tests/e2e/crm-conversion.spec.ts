
import { test, expect } from '@playwright/test';
import prisma from '../../server/src/prisma';

/**
 * VISUAL UI VERIFICATION: Lead to Employer Conversion (Modal Flow)
 * 
 * Objective: Verify the "Convert to Employer" button works in the UI.
 * Notes: The UI uses a Modal for direct conversion, NOT a redirect to /employers/new.
 * This test verifies the Modal flow.
 */

const TEST_TIMESTAMP = Date.now();
const TAX_ID = `T${TEST_TIMESTAMP.toString().slice(-7)}`;
const LEAD_NAME = `Visual Test Co ${TEST_TIMESTAMP}`;

let leadId: string;

// Visual Mode: 1 second delay per action
test.use({ launchOptions: { slowMo: 1000 } });

test.describe('UI Conversion Workflow', () => {
    test.setTimeout(120000); // Increase timeout for visual mode

    test.beforeAll(async () => {
        // Seed a Lead to interact with
        const lead = await prisma.lead.create({
            data: {
                companyName: LEAD_NAME,
                contactPerson: 'UI Tester',
                status: 'NEGOTIATING',
                phone: '0900000000',
                address: '123 Visual St',
                email: 'ui@test.com'
            }
        });
        leadId = lead.id;
        console.log(`[Setup] Seeded Lead: ${leadId}`);
    });

    test.afterAll(async () => {
        // Cleanup based on naming convention
        await prisma.lead.deleteMany({ where: { companyName: LEAD_NAME } });
        await prisma.employer.deleteMany({ where: { taxId: TAX_ID } });
        await prisma.$disconnect();
    });

    test('Visual Flow: Login -> Convert Lead', async ({ page }) => {

        // ============================================================
        // 1. Login
        // ============================================================
        console.log('Navigating to login...');
        await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'domcontentloaded' });

        // Interact with Login Form
        await page.getByLabel('帳號 (Username)').fill('admin'); // Using generic admin
        await page.getByLabel('密碼 (Password)').fill('change_me'); // Generic pass
        console.log('Submitting login...');
        await page.getByRole('button', { name: '登入' }).click();

        // Verify Login Success (Redirect to Board)
        await expect(page).toHaveURL(/\/crm\/board/);
        await expect(page.getByText('Business Development')).toBeVisible();
        console.log('Login successful.');

        // ============================================================
        // 2. Navigate to Specific Lead
        // ============================================================
        console.log(`Navigating to lead ${leadId}...`);
        await page.goto(`http://127.0.0.1:3000/crm/leads/${leadId}`, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(LEAD_NAME)).toBeVisible();
        console.log('Lead page loaded.');

        // ============================================================
        // 3. Open Conversion Modal
        // ============================================================
        const convertBtn = page.getByRole('button', { name: /轉為正式客戶/i });
        await expect(convertBtn).toBeVisible();
        console.log('Clicking convert button...');
        await convertBtn.click();

        // Verify Modal
        await expect(page.getByText('轉為正式客戶')).toBeVisible();
        // Check Address Prefill
        await expect(page.getByPlaceholder('輸入公司登記地址')).toHaveValue('123 Visual St');
        console.log('Modal opened.');

        // ============================================================
        // 4. Fill Modal Form
        // ============================================================
        console.log('Filling form...');

        // Tax ID
        await page.getByPlaceholder('例如：12345678').fill(TAX_ID);

        // Industry -> Manufacturing (01)
        await page.locator('select').filter({ hasText: '產業別' }).selectOption('01');

        // Factory Info (appears for Manufacturing)
        await page.getByPlaceholder('輸入工廠登記地址').fill('123 Visual Factory');
        await page.getByPlaceholder('e.g. 125').fill('50'); // Worker Count

        // Allocation Rate
        await page.locator('select').filter({ hasText: '核配比率' }).selectOption('0.15');

        // ============================================================
        // 5. Submit & Verify
        // ============================================================
        console.log('Submitting conversion...');
        await page.getByRole('button', { name: '確認轉換 (Confirm)' }).click();

        // Redirect to Employer Page
        await expect(page).toHaveURL(/\/employers\//);

        // Validate Data on Employer Page (Visual Check)
        await expect(page.getByText(LEAD_NAME)).toBeVisible();
        await expect(page.getByText(TAX_ID)).toBeVisible();
    });
});
