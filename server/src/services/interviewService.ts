import prisma from '../prisma';
import { subMonths } from 'date-fns';

// Map frontend uppercase status to Prisma lowercase enum
const mapResultToEnum = (result?: string) => {
    const map: Record<string, string> = {
        'PENDING': 'pending',
        'SELECTED': 'selected',
        'WAITLIST': 'waitlist',
        'REJECTED': 'rejected',
    };
    return result ? (map[result] || 'pending') : 'pending';
};

export const interviewService = {
    /**
     * Check if candidate has interviewed with this employer in the last 6 months
     */
    async checkDuplicateInterview(candidateId: string, employerId: string) {
        const sixMonthsAgo = subMonths(new Date(), 6);

        // Find InterviewCandidate records where candidateId matches
        // AND the associated Interview -> JobOrder -> Employer matches
        const existingInterviewCandidate = await prisma.interviewCandidate.findFirst({
            where: {
                candidateId,
                interview: {
                    interviewDate: {
                        gte: sixMonthsAgo,
                    },
                    jobOrder: {
                        employerId: employerId
                    }
                }
            },
            include: {
                interview: true
            },
            orderBy: {
                interview: {
                    interviewDate: 'desc'
                }
            }
        });

        if (existingInterviewCandidate) {
            return {
                isDuplicate: true,
                lastInterview: existingInterviewCandidate.interview,
                warning: '此候選人在過去 6 個月內已面試過該雇主',
            };
        }

        return { isDuplicate: false };
    },

    /**
     * Get candidate interview history
     */
    async getInterviewHistory(candidateId: string) {
        // Find InterviewCandidate records for this candidate
        const records = await prisma.interviewCandidate.findMany({
            where: { candidateId },
            include: {
                interview: {
                    include: {
                        jobOrder: {
                            include: {
                                employer: {
                                    select: { id: true, companyName: true },
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                interview: {
                    interviewDate: 'desc'
                }
            }
        });

        // Flatten structure to match frontend expectation
        return records.map(record => ({
            id: record.id,
            interviewDate: record.interview.interviewDate,
            result: record.result.toUpperCase(),
            notes: record.remarks,
            employer: record.interview.jobOrder?.employer,
            jobOrder: {
                id: record.interview.jobOrder?.id,
                title: record.interview.jobOrder?.title
            }
        }));
    },

    /**
     * Create interview record with duplicate checking
     * Creates an Interview event AND an InterviewCandidate record
     */
    async createInterview(data: {
        candidateId: string;
        employerId: string;
        jobOrderId: string;
        interviewDate: Date;
        result?: string;
        notes?: string;
        interviewerName?: string;
    }) {
        // Check for duplicate
        const dupCheck = await this.checkDuplicateInterview(data.candidateId, data.employerId);

        if (dupCheck.isDuplicate) {
            console.warn(dupCheck.warning);
        }

        // Create Interview and nested Candidate
        return prisma.interview.create({
            data: {
                jobOrderId: data.jobOrderId,
                interviewDate: data.interviewDate,
                interviewer: data.interviewerName,
                candidates: {
                    create: {
                        candidateId: data.candidateId,
                        result: mapResultToEnum(data.result) as any, // Cast to enum
                        remarks: data.notes
                    }
                }
            },
            include: {
                jobOrder: {
                    include: {
                        employer: {
                            select: { id: true, companyName: true }
                        }
                    }
                },
                candidates: {
                    include: {
                        candidate: {
                            select: { id: true, nameZh: true, nameEn: true, passportNo: true }
                        }
                    }
                }
            },
        });
    },

    /**
     * Update interview result
     * Updates the InterviewCandidate record (finding it via Interview ID and Candidate? No, ID is Interview ID)
     * If ID passed is Interview ID, we need to find the child InterviewCandidate.
     * But usually we update the Specific Candidate's result.
     */
    async updateInterview(id: string, data: { result?: string; notes?: string }) {
        // Assuming `id` passed from frontend is the Interview ID (the event)
        // BUT we need to update the result which is on `InterviewCandidate`.
        // If we assume 1-on-1 interview for this phase, we update the first candidate.

        // Find the interview's candidate record
        const interview = await prisma.interview.findUnique({
            where: { id },
            include: { candidates: true }
        });

        if (!interview || interview.candidates.length === 0) {
            throw new Error('Interview record not found');
        }

        const candidateRecordId = interview.candidates[0].id;

        return prisma.interviewCandidate.update({
            where: { id: candidateRecordId },
            data: {
                result: data.result ? (mapResultToEnum(data.result) as any) : undefined,
                remarks: data.notes
            }
        });
    },
};
