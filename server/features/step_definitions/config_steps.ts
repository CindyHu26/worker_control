import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma';

let response: any;
let currentToken: string = '';

// Cleanup
Before({ tags: '@config' }, async function () {
    // Clean up test data
    await prisma.employee.deleteMany({
        where: { fullName: { in: ['陳小美', '王大同'] } }
    });
});

// ==========================================
// Background
// ==========================================

Given('我以管理者身份登入', function () {
    currentToken = 'admin-test-token';
});

// ==========================================
// Industry Configuration
// ==========================================

When('我批次匯入行業類別清單:', async function (dataTable) {
    const rows = dataTable.hashes();

    for (const row of rows) {
        response = await request(app)
            .post('/api/industries')
            .send({
                code: row.code,
                nameZh: row.name_zh,
                category: row.category
            })
            .set('Authorization', `Bearer ${currentToken}`)
            .set('Accept', 'application/json');
    }
});

Then('資料庫 {string} 表中應包含 {string} 與 {string}', async function (tableName, code1, code2) {
    if (tableName === 'industries') {
        const industry1 = await prisma.industry.findFirst({ where: { code: code1 } });
        const industry2 = await prisma.industry.findFirst({ where: { code: code2 } });

        expect(industry1).to.not.be.null;
        expect(industry2).to.not.be.null;
    }
});

Then('我應能為 {string} 類別設定 {string} 的核配比率規則', async function (category, ruleType) {
    // Verify quota rules can be set
    // This is a placeholder - actual implementation would test quota API
});

// ==========================================
// Application Categories
// ==========================================

When('我建立申請類別:', async function (dataTable) {
    const rows = dataTable.hashes();

    for (const row of rows) {
        response = await request(app)
            .post('/api/application-categories')
            .send({
                code: row.code,
                nameZh: row.name_zh,
                workerCategory: row.workerCategory
            })
            .set('Authorization', `Bearer ${currentToken}`)
            .set('Accept', 'application/json');
    }
});

Then('資料庫 {string} 應包含這些類別', async function (tableName) {
    // Verify categories exist - placeholder for actual table check
});

Then('每個類別應可被關聯至雇主', function () {
    // Placeholder for relationship verification
});

// ==========================================
// Employee Configuration
// ==========================================

When('我在 {string} 表中建立員工資料:', async function (tableName, dataTable) {
    const rows = dataTable.hashes();

    for (const row of rows) {
        const employeeData = {
            code: `EMP-${Date.now()}`,
            fullName: row.full_name,
            jobTitle: row.job_title,
            isBilingual: row.is_bilingual === 'true',
            isSales: row.is_sales === 'true'
        };

        response = await request(app)
            .post('/api/employees')
            .send(employeeData)
            .set('Authorization', `Bearer ${currentToken}`)
            .set('Accept', 'application/json');
    }
});

Then('該員工 {string} 應可被指派為 {string}', async function (employeeName, role) {
    const employee = await prisma.employee.findFirst({
        where: { fullName: employeeName }
    });

    expect(employee).to.not.be.null;

    // Verify the employee has the right qualifications for the role
    if (role === '移工訪視人員') {
        expect(employee?.isBilingual).to.be.true;
    } else if (role.includes('負責人')) {
        expect(employee?.isSales).to.be.true;
    }
});

// ==========================================
// Billing Items Configuration
// ==========================================

When('我建立收費項目:', async function (dataTable) {
    const rows = dataTable.hashes();

    for (const row of rows) {
        response = await request(app)
            .post('/api/billing-items')
            .send({
                code: row.code,
                nameZh: row.name_zh,
                category: row.category,
                defaultAmount: parseInt(row.defaultAmount)
            })
            .set('Authorization', `Bearer ${currentToken}`)
            .set('Accept', 'application/json');
    }
});

Then('資料庫 {string} 應包含這些項目', async function (tableName) {
    // Placeholder for verification
});

Then('這些項目應可用於計費方案', function () {
    // Placeholder for relationship verification
});

// ==========================================
// Overseas Agency Configuration
// ==========================================

When('我建立國外仲介:', async function (dataTable) {
    const rows = dataTable.hashes();

    for (const row of rows) {
        response = await request(app)
            .post('/api/agencies')
            .send({
                nameEn: row.nameEn,
                country: row.country,
                licenseNo: row.licenseNo,
                agencyType: 'OVERSEAS'
            })
            .set('Authorization', `Bearer ${currentToken}`)
            .set('Accept', 'application/json');
    }
});

Then('資料庫 {string} 應包含這些仲介', async function (tableName) {
    // Placeholder for verification
});

Then('這些仲介應可被關聯至招募訂單', function () {
    // Placeholder for relationship verification
});
