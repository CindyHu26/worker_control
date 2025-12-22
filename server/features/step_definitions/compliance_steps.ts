import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import prisma from '../../src/prisma';
import { analyzeDormHealth } from '../../src/services/complianceService';

let currentDormId: string;
let executionResult: any;

Given('目前 {string} 法規設定為 {float} 平方公尺', async function (code, val) {
    await prisma.complianceRule.upsert({
        where: { code },
        update: { value: val.toString() },
        create: { code, value: val.toString(), category: 'DORM', description: 'Test Rule' }
    });
});

Given('目前 {string} 法規設定為 {int} 天', async function (code, val) {
    await prisma.complianceRule.upsert({
        where: { code },
        update: { value: val.toString() },
        create: { code, value: val.toString(), category: 'SAFETY', description: 'Test Rule' }
    });
});

Given('有一間宿舍 {string} 且包含房間 {string}', async function (dormName, roomNumber) {
    // Clean up first to avoid collision if run multiple times
    const existing = await prisma.dormitory.findFirst({ where: { name: dormName } });
    if (existing) {
        await prisma.dormitory.delete({ where: { id: existing.id } }); // cascading delete rooms?
    }

    const dorm = await prisma.dormitory.create({
        data: {
            name: dormName,
            address: 'Test Address',
            totalArea: 100, // default valid
            fireSafetyExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // default valid far future
            rooms: {
                create: {
                    roomNumber: roomNumber,
                    area: 20, // default
                    capacity: 4 // default
                }
            }
        }
    });
    currentDormId = dorm.id;
});

Given('房間 {string} 面積為 {float} 平方公尺，住 {int} 人', async function (roomNumber, area, residents) {
    const dorm = await prisma.dormitory.findUnique({ where: { id: currentDormId }, include: { rooms: true } });
    const room = dorm?.rooms.find(r => r.roomNumber === roomNumber);
    if (room) {
        // Update room details
        await prisma.dormitoryRoom.update({
            where: { id: room.id },
            data: {
                area: area,
                capacity: residents // Use capacity as 'residents' for this calculation test context 
                // Wait, logic uses 'capacity'. 'capacity' usually means max beds. 
                // 'current_residents' vs 'capacity'. 
                // The service logic: area / capacity. This implies checking "Design Density" not "Current Density".
                // Scenario says "住 3 人". If logic divides be capacity, we should set capacity=3 to simulate 3 beds occupied fully?
                // Let's assume scenario implies 3 beds are configured in that space.
            }
        });
    }
});

Given('宿舍 {string} 消防安檢將於 {int} 天後到期', async function (dormName, days) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    await prisma.dormitory.update({
        where: { id: currentDormId },
        data: { fireSafetyExpiry: expiryDate }
    });
});

When('執行宿舍 {string} 改良合規檢查', async function (dormName) {
    executionResult = await analyzeDormHealth(currentDormId);
});

Then('檢查結果應回傳 {string} 錯誤', function (errorType) {
    const violations = executionResult.violations;
    const found = violations.some((v: any) => v.type === errorType);
    expect(found, `Expected violation ${errorType} but found ${JSON.stringify(violations)}`).to.be.true;
});

Then('檢查結果應回傳 {string} 警告', function (warningType) {
    // Same structure
    const violations = executionResult.violations;
    const found = violations.some((v: any) => v.type === warningType);
    expect(found, `Expected warning ${warningType} but found ${JSON.stringify(violations)}`).to.be.true;
});

Then('檢查結果訊息應包含 {string}', function (msg) {
    const violations = executionResult.violations;
    const messages = violations.map((v: any) => v.message).join('; ');
    expect(messages).to.include(msg);
});
