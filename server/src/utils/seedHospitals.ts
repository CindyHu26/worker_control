
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedHospitals() {
    console.log('Seeding Hospitals...');

    // 1. Seed Domestic General Hospitals
    const domesticPath = path.join(__dirname, '../../public/hospital/data/dataset/domestic_general.csv');
    if (fs.existsSync(domesticPath)) {
        const content = fs.readFileSync(domesticPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim() !== '');
        // Skip header: 編號,醫院代碼,醫院名稱,醫院所在地,指定效期

        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length < 5) continue;

            const [no, code, name, city, validUntilStr] = parts;

            await prisma.hospital.upsert({
                where: { code: code },
                update: {
                    name: name.trim(),
                    city: city.trim(),
                    validUntil: validUntilStr ? new Date(validUntilStr) : null,
                    isGeneral: true
                },
                create: {
                    code: code.trim(),
                    name: name.trim(),
                    city: city.trim(),
                    validUntil: validUntilStr ? new Date(validUntilStr) : null,
                    isGeneral: true,
                    isXray: false,
                    isOverseas: false
                }
            });
            count++;
        }
        console.log(`Seeded ${count} Domestic General Hospitals.`);
    } else {
        console.warn('domestic_general.csv not found');
    }

    // 2. Seed X-Ray Hospitals
    const xrayPath = path.join(__dirname, '../../public/hospital/data/dataset/xray.csv');
    if (fs.existsSync(xrayPath)) {
        const content = fs.readFileSync(xrayPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim() !== '');

        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length < 3) continue;

            const [no, city, name] = parts;
            const hospitalName = name.trim();

            const existing = await prisma.hospital.findFirst({
                where: { name: hospitalName }
            });

            if (existing) {
                await prisma.hospital.update({
                    where: { id: existing.id },
                    data: { isXray: true }
                });
            } else {
                await prisma.hospital.create({
                    data: {
                        name: hospitalName,
                        city: city.trim(),
                        isGeneral: false,
                        isXray: true,
                        isOverseas: false
                    }
                });
            }
            count++;
        }
        console.log(`Seeded ${count} X-Ray Hospitals.`);
    } else {
        console.warn('xray.csv not found');
    }

    // 3. Seed Overseas Hospitals (NEW)
    const overseasPath = path.join(__dirname, '../../public/hospital/data/dataset/overseas.csv');
    if (fs.existsSync(overseasPath)) {
        const content = fs.readFileSync(overseasPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim() !== '');
        // Header: Country,Number,Code of Hospital,Name of Hospital

        let count = 0;
        // Start from 1 to skip header? 
        // Let's check line 0.
        // Line 0 in original file is "Country,Number,Code of Hospital,Name of Hospital"

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Use regex to split by comma but respect quotes if present (some names might have commas)
            // But for now simple split as per dataset usually safe, unless "name" contains comma
            // Looking at file content: "Physician's Diagnostic Services Center, Cebu City" has quotes!
            // Need a smarter split logic or regex.

            // Regex for CSV split handling quotes
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            // Actually simple split might fail. Let's try a robust regex or csv-parser library if available.
            // But we don't want to install extra deps if avoidable.
            // The existing `csv-stringify` is for writing. `csv-parse`?
            // Let's write a simple parser or handle the specific case.
            // Or better: use `line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)`? 
            // Valid CSV regex: /,(?=(?:(?:[^"]*"){2})*[^"]*$)/

            const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

            if (parts.length < 4) continue;

            const country = parts[0].trim();
            const no = parts[1].trim();
            const code = parts[2].trim();
            let name = parts[3].trim();

            // Remove quotes if present
            if (name.startsWith('"') && name.endsWith('"')) {
                name = name.slice(1, -1);
            }

            // Upsert by code?
            // Some might not have code? The dataset shows Code for all lines I viewed.
            // If code is empty, use name?

            if (code) {
                await prisma.hospital.upsert({
                    where: { code: code },
                    update: {
                        name: name,
                        country: country,
                        isOverseas: true
                    },
                    create: {
                        code: code,
                        name: name,
                        country: country,
                        isGeneral: false,
                        isXray: false,
                        isOverseas: true
                    }
                });
            } else {
                // If no code, just create or update by name?
                // Assuming code exists as per dataset view.
                await prisma.hospital.create({
                    data: {
                        name: name,
                        country: country,
                        isGeneral: false,
                        isXray: false,
                        isOverseas: true
                    }
                });
            }
            count++;
        }
        console.log(`Seeded ${count} Overseas Hospitals.`);
    } else {
        console.warn('overseas.csv not found');
    }
}

seedHospitals()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
