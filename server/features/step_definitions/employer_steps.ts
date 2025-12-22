import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app'; // Make sure this path is correct based on where app.ts is
import prisma from '../../src/prisma';

let payload: any;
let response: any;
const TARGET_TAX_ID = "12345678";

Given('我準備了一份完整的雇主資料 JSON', async function () {
    // Cleanup first
    await prisma.employer.deleteMany({
        where: { taxId: TARGET_TAX_ID }
    });

    payload = {
        companyName: "Tech Corp",
        taxId: TARGET_TAX_ID,
        code: "EMP-TEST-001",
        responsiblePerson: "John Doe",
        phoneNumber: "0912345678",
        email: "tech@example.com",
        address: "Taipei City",
        corporateInfo: {
            industryType: "IT Services",
            capital: 5000000,
            factoryAddress: "Taipei Neihu"
        },
        individualInfo: {
            responsiblePersonIdNo: "A123456789",
            englishName: "John Doe En"
        }
    };
});

Given('該資料包含公司基本資訊 {string} 和統編 {string}', function (name, taxId) {
    payload.companyName = name;
    payload.taxId = taxId;
});

Given('該資料包含負責人資訊 {string}', function (person) {
    payload.responsiblePerson = person;
});

Given('該資料包含詳細的 CorporateInfo 與 IndividualInfo', function () {
    // Already set in initial payload, ensuring it's there
    if (!payload.corporateInfo) payload.corporateInfo = { industryType: "Test" };
    if (!payload.individualInfo) payload.individualInfo = { responsiblePersonIdNo: "A111111111" };
});

Given('資料庫中已存在統編為 {string} 的雇主', async function (taxId) {
    // Ensure it exists
    const existing = await prisma.employer.findUnique({ where: { taxId } });
    if (!existing) {
        await prisma.employer.create({
            data: {
                companyName: "Existing Corp",
                taxId: taxId,
                code: "EXIST-001"
            }
        });
    }
});

When('我發送 POST 請求至 {string}', async function (route) {
    response = await request(app)
        .post(route)
        .send(payload)
        .set('Accept', 'application/json');
});

When('我再次使用相同統編發送 POST 請求至 {string}', async function (route) {
    // Create a payload with the same Tax ID but different code to isolate Tax ID error
    payload = {
        companyName: "Duplicate Corp",
        taxId: TARGET_TAX_ID,
        code: "EMP-TEST-002", // Different code
        responsiblePerson: "Jane Doe"
    };
    response = await request(app)
        .post(route)
        .send(payload);
});

Then('回應狀態碼應為 {int}', function (statusCode) {
    expect(response.status).to.equal(statusCode);
});

Then('回應資料應包含 {string} 欄位', function (field) {
    expect(response.body).to.have.property(field);
});

Then('資料庫中應能找到統編為 {string} 的雇主', async function (taxId) {
    const employer = await prisma.employer.findUnique({ where: { taxId } });
    expect(employer).to.not.be.null;
    expect(employer?.companyName).to.equal(payload.companyName);
});

Then('該雇主的 {string} 也不為空', async function (relation) {
    const taxId = payload.taxId;
    const employer = await prisma.employer.findUnique({
        where: { taxId },
        include: { corporateInfo: true, individualInfo: true } // extend if relation is 'individualInfo'
    });

    // Check based on relation name mapping
    // Note: step says "corporateInfo" literally
    if (relation === 'corporateInfo') {
        expect(employer?.corporateInfo).to.not.be.null;
    } else if (relation === 'individualInfo') {
        expect(employer?.individualInfo).to.not.be.null;
    }
});

Then('回應錯誤訊息應包含 {string} 或類似訊息', function (msg) {
    // Handle Prism error message structure or App error structure
    const body = response.body;
    // Assuming structure { error: "...", message: "..." } or just body is message?
    // Often validation errors are in body.message or body.error
    const errorMsg = body.message || body.error || JSON.stringify(body);
    expect(errorMsg).to.include(msg.split(' ')[0]); // Check partial match logic if needed, e.g. "Tax ID already exists"
    // The prompt requested validation of 'Tax ID already exists'
    if (msg.includes("Tax ID")) {
        // Loose check
        expect(JSON.stringify(body)).to.match(/Tax.*exist|Unique/i);
    }
});
