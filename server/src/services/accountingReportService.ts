import prisma from '../prisma';
import { format, addMonths, startOfMonth, endOfMonth, isFuture, isPast } from 'date-fns';

// ==========================================
// Accounting Report Service - Forecast & Historical Reports
// ==========================================

export interface ForecastFilter {
    employerIds?: string[];
    workerIds?: string[];
    startMonth: string; // 'YYYY-MM'
    endMonth: string;   // 'YYYY-MM'
}

export interface ForecastRow {
    period: string;
    employer: string;
    worker: string;
    itemName: string;
    plannedAmount: number;
    actualAmount: number;
    status: 'PAST' | 'CURRENT' | 'FUTURE';
    isPaid: boolean;
}

class AccountingReportService {
    /**
     * Generate historical + future forecast report
     * Combines actual receivables (past/present) with projected billing plan items (future)
     */
    async generateForecastReport(filter: ForecastFilter): Promise<ForecastRow[]> {
        const startDate = new Date(`${filter.startMonth}-01`);
        const endDate = endOfMonth(new Date(`${filter.endMonth}-01`));
        const today = new Date();
        const currentMonth = format(today, 'yyyy-MM');

        // Build where clause for receivables
        const receivableWhere: Record<string, unknown> = {
            dueDate: {
                gte: startDate,
                lte: endDate
            }
        };

        if (filter.employerIds && filter.employerIds.length > 0 && !filter.employerIds.includes('all')) {
            receivableWhere.employerId = { in: filter.employerIds };
        }
        if (filter.workerIds && filter.workerIds.length > 0 && !filter.workerIds.includes('all')) {
            receivableWhere.workerId = { in: filter.workerIds };
        }

        // 1. Get actual receivables (past + current)
        const receivables = await (prisma as any).receivable.findMany({
            where: receivableWhere,
            include: {
                worker: { select: { id: true, englishName: true } },
                employer: { select: { id: true, companyName: true } },
                transactions: { where: { isVoided: false } }
            },
            orderBy: [{ dueDate: 'asc' }, { employerId: 'asc' }]
        });

        // 2. Get billing plan items for future periods
        const billingPlanWhere: Record<string, unknown> = {
            billingDate: {
                gte: startDate,
                lte: endDate
            }
        };

        // If employer/worker filters are provided, we need to join through billingPlan -> deployment
        const billingPlanItems = await prisma.billingPlanItem.findMany({
            where: billingPlanWhere,
            include: {
                billingPlan: {
                    include: {
                        deployment: {
                            include: {
                                worker: { select: { id: true, englishName: true } },
                                employer: { select: { id: true, companyName: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { billingDate: 'asc' }
        });

        // Filter billing plan items by employer/worker if specified
        const filteredPlanItems = billingPlanItems.filter(item => {
            const deployment = item.billingPlan.deployment;
            if (filter.employerIds && filter.employerIds.length > 0 && !filter.employerIds.includes('all')) {
                if (!filter.employerIds.includes(deployment.employerId)) return false;
            }
            if (filter.workerIds && filter.workerIds.length > 0 && !filter.workerIds.includes('all')) {
                if (!filter.workerIds.includes(deployment.workerId)) return false;
            }
            return true;
        });

        // 3. Build unified report rows
        const reportRows: ForecastRow[] = [];

        // Add receivable rows (actual data)
        for (const r of receivables) {
            const period = format(r.dueDate, 'yyyy-MM');
            const paidAmount = r.transactions.reduce(
                (sum: number, t: any) => sum + Number(t.amount), 0
            );

            let status: 'PAST' | 'CURRENT' | 'FUTURE';
            if (period < currentMonth) {
                status = 'PAST';
            } else if (period === currentMonth) {
                status = 'CURRENT';
            } else {
                status = 'FUTURE';
            }

            reportRows.push({
                period,
                employer: r.employer?.companyName || '-',
                worker: r.worker?.englishName || '-',
                itemName: r.itemName,
                plannedAmount: Number(r.amount),
                actualAmount: paidAmount,
                status,
                isPaid: r.status === 'PAID'
            });
        }

        // Add future billing plan items (projected data - only for future periods not in receivables)
        const receivableKeys = new Set(
            receivables.map((r: any) =>
                `${r.workerId}-${format(r.dueDate, 'yyyy-MM')}-${r.itemName}`
            )
        );

        for (const item of filteredPlanItems) {
            const period = format(item.billingDate, 'yyyy-MM');

            // Skip if we already have a receivable for this
            const key = `${item.billingPlan.deployment.workerId}-${period}-${item.itemCategory}`;
            if (receivableKeys.has(key)) continue;

            // Only include future periods
            if (period <= currentMonth) continue;

            const deployment = item.billingPlan.deployment;

            reportRows.push({
                period,
                employer: deployment.employer.companyName,
                worker: deployment.worker.englishName,
                itemName: item.description || item.itemCategory,
                plannedAmount: Number(item.amount),
                actualAmount: 0,
                status: 'FUTURE',
                isPaid: false
            });
        }

        // Sort by period, employer, worker
        reportRows.sort((a, b) => {
            if (a.period !== b.period) return a.period.localeCompare(b.period);
            if (a.employer !== b.employer) return a.employer.localeCompare(b.employer);
            return a.worker.localeCompare(b.worker);
        });

        return reportRows;
    }

    /**
     * Get summary statistics for a period range
     */
    async getForecastSummary(filter: ForecastFilter): Promise<{
        pastTotal: number;
        pastPaid: number;
        currentTotal: number;
        currentPaid: number;
        futureProjected: number;
    }> {
        const rows = await this.generateForecastReport(filter);

        const summary = {
            pastTotal: 0,
            pastPaid: 0,
            currentTotal: 0,
            currentPaid: 0,
            futureProjected: 0
        };

        for (const row of rows) {
            switch (row.status) {
                case 'PAST':
                    summary.pastTotal += row.plannedAmount;
                    summary.pastPaid += row.actualAmount;
                    break;
                case 'CURRENT':
                    summary.currentTotal += row.plannedAmount;
                    summary.currentPaid += row.actualAmount;
                    break;
                case 'FUTURE':
                    summary.futureProjected += row.plannedAmount;
                    break;
            }
        }

        return summary;
    }

    /**
     * Get period-wise aggregation for charts
     */
    async getMonthlyAggregation(filter: ForecastFilter): Promise<Array<{
        period: string;
        planned: number;
        actual: number;
        variance: number;
    }>> {
        const rows = await this.generateForecastReport(filter);

        const monthlyData: Record<string, { planned: number; actual: number }> = {};

        for (const row of rows) {
            if (!monthlyData[row.period]) {
                monthlyData[row.period] = { planned: 0, actual: 0 };
            }
            monthlyData[row.period].planned += row.plannedAmount;
            monthlyData[row.period].actual += row.actualAmount;
        }

        return Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, data]) => ({
                period,
                planned: data.planned,
                actual: data.actual,
                variance: data.planned - data.actual
            }));
    }
}

export const accountingReportService = new AccountingReportService();
