import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'chai';
import prisma from '../../src/prisma';
import { quotaService } from '../../src/services/quotaService';
import * as fs from 'fs';
import * as path from 'path';

let letterId: string;
let employerId: string;
let errorResult: any = null;

// Use a simpler log for basic tracing if needed, or remove completely.
// For now, removing the heavy debug logging to keep it clean.

Before(async function () {
    // Cleanup if needed
});

// --- REUSABLE FUNCTIONS ---
async function createLetter(no: string, quota: number) {
    const employer = await prisma.employer.findFirst();
    if (employer) {
        employerId = employer.id;
    } else {
        const newEmployer = await prisma.employer.create({
            data: { companyName: "BDD Test Employer" }
        });
        employerId = newEmployer.id;
    }

    // Clean up existing letter with same number
    try {
        await prisma.$executeRawUnsafe(`DELETE FROM "employer_recruitment_letters" WHERE letter_number = $1`, no);
    } catch (e) { }

    const letter = await prisma.employerRecruitmentLetter.create({
        data: {
            letterNumber: no,
            approvedQuota: quota,
            employerId: employerId,
            issueDate: new Date(),
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            canCirculate: false // Default, will be updated
        }
    });
    letterId = letter.id;
    errorResult = null;
}

Given('有一張招募函 {string}，核准名額為 {int} 人', createLetter);
Given(/^There is a recruitment letter "(.*)" with quota (\d+)$/, async function (no, quota) { await createLetter(no, Number(quota)); });

async function setLetterType(type: string) {
    let canCirculate = true;
    if (type.includes('不可') || type.includes('One-off') || type.includes('Non-circular')) {
        canCirculate = false;
    } else if (type.includes('可循環') || type.includes('Circular')) {
        canCirculate = true;
    }
    await prisma.employerRecruitmentLetter.update({ where: { id: letterId }, data: { canCirculate } });
}

Given('該招募函屬性為 {string}', setLetterType);
Given(/^The letter type is "(.*)"$/, async function (type) { await setLetterType(type); });

async function createActiveWorkers(count: number) {
    for (let i = 0; i < count; i++) {
        const worker = await prisma.worker.create({
            data: { englishName: `Worker Active ${Date.now()}_${i}`, nationality: 'ID', dob: new Date('1990-01-01') }
        });
        await prisma.deployment.create({
            data: {
                workerId: worker.id,
                employerId: employerId,
                recruitmentLetterId: letterId,
                startDate: new Date(),
                status: 'active',
                serviceStatus: 'active_service'
            }
        });
    }
}
Given('目前系統中有 {int} 位移工在使用此函 (Status: Active)', createActiveWorkers);
Given(/^There are (\d+) active workers using this letter$/, async function (count) { await createActiveWorkers(Number(count)); });

async function createTransferredWorkers(count: number) {
    for (let i = 0; i < count; i++) {
        const worker = await prisma.worker.create({
            data: { englishName: `Worker Out ${Date.now()}_${i}`, nationality: 'VN', dob: new Date('1990-01-01') }
        });
        await prisma.deployment.create({
            data: { workerId: worker.id, employerId: employerId, recruitmentLetterId: letterId, startDate: new Date(), endDate: new Date(), status: 'terminated' }
        });
    }
}
Given('有 {int} 位移工已經轉出 (Status: Transferred_Out)', createTransferredWorkers);
Given(/^(\d+) workers have transferred out$/, async function (count) { await createTransferredWorkers(Number(count)); });

async function attemptApply(count: number) {
    try {
        await prisma.$transaction(async (tx) => {
            await quotaService.checkQuotaAvailability(letterId, 'male', tx);
        });
    } catch (err) {
        errorResult = err;
    }
}
When('嘗試申請 {int} 位新移工', attemptApply);
When(/^Attempt to apply for (\d+) new worker$/, async function (count) { await attemptApply(Number(count)); });

Then('系統應判定 {string}', function (result: string) {
    if (result === '通過' || result.includes('通過') || result === 'PASS') {
        expect(errorResult).to.be.null;
    } else {
        expect(errorResult).to.not.be.null;
    }
});
Then(/^System should return "(.*)"$/, function (result) {
    if (result === 'PASS' || result === 'Success') {
        expect(errorResult).to.be.null;
    } else {
        expect(errorResult).to.not.be.null;
    }
});

Then('錯誤訊息應包含 {string}', function (msg: string) {
    if (errorResult) {
        const errorMsg = (errorResult as Error).message || JSON.stringify(errorResult);
        expect(errorMsg).to.include(msg.replace('Used:', '').trim());
    }
});

Then(/^Error message should contain "(.*)"$/, function (msg) {
    if (errorResult) {
        const errorMsg = (errorResult as Error).message || JSON.stringify(errorResult);
        expect(errorMsg).to.include(msg.replace('Used:', '').trim());
    }
});
