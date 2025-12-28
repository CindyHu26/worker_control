import prisma from '../prisma';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

// ==========================================
// Invoice Service - Invoice Management & Excel Export
// ==========================================

export interface CreateInvoiceInput {
    payerType: 'EMPLOYER' | 'WORKER';
    payerId: string;
    dueDate: Date;
    receivableIds: string[];
    notes?: string;
    createdBy: string;
}

export interface InvoiceQueryFilter {
    payerType?: 'EMPLOYER' | 'WORKER';
    payerIds?: string[];
    status?: string[];
    dateRange?: { start: Date; end: Date };
}

class InvoiceService {
    // ==========================================
    // Invoice Number Generation
    // ==========================================

    /**
     * Generate unique invoice number: INV-YYYYMMDD-XXXX
     */
    async generateInvoiceNumber(): Promise<string> {
        const today = format(new Date(), 'yyyyMMdd');
        const prefix = `INV-${today}-`;

        // Find the highest sequence number for today
        const lastInvoice = await (prisma as any).invoice.findFirst({
            where: {
                invoiceNo: { startsWith: prefix }
            },
            orderBy: { invoiceNo: 'desc' }
        });

        let sequence = 1;
        if (lastInvoice) {
            const lastSeq = parseInt(lastInvoice.invoiceNo.split('-').pop() || '0');
            sequence = lastSeq + 1;
        }

        return `${prefix}${String(sequence).padStart(4, '0')}`;
    }

    // ==========================================
    // CRUD Operations
    // ==========================================

    /**
     * Create a new invoice from selected receivables
     */
    async createInvoice(input: CreateInvoiceInput) {
        // Validate receivables exist and are unpaid
        const receivables = await (prisma as any).receivable.findMany({
            where: {
                id: { in: input.receivableIds },
                status: { in: ['PENDING', 'PARTIAL'] }
            },
            include: {
                worker: { select: { id: true, englishName: true } },
                employer: { select: { id: true, companyName: true } },
                itemDefinition: true,
                transactions: { where: { isVoided: false } }
            }
        });

        if (receivables.length === 0) {
            throw new Error('No valid receivables found');
        }

        // Calculate total amount (outstanding balance for each receivable)
        let totalAmount = 0;
        const invoiceItems: Array<{ receivableId: string; amount: number }> = [];

        for (const r of receivables) {
            const paidAmount = r.transactions.reduce(
                (sum: number, t: any) => sum + Number(t.amount), 0
            );
            const outstanding = Number(r.amount) - paidAmount;

            if (outstanding > 0) {
                totalAmount += outstanding;
                invoiceItems.push({
                    receivableId: r.id,
                    amount: outstanding
                });
            }
        }

        if (invoiceItems.length === 0) {
            throw new Error('All selected receivables are already paid');
        }

        const invoiceNo = await this.generateInvoiceNumber();

        // Create invoice with items
        const invoice = await (prisma as any).invoice.create({
            data: {
                invoiceNo,
                payerType: input.payerType,
                payerId: input.payerId,
                dueDate: input.dueDate,
                totalAmount,
                status: 'DRAFT',
                notes: input.notes,
                createdBy: input.createdBy,
                items: {
                    create: invoiceItems
                }
            },
            include: {
                items: {
                    include: {
                        receivable: {
                            include: {
                                worker: { select: { id: true, englishName: true } },
                                employer: { select: { id: true, companyName: true } },
                                itemDefinition: true
                            }
                        }
                    }
                }
            }
        });

        return invoice;
    }

