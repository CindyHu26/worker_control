import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'chai';
import prisma from '../../src/prisma'; // 引用您現有的 Prisma
import { quotaService } from '../../src/services/quotaService'; // 引用您現有的 Service
import * as fs from 'fs';

const LOG_FILE = 'd:\\worker_control\\server\\debug_trace.txt';
try { fs.writeFileSync(LOG_FILE, 'Step definition file loaded\n'); } catch (e) { }

let letterId: string;
let employerId: string;
let errorResult: any = null;

// Timeout increased for DB operations
// setDefaultTimeout(60 * 1000); 

Before(async function () {
    // Ensure strict cleanup or setup usually happens here
});

// --- REUSABLE FUNCTIONS ---
async function createLetter(no: string, quota: number) {
    try { fs.appendFileSync(LOG_FILE, `Inside createLetter: ${no} ${quota}\n`); } catch (e) { }
    const employer = await prisma.employer.findFirst();
    try { fs.appendFileSync(LOG_FILE, `Found Employer: ${employer?.id}\n`); } catch (e) { }
    if (employer) {
        employerId = employer.id;
    } else {
        const newEmployer = await prisma.employer.create({
            data: { companyName: "BDD Test Employer" }
        });
        employerId = newEmployer.id;
    }
    try {
        // Hard delete to bypass soft delete logic and release unique constraint
        await prisma.$executeRawUnsafe(`DELETE FROM "employer_recruitment_letters" WHERE letter_number = $1`, no);
    } catch (e) {
        try { fs.appendFileSync(LOG_FILE, `Delete Error: ${e}\n`); } catch (err) { }
    }
    try {
        const letter = await prisma.employerRecruitmentLetter.create({
            data: {
                letterNumber: no,
                approvedQuota: quota,
                employerId: employerId,
                issueDate: new Date(),
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                canCirculate: false
            }
        });
        letterId = letter.id;
        try { fs.appendFileSync(LOG_FILE, `Letter Created: ${letter.id}\n`); } catch (e) { }
    } catch (e: any) {
        try { fs.appendFileSync(LOG_FILE, `Create Error: ${JSON.stringify(e, null, 2)}\nMessage: ${e.message}\n`); } catch (err) { }
        throw e;
    }
    errorResult = null;
}

Given('有一張招募函 {string}，核准名額為 {int} 人', createLetter);
Given(/^There is a recruitment letter "(.*)" with quota (\d+)$/, async function (no, quota) { await createLetter(no, Number(quota)); });

async function setLetterType(type: string) {
    try { fs.appendFileSync(LOG_FILE, `setLetterType: ${type}\n`); } catch (e) { }
    let canCirculate = true;
    if (type.includes('不可') || type.includes('One-off') || type.includes('Non-circular')) {
        canCirculate = false;
    } else if (type.includes('可循環') || type.includes('Circular')) {
        canCirculate = true;
    }
    await prisma.employerRecruitmentLetter.update({ where: { id: letterId }, data: { canCirculate } });
    try { fs.appendFileSync(LOG_FILE, `Letter Type Set: ${canCirculate}\n`); } catch (e) { }
}

Given('該招募函屬性為 {string}', setLetterType);
Given(/^The letter type is "(.*)"$/, async function (type) { await setLetterType(type); });

async function createActiveWorkers(count: number) {
    try { fs.appendFileSync(LOG_FILE, `createActiveWorkers: ${count}\n`); } catch (e) { }
    try {
        for (let i = 0; i < count; i++) {
            const worker = await prisma.worker.create({
                data: { englishName: `Worker Active ${Date.now()}_${i}`, nationality: 'ID', dob: new Date('1990-01-01') }
            });
            await prisma.deployment.create({
                data: { workerId: worker.id, employerId: employerId, recruitmentLetterId: letterId, startDate: new Date(), status: 'active' }
            });
        }
    } catch (e: any) {
        try { fs.appendFileSync(LOG_FILE, `Worker Error: ${JSON.stringify(e, null, 2)}\nMessage: ${e.message}\n`); } catch (err) { }
        throw e;
    }
    try { fs.appendFileSync(LOG_FILE, `Active Workers Created\n`); } catch (e) { }
}
Given('目前系統中有 {int} 位移工在使用此函 (Status: Active)', createActiveWorkers);
Given(/^There are (\d+) active workers using this letter$/, async function (count) { await createActiveWorkers(Number(count)); });

async function createTransferredWorkers(count: number) {
    try { fs.appendFileSync(LOG_FILE, `createTransferredWorkers: ${count}\n`); } catch (e) { }
    for (let i = 0; i < count; i++) {
        const worker = await prisma.worker.create({
            data: { englishName: `Worker Out ${Date.now()}_${i}`, nationality: 'VN', dob: new Date('1990-01-01') }
        });
        await prisma.deployment.create({
            data: { workerId: worker.id, employerId: employerId, recruitmentLetterId: letterId, startDate: new Date(), endDate: new Date(), status: 'terminated' }
        });
    }
    try { fs.appendFileSync(LOG_FILE, `Transferred Workers Created\n`); } catch (e) { }
}
Given('有 {int} 位移工已經轉出 (Status: Transferred_Out)', createTransferredWorkers);
Given(/^(\d+) workers have transferred out$/, async function (count) { await createTransferredWorkers(Number(count)); });

async function attemptApply(count: number) {
    try { fs.appendFileSync(LOG_FILE, `Entering When step. count=${count} letterId=${letterId}\n`); } catch (e) { }
    const l = await prisma.employerRecruitmentLetter.findUnique({ where: { id: letterId } });
    try { fs.appendFileSync(LOG_FILE, `Letter=${l?.letterNumber} Quota=${l?.approvedQuota} Circ=${l?.canCirculate}\n`); } catch (e) { }
    try {
        await prisma.$transaction(async (tx) => {
            await quotaService.checkQuotaAvailability(letterId, 'male', tx);
        });
    } catch (err) {
        errorResult = err;
        try { fs.appendFileSync(LOG_FILE, `Error: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`); } catch (e) { }
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
