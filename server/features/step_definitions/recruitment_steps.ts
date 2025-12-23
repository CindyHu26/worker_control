import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'chai';
import prisma from '../../src/prisma';
import { recruitmentService } from '../../src/services/recruitmentService';

let employerId: string;
let executionResult: any;
let error: any;
let inputData: any;

Before(async function () {
    // Cleanup
    await prisma.employerRecruitmentLetter.deleteMany({
        where: { letterNumber: { contains: "勞職許字第" } }
    });
    await prisma.employer.deleteMany({
        where: { companyName: "台積電" }
    });
});

Given('雇主 {string} 目前名額為 {int}', async function (name, quota) {
    const emp = await prisma.employer.create({
        data: {
            companyName: name,
            taxId: "12345678", // Dummy
            totalQuota: quota
        }
    });
    employerId = emp.id;
});

Given('系統已存在文號 {string} 的招募函', async function (letterNo) {
    const emp = await prisma.employer.create({
        data: {
            companyName: "Duplicate Test Corp",
            taxId: "87654321",
            totalQuota: 0
        }
    });
    employerId = emp.id;

    await prisma.employerRecruitmentLetter.create({
        data: {
            employerId: emp.id,
            letterNumber: letterNo,
            issueDate: new Date(),
            expiryDate: new Date(),
            validUntil: new Date(),
            approvedQuota: 1
        }
    });
});

When('登錄一張 {string}，文號 {string}，核准人數 {int} 人，發文日 {string}', async function (type, letterNo, count, dateStr) {
    inputData = {
        employerId,
        letterNumber: letterNo,
        issueDate: dateStr,
        approvedQuota: count,
        recruitmentType: type === "初次招募許可函" ? "INITIAL" : "REISSUE", // Mapping map logic
        // Validity is handled by service mostly? Or input
    };

    try {
        executionResult = await recruitmentService.createRecruitmentLetter(inputData);
    } catch (e) {
        error = e;
    }
});

When('再次嘗試登錄相同文號', async function () {
    try {
        await recruitmentService.createRecruitmentLetter({
            employerId,
            letterNumber: "勞職許字第112001號", // Same as Scenario 2
            issueDate: "2024-01-01",
            approvedQuota: 1,
            expiryDate: "2024-01-01" // Dummy
        });
    } catch (e) {
        error = e;
    }
});

When('登錄招募函，類別為 {string}，發文日 {string}', async function (type, dateStr) {
    // Re-create generic employer if needed or use existing
    if (!employerId) {
        const emp = await prisma.employer.create({ data: { companyName: "Validity Test", taxId: "99999999" } });
        employerId = emp.id;
    }

    inputData = {
        employerId,
        letterNumber: `VALIDITY-TEST-${Date.now()}`,
        issueDate: dateStr,
        approvedQuota: 1,
        recruitmentType: type === "初次招募" ? "INITIAL" : "OTHER"
    };

    try {
        executionResult = await recruitmentService.createRecruitmentLetter(inputData);
    } catch (e) {
        error = e;
    }
});


Then('系統應儲存該函文', async function () {
    expect(error).to.be.undefined;
    expect(executionResult).to.not.be.undefined;
    const stored = await prisma.employerRecruitmentLetter.findUnique({
        where: { id: executionResult.id }
    });
    expect(stored).to.not.be.null;
});

Then('雇主的 {string} 應自動更新為 {int}', async function (field, value) {
    const emp = await prisma.employer.findUnique({ where: { id: employerId } });
    expect(emp?.totalQuota).to.equal(value);
});

Then('系統應回傳 {string} 錯誤', function (errCode) {
    expect(error).to.not.be.undefined;
    expect(error.message).to.include(errCode);
});

Then('系統應自動設定失效日期 為 {string}', function (dateStr) {
    // ValidUntil check
    const expected = new Date(dateStr).toISOString().split('T')[0];
    const actual = new Date(executionResult.validUntil).toISOString().split('T')[0];
    expect(actual).to.equal(expected);
});
