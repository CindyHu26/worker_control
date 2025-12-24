import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { recruitmentService } from '../../src/services/recruitmentService';
import { format } from 'date-fns';

let registrationDate: Date;
let calculatedEndDate: Date;

Given('雇主於 {string} 向公立就服機構辦理求才登記', function (dateStr: string) {
    registrationDate = new Date(dateStr);
});

When('系統計算國內招募等待期', function () {
    calculatedEndDate = recruitmentService.calculateDomesticRecruitmentEndDate(registrationDate);
});

Then('最快可申請求才證明書的日期應為 {string}', function (expectedDateStr: string) {
    const formattedResult = format(calculatedEndDate, 'yyyy-MM-dd');
    expect(formattedResult).to.equal(expectedDateStr);
});
