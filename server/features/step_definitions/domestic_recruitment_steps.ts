import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import prisma from '../../src/prisma';
import request from 'supertest';
import app from '../../src/app';

let employerId: string;
let response: any;
let registerDateStr: string;

Given('有一家製造業雇主 {string}', async function (name: string) {
    // Create Corporate Employer
    const employer = await prisma.employer.create({
        data: {
            companyName: name,
            taxId: `TAX_${Date.now()}`,
            contactPerson: 'Tester',
            corporateInfo: {
                create: {
                    industryType: 'MANUFACTURING',
                    capital: 1000000
                }
            }
        }
    });
    employerId = employer.id;
});

Given('有一位家庭雇主 {string}', async function (name: string) {
    // Create Individual Employer
    const employer = await prisma.employer.create({
        data: {
            companyName: name,
            contactPerson: name,
            individualInfo: {
                create: {
                    idIssuePlace: 'Taipei'
                }
            }
        }
    });
    employerId = employer.id;
});

When('該雇主填寫求才登記表，登記日為 {string}', function (date: string) {
    registerDateStr = date;
});

When('該雇主嘗試申請求才證明書，發文日為 {string}', async function (issueDate: string) {
    response = await request(app)
        .post('/api/recruitment-proofs')
        .send({
            employerId,
            receiptNumber: `RCPT_${Date.now()}`,
            registerDate: registerDateStr,
            issueDate: issueDate,
            jobCenter: 'Taipei Center',
            status: 'VALID'
        });
});

Then('系統應回傳錯誤 {string}', function (errorMsg: string) {
    expect(response.status).to.equal(400);
    expect(response.body.error).to.include(errorMsg);
});

Then('系統應成功建立求才證明書', function () {
    expect(response.status).to.equal(200);
    expect(response.body.id).to.exist;
});
