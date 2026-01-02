
const BASE_URL = 'http://localhost:3000/api';
let TOKEN = '';

async function login() {
    console.log('1. Logging in...');
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'change_me' })
    });

    if (!res.ok) throw new Error(`Login failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    TOKEN = data.token;
    console.log('✅ Login successful.');
}

async function createDomesticAgency() {
    console.log('2. Creating Domestic Agency...');
    const payload = {
        name: 'Test API Agency JS ' + Date.now(),
        licenseNo: 'L' + Date.now(),
        taxId: '88889999',
        responsiblePerson: 'Tester',
        phone: '0912345678',
        fax: '0223456780',
        email: 'test@example.com',
        address: 'Test Address',
        isDefault: false
    };

    const res = await fetch(`${BASE_URL}/settings/agency-companies`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        let errText = await res.text();
        try {
            const json = JSON.parse(errText);
            if (json.details) console.error('>>> SERVER ERROR DETAILS:', json.details);
            else console.error('>>> SERVER ERROR:', json);
        } catch (e) {
            console.error('>>> RAW ERROR:', errText);
        }
        throw new Error(`Create Domestic Agency failed: ${res.status}`);
    }
    const data = await res.json();
    console.log(`✅ Domestic Agency created: ${data.name} (ID: ${data.id})`);
    return data;
}

async function createPartnerAgency() {
    console.log('3. Creating Partner Agency...');
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const code = `PA_${randomSuffix}`; // 7 chars, within VarChar(10)
    const payload = {
        code: code,
        agencyNameZh: 'Test API Partner JS',
        country: 'VN'
    };

    const res = await fetch(`${BASE_URL}/partner-agencies`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Create Partner Agency failed: ${res.status} ${err}`);
    }
    const data = await res.json();
    console.log(`✅ Partner Agency created: ${data.agencyNameZh} (Code: ${data.code})`);
    return data;
}

async function main() {
    try {
        await login();
        await createDomesticAgency();
        await createPartnerAgency();
        console.log('🎉 All API Tests Passed!');
    } catch (e) {
        console.error('❌ Test Failed:', e);
        process.exit(1);
    }
}

main();
