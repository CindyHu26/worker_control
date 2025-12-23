import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma';

let payload: any;
let response: any;
const TARGET_TAX_ID = "12345678";
const HOUSEHOLD_ID = "A123456789";

Before(async function () {
    // Cleanup shared data
    await prisma.employer.deleteMany({
        where: {
            OR: [
                { taxId: TARGET_TAX_ID },
                { code: { contains: "TEST" } },
                { companyName: "Household Test" }
            ]
        }
    });
    // Also delete by ID if needed, but TaxId/Code is safer
});

Given('我準備了一份 {string} 類型的雇主資料', function (category) {
    payload = {
        category: category, // Pass category for logic, even if schema maps it
        companyName: category === 'HOME_CARE' ? "Household Test" : "Business Test",
        code: `TEST-${Date.now()}`, // Ensure unique code
        phoneNumber: "0900000000",
        address: "Test Address"
    };

    if (category === 'MANUFACTURING') {
        payload.corporateInfo = { industryType: category };
        // Default taxId might be needed, handled in next steps
    } else if (category === 'HOME_CARE') {
        payload.individualInfo = { relationship: "Son" };
    }
});

Given('該資料不包含統編，但包含負責人身分證字號 {string}', function (idNo) {
    delete payload.taxId;
    payload.responsiblePersonIdNo = idNo;
    payload.individualInfo = { ...payload.individualInfo, responsiblePersonIdNo: idNo };
});

Given('該資料包含負責人姓名 {string}', function (name) {
    payload.responsiblePerson = name;
});

Given('該資料包含統編 {string} 和負責人 {string}', function (taxId, person) {
    payload.taxId = taxId;
    payload.responsiblePerson = person;
});

Given('該資料不包含身分證字號', function () {
    delete payload.responsiblePersonIdNo;
    if (payload.individualInfo) delete payload.individualInfo.responsiblePersonIdNo;
});

Given('該資料不包含統編', function () {
    delete payload.taxId;
});

When('我發送 POST 請求至 {string}', async function (route) {
    // Ensure payload matches API expectation (flat or nested structure?)
    // The service handles flat input mostly, mapping to nested.
    response = await request(app)
        .post(route)
        .send(payload)
        .set('Accept', 'application/json');
});

Then('回應狀態碼應為 {int}', function (statusCode) {
    // Debug output if status is 500
    if (response.status === 500) {
        console.error("Server Error:", response.body);
    }
    expect(response.status).to.equal(statusCode);
});

Then('資料庫中該雇主的 {string} 應包含身分證字號 {string}', async function (relation, idNo) {
    // We need to find the employer. Since we don't have ID, search by other unique fields or created recently?
    // Use code or check response id
    const empId = response.body.id;
    const employer = await prisma.employer.findUnique({
        where: { id: empId },
        include: { individualInfo: true }
    });

    expect(employer?.individualInfo).to.not.be.null;
    expect(employer?.individualInfo?.responsiblePersonIdNo).to.equal(idNo);
});

Then('該雇主不應有統編', async function () {
    const empId = response.body.id;
    const employer = await prisma.employer.findUnique({ where: { id: empId } });
    expect(employer?.taxId).to.be.null;
});

Then('資料庫中該雇主應有統編 {string}', async function (expectedTaxId) {
    // If response failed, this will fail.
    if (!response.body.id) {
        // Fallback verification if 201 checked previously
        const emp = await prisma.employer.findUnique({ where: { taxId: expectedTaxId } });
        expect(emp).to.not.be.null;
        return;
    }
    const empId = response.body.id;
    const employer = await prisma.employer.findUnique({ where: { id: empId } });
    expect(employer?.taxId).to.equal(expectedTaxId);
});

Then('該雇主的 {string} 不為空', async function (relation) {
    const empId = response.body.id;
    const employer = await prisma.employer.findUnique({
        where: { id: empId },
        include: { corporateInfo: true }
    });
    expect(employer?.corporateInfo).to.not.be.null;
});

Then('回應錯誤訊息應包含 {string} 或類似訊息', function (msg: string) {
    const body = response.body;
    const errorMsg = body.message || body.error || JSON.stringify(body);
    // Flexible matching
    const keywords = msg.replace("或類似訊息", "").trim().split(" ");
    const match = keywords.some((k: string) => errorMsg.includes(k));

    // Specifically check for validation messages
    if (msg.includes("Missing responsible person ID")) {
        expect(errorMsg).to.match(/responsible.*ID|Missing/i);
    } else if (msg.includes("Missing Tax ID")) {
        expect(errorMsg).to.match(/Tax.*ID|Missing/i);
    } else if (msg.includes("Tax ID already exists")) {
        expect(errorMsg).to.match(/Tax.*exist|Unique/i);
    } else {
        expect(errorMsg).to.include(msg);
    }
});