    /**
     * Get invoice by ID with all details
     */
    async getInvoiceById(id: string) {
        return (prisma as any).invoice.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        receivable: {
                            include: {
                                worker: { select: { id: true, englishName: true, chineseName: true } },
                                employer: { select: { id: true, companyName: true } },
                                itemDefinition: true
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * List invoices with filtering
     */
    async listInvoices(filter: InvoiceQueryFilter) {
        const where: Record<string, unknown> = {};

        if (filter.payerType) {
            where.payerType = filter.payerType;
        }

        if (filter.payerIds && filter.payerIds.length > 0) {
            where.payerId = { in: filter.payerIds };
        }

        if (filter.status && filter.status.length > 0) {
            where.status = { in: filter.status };
        }

        if (filter.dateRange) {
            where.issueDate = {
                gte: filter.dateRange.start,
                lte: filter.dateRange.end
            };
        }

        return (prisma as any).invoice.findMany({
            where,
            include: {
                items: {
                    include: {
                        receivable: {
                            include: {
                                worker: { select: { id: true, englishName: true } },
                                employer: { select: { id: true, companyName: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { issueDate: 'desc' }
        });
    }

    /**
     * Update invoice status
     */
    async updateInvoiceStatus(id: string, status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED') {
        return (prisma as any).invoice.update({
            where: { id },
            data: { status }
        });
    }

    // ==========================================
    // Excel Export
    // ==========================================

    /**
     * Generate Excel file for a single invoice
     */
    async generateInvoiceExcel(id: string): Promise<Buffer> {
        const invoice = await this.getInvoiceById(id);

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        // Get payer info
        let payerName = '';
        if (invoice.payerType === 'EMPLOYER') {
            const employer = await prisma.employer.findUnique({
                where: { id: invoice.payerId },
                select: { companyName: true }
            });
            payerName = employer?.companyName || 'Unknown';
        } else {
            const worker = await prisma.worker.findUnique({
                where: { id: invoice.payerId },
                select: { englishName: true }
            });
            payerName = worker?.englishName || 'Unknown';
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('請款單');

        // Set column widths
        sheet.columns = [
            { width: 5 },   // 序號
            { width: 15 },  // 員工
            { width: 12 },  // 帳期
            { width: 20 },  // 科目
            { width: 12 },  // 應收日
            { width: 15 },  // 金額
        ];

        // Header
        sheet.mergeCells('A1:F1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '請款單';
        titleCell.font = { size: 18, bold: true };
        titleCell.alignment = { horizontal: 'center' };

        // Invoice info
        sheet.getCell('A3').value = `請款單號: ${invoice.invoiceNo}`;
        sheet.getCell('A4').value = `付款人: ${payerName} (${invoice.payerType === 'EMPLOYER' ? '雇主' : '員工'})`;
        sheet.getCell('A5').value = `開立日期: ${format(invoice.issueDate, 'yyyy-MM-dd')}`;
        sheet.getCell('D5').value = `到期日: ${format(invoice.dueDate, 'yyyy-MM-dd')}`;

        // Table header
        const headerRow = sheet.getRow(7);
        headerRow.values = ['#', '員工', '帳期', '科目', '應收日', '金額'];
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Data rows
        let rowNum = 8;
        for (let i = 0; i < invoice.items.length; i++) {
            const item = invoice.items[i];
            const r = item.receivable;

            const row = sheet.getRow(rowNum);
            row.values = [
                i + 1,
                r.worker?.englishName || '-',
                r.billingCycle,
                r.itemName,
                format(r.dueDate, 'yyyy-MM-dd'),
                Number(item.amount)
            ];

            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Format amount as currency
            row.getCell(6).numFmt = '#,##0.00';

            rowNum++;
        }

        // Total row
        const totalRow = sheet.getRow(rowNum);
        sheet.mergeCells(`A${rowNum}:E${rowNum}`);
        totalRow.getCell(1).value = '總計';
        totalRow.getCell(1).font = { bold: true };
        totalRow.getCell(1).alignment = { horizontal: 'right' };
        totalRow.getCell(6).value = Number(invoice.totalAmount);
        totalRow.getCell(6).numFmt = '#,##0.00';
        totalRow.getCell(6).font = { bold: true };
        totalRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFF0C4' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Notes
        if (invoice.notes) {
            sheet.getCell(`A${rowNum + 2}`).value = `備註: ${invoice.notes}`;
        }

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as unknown as Buffer;
    }

    /**
     * Generate Excel report for receivables (多維度報表)
     */
    async generateReceivablesReportExcel(filter: {
        employerIds?: string[];
        workerIds?: string[];
        itemDefinitionIds?: string[];
        startDate?: Date;
        endDate?: Date;
        status?: string[];
    }): Promise<Buffer> {
        const where: Record<string, unknown> = {};

        if (filter.employerIds && filter.employerIds.length > 0 && !filter.employerIds.includes('all')) {
            where.employerId = { in: filter.employerIds };
        }

        if (filter.workerIds && filter.workerIds.length > 0 && !filter.workerIds.includes('all')) {
            where.workerId = { in: filter.workerIds };
        }

        if (filter.itemDefinitionIds && filter.itemDefinitionIds.length > 0) {
            where.itemDefinitionId = { in: filter.itemDefinitionIds };
        }

        if (filter.startDate && filter.endDate) {
            where.dueDate = {
                gte: filter.startDate,
                lte: filter.endDate
            };
        }

        if (filter.status && filter.status.length > 0) {
            where.status = { in: filter.status };
        }

        const receivables = await (prisma as any).receivable.findMany({
            where,
            include: {
                worker: { select: { id: true, englishName: true, chineseName: true } },
                employer: { select: { id: true, companyName: true } },
                itemDefinition: true,
                transactions: { where: { isVoided: false } }
            },
            orderBy: [{ dueDate: 'asc' }, { employerId: 'asc' }]
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('帳款明細');

        // Set column widths
        sheet.columns = [
            { width: 5 },   // 序號
            { width: 25 },  // 雇主
            { width: 20 },  // 員工
            { width: 10 },  // 帳期
            { width: 20 },  // 科目
            { width: 12 },  // 應收日
            { width: 12 },  // 應收金額
            { width: 12 },  // 已收金額
            { width: 12 },  // 差異
            { width: 10 },  // 狀態
        ];

        // Header
        sheet.mergeCells('A1:J1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '帳款明細報表';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };

        // Date range
        if (filter.startDate && filter.endDate) {
            sheet.getCell('A2').value = `期間: ${format(filter.startDate, 'yyyy-MM-dd')} ~ ${format(filter.endDate, 'yyyy-MM-dd')}`;
        }

        // Table header
        const headerRow = sheet.getRow(4);
        headerRow.values = ['#', '雇主', '員工', '帳期', '科目', '應收日', '應收金額', '已收金額', '差異', '狀態'];
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Data rows
        let rowNum = 5;
        let totalAR = 0;
        let totalPaid = 0;

        for (let i = 0; i < receivables.length; i++) {
            const r = receivables[i];
            const paidAmount = r.transactions.reduce(
                (sum: number, t: any) => sum + Number(t.amount), 0
            );
            const balance = Number(r.amount) - paidAmount;

            totalAR += Number(r.amount);
            totalPaid += paidAmount;

            const row = sheet.getRow(rowNum);
            row.values = [
                i + 1,
                r.employer?.companyName || '-',
                r.worker?.englishName || '-',
                r.billingCycle,
                r.itemName,
                format(r.dueDate, 'yyyy-MM-dd'),
                Number(r.amount),
                paidAmount,
                balance,
                this.getStatusLabel(r.status)
            ];

            row.eachCell((cell, colNum) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                // Format currency columns
                if (colNum >= 7 && colNum <= 9) {
                    cell.numFmt = '#,##0.00';
                }
            });

            rowNum++;
        }

        // Summary row
        const summaryRow = sheet.getRow(rowNum + 1);
        sheet.mergeCells(`A${rowNum + 1}:F${rowNum + 1}`);
        summaryRow.getCell(1).value = '合計';
        summaryRow.getCell(1).font = { bold: true };
        summaryRow.getCell(1).alignment = { horizontal: 'right' };
        summaryRow.getCell(7).value = totalAR;
        summaryRow.getCell(8).value = totalPaid;
        summaryRow.getCell(9).value = totalAR - totalPaid;
        summaryRow.eachCell((cell, colNum) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFF0C4' }
            };
            if (colNum >= 7 && colNum <= 9) {
                cell.numFmt = '#,##0.00';
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as unknown as Buffer;
    }

    private getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'PENDING': '待收',
            'PARTIAL': '部分收款',
            'PAID': '已收',
            'CANCELLED': '已取消'
        };
        return labels[status] || status;
    }
}

export const invoiceService = new InvoiceService();
