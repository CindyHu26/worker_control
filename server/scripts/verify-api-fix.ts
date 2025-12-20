
const API_URL = 'http://localhost:4000/api/employers'; // Assuming server runs on 4000

async function main() {
    console.log('--- Starting API Fix Verification (Fetch) ---');

    // 1. Test Creation without CompanyName (should use responsiblePerson as fallback)
    const testPayload = {
        taxId: 'A' + Math.floor(100000000 + Math.random() * 900000000), // Random ID
        responsiblePerson: 'TestIndividual_' + Date.now(),
        // companyName is OMITTED
        category: 'HOME_CARE',
        patientName: 'Grandpa Joe',
        careAddress: '123 Care Lane',
        responsiblePersonIdNo: 'A' + Math.floor(100000000 + Math.random() * 900000000)
    };

    console.log('1. Attempting to create Individual Employer without CompanyName...');
    try {
        const createRes = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        if (!createRes.ok) {
            const errText = await createRes.text();
            throw new Error(`Creation Failed: ${createRes.status} ${errText}`);
        }

        const createData = await createRes.json();
        console.log('✅ Creation Successful! Status:', createRes.status);
        console.log('   Created ID:', createData.id);
        console.log('   Assigned CompanyName:', createData.companyName);

        if (createData.companyName !== testPayload.responsiblePerson) {
            console.warn('   ⚠️ Warning: CompanyName fallback mismatch. Expected:', testPayload.responsiblePerson, 'Got:', createData.companyName);
        }

        // 2. Test GET List Mapping
        console.log('\n2. Verifying GET /api/employers response structure...');
        const listUrl = `${API_URL}?q=${testPayload.responsiblePerson}`;
        const listRes = await fetch(listUrl);

        if (!listRes.ok) {
            const errText = await listRes.text();
            throw new Error(`List Fetch Failed: ${listRes.status} ${errText}`);
        }

        const listDataWrapper = await listRes.json();
        const found = listDataWrapper.data.find((e: any) => e.id === createData.id);

        if (!found) {
            console.error('❌ Created employer not found in list!');
            process.exit(1);
        }

        console.log('   Found Employer in List:', found.companyName);

        // CHeck homeCareInfo
        if (found.homeCareInfo && found.homeCareInfo.patients && Array.isArray(found.homeCareInfo.patients)) {
            console.log('✅ homeCareInfo structure is correct.');
            console.log('   Patient Name:', found.homeCareInfo.patients[0]?.name);
            if (found.homeCareInfo.patients[0]?.name === testPayload.patientName) {
                console.log('✅ Data mapping verified.');
            } else {
                console.error('❌ Data mapping mismatch for patientName.');
            }
        } else {
            console.error('❌ homeCareInfo structure is MISSING or INVALID:', JSON.stringify(found, null, 2));
        }

    } catch (err: any) {
        console.error('❌ Test Failed:', err.message);
        process.exit(1);
    }
}

main();
