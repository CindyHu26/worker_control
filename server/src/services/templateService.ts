import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';
import prisma from '../prisma';
import { getDocumentContext, buildWorkerDocumentContext, getTemplateKeys } from '../utils/documentContext';

// 設定模板儲存目錄
const TEMPLATE_DIR = path.join(__dirname, '../../storage/templates');
const GENERATED_DIR = path.join(__dirname, '../../storage/generated');

// 確保目錄存在
if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
}
if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

// MIME Type 對應表
const MIME_TYPES: Record<string, string> = {
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'odt': 'application/vnd.oasis.opendocument.text',
    'pdf': 'application/pdf'
};

// 支援的檔案格式
const SUPPORTED_FORMATS = ['docx', 'xlsx'];

export interface PlaceholderInfo {
    key: string;           // 變數名稱 e.g. "worker_name_en"
    location?: string;     // 位置 (xlsx: "A1", docx: "paragraph 3")
    systemField?: string;  // 對應的系統欄位
    description?: string;  // 欄位說明
}

export interface TemplateUploadMeta {
    name: string;
    category: string;
    description?: string;
    nationalityId?: string;
    language?: string;
    version?: string;
}

export const templateService = {
    /**
     * 1. 上傳模板 (Enhanced: 支援多格式)
     */
    async uploadTemplate(file: Express.Multer.File, meta: TemplateUploadMeta) {
        const ext = path.extname(file.originalname).toLowerCase().slice(1);

        if (!SUPPORTED_FORMATS.includes(ext)) {
            throw new Error(`不支援的檔案格式: ${ext}。支援格式: ${SUPPORTED_FORMATS.join(', ')}`);
        }

        const filename = `${Date.now()}_${file.originalname}`;
        const filePath = path.join(TEMPLATE_DIR, filename);

        // 寫入檔案
        fs.writeFileSync(filePath, file.buffer);

        // 自動解析 Placeholder
        let detectedPlaceholders: PlaceholderInfo[] = [];
        try {
            if (ext === 'docx') {
                detectedPlaceholders = await this.parseDocxPlaceholders(filePath);
            } else if (ext === 'xlsx') {
                detectedPlaceholders = await this.parseXlsxPlaceholders(filePath);
            }
        } catch (err) {
            console.warn('解析 Placeholder 失敗:', err);
        }

        // 寫入資料庫
        return await prisma.documentTemplate.create({
            data: {
                name: meta.name,
                category: meta.category,
                description: meta.description,
                filePath: filename,
                fileFormat: ext,
                mimeType: MIME_TYPES[ext] || 'application/octet-stream',
                originalName: file.originalname,
                nationalityId: meta.nationalityId,
                language: meta.language,
                version: meta.version,
                placeholderSchema: detectedPlaceholders as any,
            } as any
        } as any);
    },

    /**
     * 2. 解析 DOCX Placeholder
     */
    async parseDocxPlaceholders(filePath: string): Promise<PlaceholderInfo[]> {
        const content = fs.readFileSync(filePath, 'binary');
        const zip = new PizZip(content);
        const docXml = zip.file('word/document.xml')?.asText() || '';

        // 匹配 {tag} 格式的 placeholder
        const tagRegex = /\{([a-zA-Z0-9_]+)\}/g;
        const matches = [...docXml.matchAll(tagRegex)].map(m => m[1]);
        const uniqueTags = [...new Set(matches)];

        const systemKeys = getTemplateKeys();

        return uniqueTags.map(key => ({
            key,
            location: 'docx',
            systemField: systemKeys.includes(key) ? key : undefined,
            description: systemKeys.includes(key) ? `系統欄位: ${key}` : '未知欄位'
        }));
    },

    /**
     * 3. 解析 XLSX Placeholder
     */
    async parseXlsxPlaceholders(filePath: string): Promise<PlaceholderInfo[]> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const placeholders: PlaceholderInfo[] = [];
        const tagRegex = /\$\{([a-zA-Z0-9_]+)\}|\{([a-zA-Z0-9_]+)\}/g;
        const systemKeys = getTemplateKeys();

        workbook.eachSheet((worksheet) => {
            worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell, colNumber) => {
                    const cellValue = String(cell.value || '');
                    const matches = [...cellValue.matchAll(tagRegex)];

                    for (const match of matches) {
                        const key = match[1] || match[2];
                        const colLetter = this.getColumnLetter(colNumber);
                        placeholders.push({
                            key,
                            location: `${worksheet.name}!${colLetter}${rowNumber}`,
                            systemField: systemKeys.includes(key) ? key : undefined,
                            description: systemKeys.includes(key) ? `系統欄位: ${key}` : '未知欄位'
                        });
                    }
                });
            });
        });

        // 去重
        const seen = new Set<string>();
        return placeholders.filter(p => {
            const k = `${p.key}-${p.location}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    },

    /**
     * 4. 產生文件 (Enhanced: 支援多格式)
     */
    async generateDocument(templateId: string, contextType: string, contextId: string) {
        const templateRecord = await prisma.documentTemplate.findUnique({
            where: { id: templateId }
        });
        if (!templateRecord) throw new Error("Template not found");

        const fullPath = path.join(TEMPLATE_DIR, templateRecord.filePath);
        if (!fs.existsSync(fullPath)) throw new Error("Template file missing on server");

        const data = await getDocumentContext(contextType, contextId);
        const format = (templateRecord as any).fileFormat || 'docx';

        let result: { filename: string; buffer: Buffer };

        if (format === 'docx') {
            result = await this.generateDocxDocument(fullPath, templateRecord.name, data);
        } else if (format === 'xlsx') {
            result = await this.generateXlsxDocument(fullPath, templateRecord.name, data);
        } else {
            throw new Error(`不支援產生 ${format} 格式文件`);
        }

        // 記錄產生的文件
        try {
            const generatedPath = path.join(GENERATED_DIR, `${Date.now()}_${result.filename}`);
            fs.writeFileSync(generatedPath, result.buffer);

            await (prisma as any).generatedDocument.create({
                data: {
                    templateId,
                    workerId: contextType === 'worker' ? contextId : null,
                    employerId: contextType === 'employer' ? contextId : null,
                    fileName: result.filename,
                    filePath: generatedPath,
                    fileSize: result.buffer.length,
                    status: 'SUCCESS'
                }
            });
        } catch (err) {
            console.error('記錄產生文件失敗:', err);
        }

        return result;
    },

    /**
     * 4a. 產生 DOCX 文件
     */
    async generateDocxDocument(filePath: string, templateName: string, data: Record<string, any>) {
        const content = fs.readFileSync(filePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        try {
            doc.render(data);
        } catch (error: any) {
            throw new Error(`Template Render Error: ${JSON.stringify(error.properties)}`);
        }

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        return {
            filename: `Generated_${templateName}.docx`,
            buffer: buf
        };
    },

    /**
     * 4b. 產生 XLSX 文件
     */
    async generateXlsxDocument(filePath: string, templateName: string, data: Record<string, any>) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const tagRegex = /\$\{([a-zA-Z0-9_]+)\}|\{([a-zA-Z0-9_]+)\}/g;

        workbook.eachSheet((worksheet) => {
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    if (typeof cell.value === 'string') {
                        let newValue = cell.value;
                        newValue = newValue.replace(tagRegex, (match, p1, p2) => {
                            const key = p1 || p2;
                            return data[key] !== undefined ? String(data[key]) : match;
                        });
                        cell.value = newValue;
                    }
                });
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return {
            filename: `Generated_${templateName}.xlsx`,
            buffer: Buffer.from(buffer)
        };
    },

    /**
     * 5. 更新 Placeholder 對應設定
     */
    async updatePlaceholderSchema(templateId: string, schema: PlaceholderInfo[]) {
        return await prisma.documentTemplate.update({
            where: { id: templateId },
            data: { placeholderSchema: schema as any } as any
        });
    },

    /**
     * 6. 取得範本的 Placeholder 資訊
     */
    async getPlaceholderSchema(templateId: string): Promise<PlaceholderInfo[]> {
        const template = await prisma.documentTemplate.findUnique({
            where: { id: templateId }
        });
        if (!template) throw new Error("Template not found");

        return ((template as any).placeholderSchema as PlaceholderInfo[]) || [];
    },

    /**
     * 7. 列表所有模板
     */
    async listTemplates(category?: string) {
        return await prisma.documentTemplate.findMany({
            where: {
                isActive: true,
                ...(category ? { category } : {})
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    /**
     * 8. 取得系統可用欄位列表
     */
    getAvailableFields(): { key: string; description: string; category: string }[] {
        return [
            // Worker 相關
            { key: 'worker_name_en', description: '移工英文姓名', category: '移工資料' },
            { key: 'worker_name_cn', description: '移工中文姓名', category: '移工資料' },
            { key: 'worker_nationality', description: '移工國籍', category: '移工資料' },
            { key: 'worker_gender', description: '移工性別', category: '移工資料' },
            { key: 'worker_dob', description: '移工出生日期', category: '移工資料' },
            { key: 'worker_mobile', description: '移工手機', category: '移工資料' },

            // 證件相關
            { key: 'passport_no', description: '護照號碼', category: '證件資料' },
            { key: 'passport_issue_date', description: '護照核發日', category: '證件資料' },
            { key: 'passport_expiry_date', description: '護照效期', category: '證件資料' },
            { key: 'arc_no', description: '居留證號碼', category: '證件資料' },
            { key: 'visa_no', description: '簽證號碼', category: '證件資料' },

            // 雇主相關
            { key: 'employer_name', description: '雇主名稱', category: '雇主資料' },
            { key: 'employer_tax_id', description: '雇主統一編號', category: '雇主資料' },
            { key: 'employer_phone', description: '雇主電話', category: '雇主資料' },
            { key: 'employer_address', description: '雇主地址', category: '雇主資料' },
            { key: 'employer_rep', description: '雇主負責人', category: '雇主資料' },

            // 仲介相關
            { key: 'agency_name', description: '仲介公司名稱', category: '仲介資料' },
            { key: 'agency_license_no', description: '仲介許可證號', category: '仲介資料' },
            { key: 'agency_tax_id', description: '仲介統一編號', category: '仲介資料' },
            { key: 'agency_address', description: '仲介地址', category: '仲介資料' },
            { key: 'agency_phone', description: '仲介電話', category: '仲介資料' },

            // 聘僱相關
            { key: 'contract_start_date', description: '合約起始日', category: '聘僱資料' },
            { key: 'contract_end_date', description: '合約到期日', category: '聘僱資料' },
            { key: 'entry_date', description: '入境日期', category: '聘僱資料' },
            { key: 'basic_salary', description: '基本薪資', category: '聘僱資料' },

            // 宿舍相關
            { key: 'dorm_name', description: '宿舍名稱', category: '宿舍資料' },
            { key: 'dorm_address', description: '宿舍地址', category: '宿舍資料' },

            // 系統欄位
            { key: 'today', description: '今日日期', category: '系統欄位' },
            { key: 'current_year', description: '當年度', category: '系統欄位' },
            { key: 'current_month', description: '當月份', category: '系統欄位' },
        ];
    },

    /**
     * 9. 批次產生入國通報文件包
     */
    async generateEntryPackage(workerId: string, templateIds?: string[]) {
        // 如果未指定範本，取得所有入國通報類別範本
        let templates;
        if (templateIds && templateIds.length > 0) {
            templates = await prisma.documentTemplate.findMany({
                where: { id: { in: templateIds }, isActive: true }
            });
        } else {
            templates = await prisma.documentTemplate.findMany({
                where: { category: 'entry_notification', isActive: true }
            });
        }

        if (templates.length === 0) {
            throw new Error('找不到可用的入國通報範本');
        }

        const results: { filename: string; buffer: Buffer }[] = [];
        const context = await buildWorkerDocumentContext(workerId);

        for (const template of templates) {
            try {
                const fullPath = path.join(TEMPLATE_DIR, template.filePath);
                if (!fs.existsSync(fullPath)) continue;

                let result;
                if ((template as any).fileFormat === 'xlsx') {
                    result = await this.generateXlsxDocument(fullPath, template.name, context);
                } else {
                    result = await this.generateDocxDocument(fullPath, template.name, context);
                }
                results.push(result);
            } catch (err) {
                console.error(`產生範本 ${template.name} 失敗:`, err);
            }
        }

        return results;
    },

    // Helper: 取得 Excel 欄位字母
    getColumnLetter(colNumber: number): string {
        let letter = '';
        let temp = colNumber;
        while (temp > 0) {
            temp--;
            letter = String.fromCharCode((temp % 26) + 65) + letter;
            temp = Math.floor(temp / 26);
        }
        return letter;
    }
};