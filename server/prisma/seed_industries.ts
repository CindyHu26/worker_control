import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface IndustryDataItem {
    行業類別: string;    // code
    行業名稱: string;    // nameZh
    發布機關: string;    // issuingAgency
    機關代碼: string;    // agencyCode
    版本: string;        // version
    行業名稱_英文?: string; // nameEn
}

/**
 * Seed industries from JSON file
 * This ensures industry classification data is always available after DB rebuild
 */
export async function seedIndustries(prisma: PrismaClient): Promise<number> {
    const jsonPath = path.join(__dirname, '../public/industry/data/dataset/industry.json');

    console.log(`📖 Reading industry data from: ${jsonPath}`);

    if (!fs.existsSync(jsonPath)) {
        console.warn(`⚠️  Industry data file not found: ${jsonPath}`);
        return 0;
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const industries: IndustryDataItem[] = JSON.parse(rawData);

    console.log(`📊 Found ${industries.length} industry records to process`);

    let count = 0;
    for (const item of industries) {
        await prisma.industry.upsert({
            where: { code: item.行業類別 },
            update: {
                nameZh: item.行業名稱,
                nameEn: item.行業名稱_英文 || null,
                issuingAgency: item.發布機關,
                agencyCode: item.機關代碼,
                version: item.版本,
            },
            create: {
                code: item.行業類別,
                nameZh: item.行業名稱,
                nameEn: item.行業名稱_英文 || null,
                issuingAgency: item.發布機關,
                agencyCode: item.機關代碼,
                version: item.版本,
                isOpen: true,
            },
        });
        count++;

        // Progress indicator every 100 records
        if (count % 100 === 0) {
            console.log(`  ... processed ${count} / ${industries.length}`);
        }
    }

    console.log(`✅ Successfully seeded ${count} industry records`);
    return count;
}
