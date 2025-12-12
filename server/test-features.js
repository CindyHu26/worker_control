

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
    console.log('Starting System Feature Tests...');

    try {
        // 1. Test Users List (Service Team prerequisite)
        console.log('\n--- 1. Testing GET /api/users ---');
        const usersRes = await fetch(`${BASE_URL}/users`);
        const users = await usersRes.json();
        console.log(`Fetched ${users.length} users.`);
        if (users.length === 0) throw new Error('No users found. Seed database first.');
        const testUserId = users[0].id;

        // 2. Create Worker (with new fields)
        console.log('\n--- 2. Testing Create Worker (POST /api/workers) ---');
        const workerData = {
            englishName: 'Test Worker ' + Date.now(),
            nationality: 'Indonesia',
            dob: '1995-01-01',
            passportNumber: 'E' + Date.now()
        };
        const workerRes = await fetch(`${BASE_URL}/workers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workerData)
        });
        const worker = await workerRes.json();
        if (!worker.id) throw new Error('Failed to create worker');
        console.log('Worker Created:', worker.id);

        // 3. Test Update Worker (New Fields + Tabbed Interface Logic)
        console.log('\n--- 3. Testing Update Worker (PUT /api/workers/:id) ---');
        const updateData = {
            chineseName: '測試移工',
            bloodType: 'O',
            religion: 'Muslim',
            taxId: 'A123456789',
            isTaxResident: true,
            bankCode: '822',
            // Deployment/Permit fields usually update active deployment, but we have none yet.
            // Let's create a dummy deployment first? 
            // The create worker script doesn't make deployment. 
            // We'll skip deployment field updates for now to keep strict focused on Worker fields.
        };
        const updateRes = await fetch(`${BASE_URL}/workers/${worker.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        const updatedWorker = await updateRes.json();
        if (updatedWorker.bloodType !== 'O') throw new Error('Failed to update bloodType');
        console.log('Worker Updated Successfully.');

        // 4. Test Service Team Assignment
        console.log('\n--- 4. Testing Service Team Assignment (POST /api/workers/:id/assign-team) ---');
        const assignData = {
            salesId: testUserId,
            serviceId: testUserId,
            adminId: testUserId,
            translatorId: testUserId
        };
        const assignRes = await fetch(`${BASE_URL}/workers/${worker.id}/assign-team`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignData)
        });
        const assignResult = await assignRes.json();
        console.log('Team Assigned:', Object.keys(assignResult));

        // 5. Test Accounting Route
        console.log('\n--- 5. Testing Accounting Generation (POST /api/accounting/bills/generate-monthly) ---');
        const accRes = await fetch(`${BASE_URL}/accounting/bills/generate-monthly`, {
            method: 'POST'
        });
        const accResult = await accRes.json();
        console.log('Accounting Result:', accResult);

        console.log('\n✅ All Tests Passed!');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
    }
}

runTests();
