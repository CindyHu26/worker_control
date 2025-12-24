import { Router } from 'express';
import { z } from 'zod';
import { candidateService } from '../services/candidateService';
import multer from 'multer';
import * as XLSX from 'xlsx';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validation Schema
const CandidateSchema = z.object({
    nameZh: z.string().min(1, '中文姓名必填'),
    nameEn: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']),
    birthDate: z.string().transform(str => new Date(str)),
    nationality: z.string().length(3, '國籍代碼須為 3 碼'),
    passportNo: z.string().min(1, '護照號碼必填'),
    passportExpiry: z.string().optional().transform(str => str ? new Date(str) : undefined),
    height: z.number().optional(),
    weight: z.number().optional(),
    bloodType: z.string().optional(),
    maritalStatus: z.string().optional(),
    education: z.string().optional(),
    skills: z.string().optional(),
    workExperience: z.string().optional(),
    status: z.enum(['NEW', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN']).optional().default('NEW'),
    remarks: z.string().optional(),
});

// GET /api/candidates - List with filters
router.get('/', async (req, res) => {
    try {
        const { page, limit, status, nationality, search } = req.query;

        const result = await candidateService.searchCandidates({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            status: status as string,
            nationality: nationality as string,
            search: search as string,
        });

        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: '查詢失敗', details: error.message });
    }
});

// POST /api/candidates/check-duplicate
router.post('/check-duplicate', async (req, res) => {
    try {
        const { passportNo, nameZh, birthDate } = req.body;

        const result = await candidateService.checkDuplicate(
            passportNo,
            nameZh,
            birthDate ? new Date(birthDate) : undefined
        );

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: '檢查失敗', details: error.message });
    }
});

// POST /api/candidates - Create single candidate
router.post('/', async (req, res) => {
    try {
        const data = CandidateSchema.parse(req.body);
        const candidate = await candidateService.createCandidate(data as any);
        res.status(201).json(candidate);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: '資料驗證失敗', issues: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
});

// POST /api/candidates/import - Excel upload
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '請上傳 Excel 檔案' });
        }

        // Parse Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Excel 檔案無資料' });
        }

        // Import
        const result = await candidateService.importFromExcel(rows);
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: '匯入失敗', details: error.message });
    }
});

// GET /api/candidates/:id
router.get('/:id', async (req, res) => {
    try {
        const candidate = await candidateService.searchCandidates({ limit: 1 });
        // TODO: Implement getById in service
        res.json(candidate);
    } catch (error: any) {
        res.status(500).json({ error: '查詢失敗' });
    }
});

export default router;
