
const API_URL = 'http://localhost:3001/api';

async function main() {
    console.log('--- Auth Flow Verification ---');

    // 1. Login
    console.log('1. Logging in as admin...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' })
        // Trying password123 as per user README update, if fail try change_me
    });

    if (!loginRes.ok) {
        console.log('   Login with password123 failed, trying "change_me"...');
        const retryRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'change_me' })
        });
        if (!retryRes.ok) {
            console.error('❌ Login failed with both passwords.');
            process.exit(1);
        }
        const data = await retryRes.json();
        runTests(data.token);
    } else {
        const data = await loginRes.json();
        runTests(data.token);
    }
}

async function runTests(token) {
    console.log('✅ Login successful. Got token:', token.substring(0, 20) + '...');

    // 2. Request WITH Token
    console.log('\n2. Requesting Employers List WITH Token...');
    const resWithToken = await fetch(`${API_URL}/employers`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   Status: ${resWithToken.status}`);
    if (resWithToken.ok) {
        console.log('✅ Request authorized.');
    } else {
        console.error('❌ Request rejected despite token! Msg:', await resWithToken.text());
    }

    // 3. Request WITHOUT Token
    console.log('\n3. Requesting Employers List WITHOUT Token...');
    const resNoToken = await fetch(`${API_URL}/employers`);
    console.log(`   Status: ${resNoToken.status}`);
    if (resNoToken.status === 401) {
        console.log('✅ Correctly rejected (401).');
    } else {
        console.warn('⚠️ Unexpected status for no token:', resNoToken.status);
    }
}

main();
