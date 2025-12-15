
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// Helper to calculate points
const calculatePoints = (data: any) => {
    let breakdown: any = {
        education: 0,
        salary: 0,
        experience: 0,
        qualifications: 0,
        chinese: 0,
        otherLanguages: 0,
        overseasGrowth: 0,
        policy: 0
    };

    // 1. Education
    // PhD(30), Master(20), Bachelor(10), Associate(10)
    const edu = (data.educationDegree || '').toLowerCase();
    if (edu.includes('phd') || edu.includes('doctor')) breakdown.education = 30;
    else if (edu.includes('master')) breakdown.education = 20;
    else if (edu.includes('bachelor')) breakdown.education = 10;
    else if (edu.includes('associate')) breakdown.education = 10;

    // 2. Salary
    // >=47971(40), >=40000(30), >=35000(20), >=31520(10)
    const salary = Number(data.avgMonthlySalary || 0);
    if (salary < 31520) {
        throw new Error('Salary must be at least 31,520');
    }
    if (salary >= 47971) breakdown.salary = 40;
    else if (salary >= 40000) breakdown.salary = 30;
    else if (salary >= 35000) breakdown.salary = 20;
    else if (salary >= 31520) breakdown.salary = 10;

    // 3. Experience
    // >=2 years(20), >=1 year(10)
    const exp = Number(data.experienceYears || 0);
    if (exp >= 2) breakdown.experience = 20;
    else if (exp >= 1) breakdown.experience = 10;

    // 4. Qualifications (Special skills/licenses)
    // If present/valid -> 20
    if (data.qualificationDetails || data.hasQualifications) {
        breakdown.qualifications = 20;
    }

    // 5. Chinese Capability (TOCFL)
    // Fluent(30), High(25), Advanced(20)
    const chinese = (data.chineseLevel || '').toLowerCase();
    if (chinese.includes('fluent') || chinese.includes('level 5') || chinese.includes('level 6')) breakdown.chinese = 30;
    else if (chinese.includes('high') || chinese.includes('level 4')) breakdown.chinese = 25;
    else if (chinese.includes('advanced') || chinese.includes('level 3')) breakdown.chinese = 20;
    // Assuming "Advanced" usually maps to specific tiers. The prompt says Fluent/High/Advanced 30/25/20.

    // 6. Other Languages
    if (data.otherLanguageDetails || data.hasDualLanguage) {
        breakdown.otherLanguages = 20;
    }

    // 7. Overseas Growth (6+ years)
    if (data.overseasGrowthDetails || data.hasOverseasGrowth) {
        breakdown.overseasGrowth = 10;
    }

    // 8. Policy (5+2, New Southbound)
    if (data.policyDetails || data.isPolicyAligned) {
        breakdown.policy = 20;
    }

    const total = Object.values(breakdown).reduce((a: any, b: any) => a + b, 0) as number;

    return {
        breakdown,
        total,
        isQualified: total >= 70
    };
};

// POST /api/workers/:id/evaluation/calculate
router.post('/:id/evaluation/calculate', async (req, res) => {
    try {
        const result = calculatePoints(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/workers/:id/evaluation
router.post('/:id/evaluation', async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
        // 1. Check Worker
        const worker = await prisma.worker.findUnique({
            where: { id },
            include: { deployments: { where: { status: 'active' }, take: 1 } }
        });
        if (!worker) return res.status(404).json({ error: 'Worker not found' });

        // Warning if not Student (logic depends on category or flag)
        // Prompt Check: "Worker identity is not Student (Overseas Chinese)"
        // Assuming category 'student' exists or we check nationality/note?
        // Prompt says "category (default 'general')". I will assume new category 'student' or just warn.
        if (worker.category !== 'student') {
            // Just a warning in response? Or block? Prompt says "Prompt warning".
            // We'll return it in current response meta or we proceed.
            // Let's proceed but maybe add a note or assume frontend warns.
        }

        // 2. Calculate
        let calc;
        try {
            calc = calculatePoints(data);
        } catch (e: any) {
            return res.status(400).json({ error: e.message });
        }

        // 3. Save
        // Check if exists
        const evaluation = await prisma.studentEvaluation.upsert({
            where: { workerId: id },
            update: {
                educationDegree: data.educationDegree,
                educationScore: calc.breakdown.education,
                avgMonthlySalary: data.avgMonthlySalary,
                salaryScore: calc.breakdown.salary,
                experienceYears: data.experienceYears,
                experienceScore: calc.breakdown.experience,
                qualificationDetails: data.qualificationDetails,
                qualificationScore: calc.breakdown.qualifications,
                chineseLevel: data.chineseLevel,
                chineseScore: calc.breakdown.chinese,
                otherLanguageDetails: data.otherLanguageDetails,
                otherLanguageScore: calc.breakdown.otherLanguages,
                overseasGrowthDetails: data.overseasGrowthDetails,
                overseasGrowthScore: calc.breakdown.overseasGrowth,
                policyDetails: data.policyDetails,
                policyScore: calc.breakdown.policy,
                totalScore: calc.total,
                isQualified: calc.isQualified,
                status: 'Submitted',
                deploymentId: worker.deployments[0]?.id // Link to active deployment if any
            },
            create: {
                workerId: id,
                educationDegree: data.educationDegree,
                educationScore: calc.breakdown.education,
                avgMonthlySalary: data.avgMonthlySalary,
                salaryScore: calc.breakdown.salary,
                experienceYears: data.experienceYears,
                experienceScore: calc.breakdown.experience,
                qualificationDetails: data.qualificationDetails,
                qualificationScore: calc.breakdown.qualifications,
                chineseLevel: data.chineseLevel,
                chineseScore: calc.breakdown.chinese,
                otherLanguageDetails: data.otherLanguageDetails,
                otherLanguageScore: calc.breakdown.otherLanguages,
                overseasGrowthDetails: data.overseasGrowthDetails,
                overseasGrowthScore: calc.breakdown.overseasGrowth,
                policyDetails: data.policyDetails,
                policyScore: calc.breakdown.policy,
                totalScore: calc.total,
                isQualified: calc.isQualified,
                status: 'Submitted',
                deploymentId: worker.deployments[0]?.id
            }
        });

        res.json({
            success: true,
            data: evaluation,
            warning: worker.category !== 'student' ? 'Worker is not categorized as Student' : null
        });

    } catch (error: any) {
        console.error('Save Evaluation Error:', error);
        res.status(500).json({ error: 'Failed to save evaluation' });
    }
});

// GET /api/workers/:id/evaluation
router.get('/:id/evaluation', async (req, res) => {
    const { id } = req.params;
    try {
        const evaluation = await prisma.studentEvaluation.findUnique({
            where: { workerId: id }
        });
        res.json(evaluation || {});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch evaluation' });
    }
});

export default router;
