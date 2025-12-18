
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

async function testHospitals() {
    console.log('Testing /api/hospitals...');

    // 1. Test List All
    const res1 = await request(app).get('/api/hospitals');
    if (res1.status === 200 && Array.isArray(res1.body)) {
        console.log(`PASS: List All (Count: ${res1.body.length})`);
    } else {
        console.error('FAIL: List All', res1.status, res1.body);
    }

    // 2. Test Filter General
    const res2 = await request(app).get('/api/hospitals?type=general');
    if (res2.status === 200 && res2.body.every((h: any) => h.isGeneral)) {
        console.log(`PASS: Filter General (Count: ${res2.body.length})`);
    } else {
        console.error('FAIL: Filter General');
    }

    // 3. Test Filter X-Ray
    const res3 = await request(app).get('/api/hospitals?type=xray');
    if (res3.status === 200 && res3.body.every((h: any) => h.isXray)) {
        console.log(`PASS: Filter X-Ray (Count: ${res3.body.length})`);
    } else {
        console.error('FAIL: Filter X-Ray');
    }

    await prisma.$disconnect();
}

testHospitals();
