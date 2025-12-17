import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import prisma from '../prisma'; // [修正]
import { getDocumentContext } from '../utils/documentContext';

// 設定模板儲存目錄
const TEMPLATE_DIR = path.join(__dirname, '../../storage/templates');

// 確保目錄存在
if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
}

export const templateService = {
    /**
     * 1. 上傳模板
     */
    async uploadTemplate(file: Express.Multer.File, meta: { name: string; category: string; code?: string }) {
        const filename = `${Date.now()}_${file.originalname}`;
        const filePath = path.join(TEMPLATE_DIR, filename);

        // 寫入檔案
        fs.writeFileSync(filePath, file.buffer);

        // 寫入資料庫
        return await prisma.documentTemplate.create({
            data: {
                name: meta.name,
                category: meta.category,
                filePath: filename, // 只存檔名，路徑動態組
            }
        });
    },

    /**
     * 2. 產生文件 (核心功能)
     * @param templateId 模板ID
     * @param contextType 資料情境 (worker, employer, recruitment...)
     * @param contextId 資料ID (workerId, employerId...)
     */
    async generateDocument(templateId: string, contextType: string, contextId: string) {
        // A. 取得模板資訊
        const templateRecord = await prisma.documentTemplate.findUnique({
            where: { id: templateId }
        });
        if (!templateRecord) throw new Error("Template not found");

        const fullPath = path.join(TEMPLATE_DIR, templateRecord.filePath);
        if (!fs.existsSync(fullPath)) throw new Error("Template file missing on server");

        // B. 讀取 Word 內容
        const content = fs.readFileSync(fullPath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // C. 取得填充資料 (使用您現有的 documentContext)
        // 這裡我們會根據 contextId 抓取所有相關資料 (雇主、移工、仲介...)
        const data = await getDocumentContext(contextType, contextId);

        console.log("Generating doc with data:", JSON.stringify(data, null, 2)); // Debug用

        // D. 渲染 (Render)
        try {
            doc.render(data);
        } catch (error: any) {
            // 處理 docxtemplater 的錯誤 (通常是變數名稱打錯)
            throw new Error(`Template Render Error: ${JSON.stringify(error.properties)}`);
        }

        // E. 產生 Buffer
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        return {
            filename: `Generated_${templateRecord.name}.docx`,
            buffer: buf
        };
    },

    /**
     * 3. 列表所有模板
     */
    async listTemplates(category?: string) {
        return await prisma.documentTemplate.findMany({
            where: {
                isActive: true,
                ...(category ? { category } : {})
            },
            orderBy: { createdAt: 'desc' }
        });
    }
};