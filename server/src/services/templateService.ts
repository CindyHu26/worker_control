import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';
import prisma from '../prisma';
import { getDocumentContext, buildWorkerDocumentContext, getTemplateKeys } from '../utils/documentContext';
import { getPlaceholderByCategory, PLACEHOLDERS } from '../config/placeholders';

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
    employerId?: string;  // For employer-specific templates
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
                employerId: meta.employerId,
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
     * 7. 列表所有模板 (支援 Employer Scoping)
     */
    async listTemplates(category?: string, employerId?: string) {
        const whereCondition: any = {
            isActive: true,
            ...(category ? { category } : {})
        };

        // If employerId is provided, return universal templates + employer-specific templates
        if (employerId) {
            whereCondition.OR = [
                { employerId: null },           // Universal templates
                { employerId: employerId }      // Employer-specific templates
            ];
        } else {
            // If no employerId, only return universal templates
            whereCondition.employerId = null;
        }

        return await prisma.documentTemplate.findMany({
            where: whereCondition,
            include: {
                employer: {
                    select: {
                        id: true,
                        companyName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    /**
     * 8. 取得系統可用欄位列表
     */
    getAvailableFields(): { key: string; description: string; category: string }[] {
        return PLACEHOLDERS.map(p => ({
            key: p.key,
            description: p.label,
            category: p.category
        }));
    },

    /**
     * 9. 取得完整的 Placeholder Dictionary (用於前端對照表)
     */
    getPlaceholderDictionary() {
        return getPlaceholderByCategory();
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
    },

    /**
     * 10. 測試範本 (Test Template)
     */
    async testTemplate(templateId: string, testWorkerId: string) {
        const template = await prisma.documentTemplate.findUnique({
            where: { id: templateId }
        });
        if (!template) throw new Error('範本不存在');

        const fullPath = path.join(TEMPLATE_DIR, template.filePath);
        if (!fs.existsSync(fullPath)) throw new Error('範本檔案不存在');

        // 取得測試用移工資料
        const context = await buildWorkerDocumentContext(testWorkerId);
        const format = (template as any).fileFormat || 'docx';

        try {
            let result: { filename: string; buffer: Buffer };

            if (format === 'docx') {
                result = await this.generateDocxDocument(fullPath, template.name, context);
            } else if (format === 'xlsx') {
                result = await this.generateXlsxDocument(fullPath, template.name, context);
            } else {
                throw new Error(`不支援測試 ${format} 格式`);
            }

            // 返回測試結果與預覽資料
            return {
                success: true,
                filename: result.filename,
                buffer: result.buffer,
                placeholders: (template as any).placeholderSchema || [],
                contextSample: Object.keys(context).slice(0, 10).reduce((acc, key) => {
                    acc[key] = context[key];
                    return acc;
                }, {} as Record<string, any>)
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                placeholders: (template as any).placeholderSchema || []
            };
        }
    },

    /**
     * 11. 啟用範本 (Activate Template)
     */
    async activateTemplate(templateId: string, userId: string) {
        return await prisma.documentTemplate.update({
            where: { id: templateId },
            data: {
                isTested: true,
                isActive: true,
                activatedAt: new Date(),
                activatedBy: userId
            } as any
        });
    },

    /**
     * 12. 停用範本 (Deactivate Template)
     */
    async deactivateTemplate(templateId: string) {
        return await prisma.documentTemplate.update({
            where: { id: templateId },
            data: {
                isActive: false
            } as any
        });
    },

    /**
     * 13. 刪除範本 (Delete Template)
     */
    async deleteTemplate(templateId: string) {
        const template = await prisma.documentTemplate.findUnique({
            where: { id: templateId }
        });
        if (!template) throw new Error('範本不存在');

        // 刪除實體檔案
        const fullPath = path.join(TEMPLATE_DIR, template.filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        // 刪除資料庫記錄
        return await prisma.documentTemplate.delete({
            where: { id: templateId }
        });
    },

    /**
     * 14. 產生移工入境文件包 (Generate Worker Entry Documents)
     */
    async generateWorkerEntryDocuments(workerId: string, deploymentId?: string) {
        // 取得移工資料與受聘合約
        const worker = await prisma.worker.findUnique({
            where: { id: workerId },
            include: {
                deployments: {
                    orderBy: { startDate: 'desc' },
                    take: deploymentId ? undefined : 1,
                    where: deploymentId ? { id: deploymentId } : undefined,
                    include: {
                        employer: true,
                        contractType: true
                    }
                }
            }
        });

        if (!worker) throw new Error('找不到移工資料');
        if (!worker.deployments || worker.deployments.length === 0) {
            throw new Error('找不到受聘合約');
        }

        const deployment = worker.deployments[0];

        // 取得所有啟用的入境文件範本
        const templates = await prisma.documentTemplate.findMany({
            where: {
                isActive: true,
                category: 'entry_notification'
            }
        });

        if (templates.length === 0) {
            throw new Error('找不到可用的入境文件範本');
        }

        // 建立文件 context
        const context = await buildWorkerDocumentContext(workerId);

        // 批次產生文件
        const results: { filename: string; buffer: Buffer }[] = [];

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

                // 記錄產生的文件
                const generatedPath = path.join(GENERATED_DIR, `${Date.now()}_${result.filename}`);
                fs.writeFileSync(generatedPath, result.buffer);

                await (prisma as any).generatedDocument.create({
                    data: {
                        templateId: template.id,
                        workerId: workerId,
                        employerId: deployment.employerId,
                        fileName: result.filename,
                        filePath: generatedPath,
                        fileSize: result.buffer.length,
                        status: 'SUCCESS'
                    }
                });
            } catch (err) {
                console.error(`產生範本 ${template.name} 失敗:`, err);
            }
        }

        return {
            worker,
            deployment,
            documents: results
        };
    }
};