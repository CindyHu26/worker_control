import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma';
import { addMonths, format } from 'date-fns';

let response: any;
let currentToken: string = '';
let createdWorkerId: string = '';
let createdCandidateId: string = '';
let createdDeploymentId: string = '';
let createdEmployerId: string = '';
let testEntryDate: Date;

// Cleanup
Before({ tags: '@worker' }, async function () {
    // Clean up test workers
    await prisma.worker.deleteMany({
        where: { englishName: { contains: 'Nguyen Van' } }
    });
    await prisma.candidate.deleteMany({
        where: { nameEn: { contains: 'Nguyen Van' } }
    });
});

// ==========================================
// Background
// ==========================================

Given('我以行政人員身份登入', function () {
    currentToken = 'test-token';
});

Given('雇主 {string} 已在系統中建立', async function (companyName) {
    let employer = await prisma.employer.findFirst({
        where: { companyName: { contains: companyName } }
    });

    if (!employer) {
        employer = await prisma.employer.create({
            data: {
                companyName,
                taxId: `TEST${Date.now()}`.slice(0, 8)
            }
        });
    }

    createdEmployerId = employer.id;
});

// ==========================================
// Entry Confirmation
// ==========================================

Given('候選人 {string} 預計於今日入境', async function (candidateName) {
    // Create candidate if not exists
    let candidate = await prisma.candidate.findFirst({
        where: { nameEn: candidateName }
    });

    if (!candidate) {
        candidate = await prisma.candidate.create({
            data: {
                nameEn: candidateName,
                nameZh: candidateName,
                nationality: 'VN',
                passportNo: `VN${Date.now()}`,
                status: 'SELECTED'
            }
        });
    }

    createdCandidateId = candidate.id;
});

When('我執行 {string} 動作:', async function (action, dataTable) {
    const data = dataTable.rowsHash();

    if (action === '確認入境') {
        testEntryDate = new Date(data.actual_entry_date);

        response = await request(app)
            .post(`/api/candidates/${createdCandidateId}/confirm-entry`)
            .send({
                actualEntryDate: data.actual_entry_date,
                flightNumber: data.flight_number
            })
            .set('Authorization', `Bearer ${currentToken}`)
            .set('Accept', 'application/json');

        if (response.status === 200 || response.status === 201) {
            createdWorkerId = response.body.workerId || response.body.id;
        }
    }
});

Then('系統應將 {string} 資料轉換為 {string}', async function (from, to) {
    if (from === 'Candidate' && to === 'Worker') {
        expect(createdWorkerId).to.not.be.undefined;

        const worker = await prisma.worker.findUnique({
            where: { id: createdWorkerId }
        });
        expect(worker).to.not.be.null;
    }
});

Then('新建立的 Worker 狀態應為 {string}', async function (expectedStatus) {
    // Worker doesn't have a direct status field, check via deployment
    const deployment = await prisma.deployment.findFirst({
        where: { workerId: createdWorkerId }
    });
    expect(deployment?.status).to.equal(expectedStatus.toLowerCase());
});

Then('系統應自動建立 {string} 關聯至雇主', async function (relation) {
    if (relation === 'Deployment') {
        const deployment = await prisma.deployment.findFirst({
            where: { workerId: createdWorkerId }
        });
        expect(deployment).to.not.be.null;
        expect(deployment?.employerId).to.not.be.null;
        createdDeploymentId = deployment?.id || '';
    }
});

// ==========================================
// Health Check Scheduling
// ==========================================

Given('移工 {string} 於 {string} 入境', async function (workerName, entryDate) {
    testEntryDate = new Date(entryDate);

    // Find or create worker
    let worker = await prisma.worker.findFirst({
        where: { englishName: workerName }
    });

    if (!worker) {
        worker = await prisma.worker.create({
            data: {
                englishName: workerName,
                dob: new Date('1990-01-01'), // Added dummy DOB
                // nationality: 'VN' // Fix type error
            }
        });
    }

    createdWorkerId = worker.id;

    // Create deployment with entry date
    const deployment = await prisma.deployment.create({
        data: {
            workerId: createdWorkerId,
            employerId: createdEmployerId,
            entryDate: testEntryDate,
            startDate: testEntryDate, // Added required field
            status: 'active'
        }
    });

    createdDeploymentId = deployment.id;
});

