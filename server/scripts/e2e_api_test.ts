
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
    const data: any = await res.json();
    TOKEN = data.token;
    console.log('✅ Login successful. Token obtained.');
}

async function createDomesticAgency() {
    console.log('2. Creating Domestic Agency...');
    const code = `AG_${Date.now()}`;
    const payload = {
        code: code,
        agencyNameZh: 'Test API Agency',
        agencyNameEn: 'Test API Agency En',
        taxId: '88889999',
        responsiblePerson: 'Tester',
        phone: '0912345678',
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
        const err = await res.text();
        // If 500, exact error is important
        throw new Error(`Create Domestic Agency failed: ${res.status} ${err}`);
    }
    const data = await res.json();
    console.log('✅ Domestic Agency created:', data.name);
    return data;
}

async function createPartnerAgency() {
    console.log('3. Creating Partner Agency...');
    // Delete first to ensure clean state (if possible via API? No, delete is by ID)
    // We try to unique code
    const code = `PA_${Date.now()}`;
    const payload = {
        code: code,
        agencyNameZh: 'Test API Partner',
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
    console.log('✅ Partner Agency created:', data.agencyNameZh);
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
