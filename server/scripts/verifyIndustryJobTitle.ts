import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Industry Job Title verification...');

    const suffix = Date.now().toString().slice(-6);
    let industryId: string | undefined;

    try {
        // 1. Create Industry
        const industry = await prisma.industry.create({
            data: {
                code: `IT${suffix}`,
                nameZh: 'Mushroom Growing',
                category: 'A'
            }
        });
        industryId = industry.id;
        console.log(`Created Industry: ${industry.code}`);

        // 2. Add Job Titles
        const jobTitle1 = await prisma.industryJobTitle.create({
            data: {
                industryId: industry.id,
                titleZh: '食用菌菇類栽培業操作員',
                titleEn: 'Growing of Mushrooms Worker'
            }
        });
        console.log(`Created Job Title 1: ${jobTitle1.titleZh}`);

        const jobTitle2 = await prisma.industryJobTitle.create({
            data: {
                industryId: industry.id,
                titleZh: '菇類包裝員',
                titleEn: 'Mushroom Packer'
            }
        });
        console.log(`Created Job Title 2: ${jobTitle2.titleZh}`);

        // 3. Verify Retrieval via Industry
        const fetchedIndustry = await prisma.industry.findUnique({
            where: { id: industry.id },
            include: {
                jobTitles: true
            }
        });

        if (!fetchedIndustry) throw new Error('Industry not found');
        if (fetchedIndustry.jobTitles.length !== 2) throw new Error(`Expected 2 job titles, found ${fetchedIndustry.jobTitles.length}`);

        const titles = fetchedIndustry.jobTitles.map(t => t.titleZh);
        if (!titles.includes('食用菌菇類栽培業操作員')) throw new Error('Missing job title 1');
        if (!titles.includes('菇類包裝員')) throw new Error('Missing job title 2');

        console.log('Verification Passed!');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        if (industryId) await prisma.industry.delete({ where: { id: industryId } }).catch(console.error);
        await prisma.$disconnect();
    }
}

main();
