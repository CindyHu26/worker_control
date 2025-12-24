import prisma from '../prisma';
import { Prisma } from '../generated/client';

export const candidateService = {
    /**
     * Search candidates with pagination
     */
    async searchCandidates(params: {
        page?: number;
        limit?: number;
        status?: string;
        nationality?: string;
        search?: string;
    }) {
        const { page = 1, limit = 50, status, nationality, search } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.CandidateWhereInput = {};

        if (status) {
            where.status = status as any;
        }

        if (nationality) {
            where.nationality = nationality;
        }

        if (search) {
            where.OR = [
                { nameZh: { contains: search, mode: 'insensitive' } },
                { nameEn: { contains: search, mode: 'insensitive' } },
                { passportNo: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.candidate.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.candidate.count({ where }),
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    /**
     * Check for duplicate candidate
     * Returns existing candidate if found
     */
    async checkDuplicate(passportNo?: string, nameZh?: string, birthDate?: Date) {
        if (passportNo) {
            const byPassport = await prisma.candidate.findUnique({
                where: { passportNo },
            });
            if (byPassport) {
                return { isDuplicate: true, candidate: byPassport, reason: '護照號碼重複' };
            }
        }

        if (nameZh && birthDate) {
            const byNameAndDob = await prisma.candidate.findFirst({
                where: {
                    nameZh,
                    birthDate,
                },
            });
            if (byNameAndDob) {
                return { isDuplicate: true, candidate: byNameAndDob, reason: '姓名與生日重複' };
            }
        }

        return { isDuplicate: false };
    },

    /**
     * Create a new candidate with duplicate checking
     */
    async createCandidate(data: Prisma.CandidateCreateInput) {
        // Check duplicate
        const duplicate = await this.checkDuplicate(
            data.passportNo,
            data.nameZh,
            data.birthDate as Date
        );

        if (duplicate.isDuplicate) {
            throw new Error(`候選人已存在：${duplicate.reason}`);
        }

        return prisma.candidate.create({ data });
    },

    /**
     * Import candidates from Excel data
     * Returns summary of imported, duplicates, and errors
     */
    async importFromExcel(rows: any[]) {
        const results = {
            imported: 0,
            duplicates: 0,
            errors: 0,
            details: [] as any[],
        };

        for (const row of rows) {
            try {
                // Map Excel columns to Candidate fields
                const candidateData: Prisma.CandidateCreateInput = {
                    nameZh: row['姓名'] || row['中文姓名'] || row['nameZh'],
                    nameEn: row['英文姓名'] || row['nameEn'],
                    gender: row['性別'] === '男' || row['gender'] === 'male' ? 'male' : 'female',
                    birthDate: new Date(row['生日'] || row['birthDate']),
                    nationality: row['國籍'] || row['nationality'] || 'IDN',
                    passportNo: row['護照號碼'] || row['passportNo'],
                    passportExpiry: row['護照效期'] ? new Date(row['護照效期']) : undefined,
                    height: row['身高'] ? parseInt(row['身高']) : undefined,
                    weight: row['體重'] ? parseInt(row['體重']) : undefined,
                    maritalStatus: row['婚姻'] || row['maritalStatus'],
                    education: row['學歷'] || row['education'],
                    skills: row['技能'] || row['skills'],
                    status: 'NEW',
                };

                // Check duplicate
                const dup = await this.checkDuplicate(
                    candidateData.passportNo,
                    candidateData.nameZh,
                    candidateData.birthDate as Date
                );

                if (dup.isDuplicate) {
                    results.duplicates++;
                    results.details.push({
                        row: row,
                        status: 'duplicate',
                        reason: dup.reason,
                    });
                    continue;
                }

                // Create
                await prisma.candidate.create({ data: candidateData });
                results.imported++;
                results.details.push({
                    row: row,
                    status: 'success',
                });
            } catch (error: any) {
                results.errors++;
                results.details.push({
                    row: row,
                    status: 'error',
                    error: error.message,
                });
            }
        }

        return results;
    },
};