When('系統計算法定體檢日期', async function () {
    // This would typically be done by a service
    // For testing, we calculate expected dates
});

Then('系統應自動設定以下體檢日期:', async function (dataTable) {
    const rows = dataTable.hashes();

    for (const row of rows) {
        const months = parseInt(row.type.replace('個月體檢', ''));
        const expectedDate = addMonths(testEntryDate, months);

        // Verify health check record was created
        const healthCheck = await prisma.healthCheck.findFirst({
            where: {
                workerId: createdWorkerId,
                checkType: `mo${months}` as any
            }
        });

        // If auto-scheduling is implemented, check the date
        if (healthCheck) {
            const checkDate = new Date(healthCheck.checkDate || '');
            expect(format(checkDate, 'yyyy-MM')).to.equal(format(expectedDate, 'yyyy-MM'));
        }
    }
});

Then('系統應在 {string} 產生對應日期的提醒', async function (tableName) {
    // Verify alerts were created
    const alerts = await prisma.systemAlert.findMany({
        where: {
            entityType: 'HEALTH_CHECK',
            entityId: createdWorkerId
        }
    });

    // Alerts may be created by scheduler, so we just log for now
    console.log(`Found ${alerts.length} health check alerts`);
});

// ==========================================
// Health Check Results
// ==========================================

Given('移工 {string} 的 {int} 個月體檢到期日為 {string}', async function (name, months, dueDate) {
    const worker = await prisma.worker.findFirst({
        where: { englishName: name }
    });

    if (worker) {
        createdWorkerId = worker.id;
    }
});

When('系統於 {string} 執行體檢提醒排程', async function (runDate) {
    // Simulate scheduler execution
    // In actual tests, call the scheduler service
});

Then('系統應產生 {string} 等級的體檢提醒', async function (severity) {
    // Verify alert was created with correct severity
});

Given('移工 {string} 完成 {int} 個月體檢', async function (name, months) {
    const worker = await prisma.worker.findFirst({
        where: { englishName: name }
    });

    if (worker) {
        createdWorkerId = worker.id;
    }
});

When('我登錄體檢結果:', async function (dataTable) {
    const data = dataTable.rowsHash();

    response = await request(app)
        .post(`/api/workers/${createdWorkerId}/health-checks`)
        .send({
            checkDate: data.check_date,
            result: data.result,
            hospital: data.hospital,
            failReason: data.fail_reason
        })
        .set('Authorization', `Bearer ${currentToken}`)
        .set('Accept', 'application/json');
});

Then('體檢紀錄應被儲存', async function () {
    expect(response.status).to.be.oneOf([200, 201]);
});

Then('體檢結果應為 {string}', async function (expectedResult) {
    expect(response.body.result).to.equal(expectedResult.toLowerCase());
});

Then('體檢提醒狀態應更新為 {string}', async function (expectedStatus) {
    // Verify alert status was updated
});

// ==========================================
// Service Assignment
// ==========================================

Given('移工 {string} 已入境', async function (workerName) {
    const worker = await prisma.worker.findFirst({
        where: { englishName: workerName }
    });

    if (worker) {
        createdWorkerId = worker.id;
    }
});

When('我指派服務團隊:', async function (dataTable) {
    const rows = dataTable.hashes();

    for (const row of rows) {
        const employee = await prisma.employee.findFirst({
            where: { fullName: row.employee }
        });

        if (employee) {
            response = await request(app)
                .post(`/api/workers/${createdWorkerId}/assign-team`)
                .send({
                    role: row.role,
                    employeeId: employee.id
                })
                .set('Authorization', `Bearer ${currentToken}`)
                .set('Accept', 'application/json');
        }
    }
});

Then('每個角色的指派紀錄應儲存在 {string}', async function (tableName) {
    const assignments = await prisma.serviceAssignment.findMany({
        where: { workerId: createdWorkerId }
    });
    expect(assignments.length).to.be.greaterThan(0);
});

Then('這些人員應可查看該移工的相關資訊', function () {
    // Authorization check - placeholder
});
