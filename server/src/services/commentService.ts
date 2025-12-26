/**
 * Comment Service - 討論串 CRUD 服務
 * Phase 7.1: Discussion Threads & @Mentions
 */

import prisma from '../prisma';

// Define types locally until Prisma client is regenerated
export type CommentEntityType = 'WORKER' | 'EMPLOYER' | 'DEPLOYMENT' | 'JOB_ORDER' | 'LEAD';

export interface CreateCommentInput {
    entityType: CommentEntityType;
    entityId: string;
    content: string;
    authorId: string;
    mentionedUserIds?: string[];
}

export interface CommentWithAuthor {
    id: string;
    entityType: string;
    entityId: string;
    content: string;
    authorId: string;
    author: {
        id: string;
        username: string;
        email: string;
    };
    mentions: {
        id: string;
        userId: string;
        isRead: boolean;
        user: {
            id: string;
            username: string;
        };
    }[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 建立留言 (含 @提及處理)
 */
export async function createComment(input: CreateCommentInput): Promise<CommentWithAuthor> {
    const { entityType, entityId, content, authorId, mentionedUserIds = [] } = input;

    const comment = await (prisma as any).systemComment.create({
        data: {
            entityType,
            entityId,
            content,
            authorId,
            mentions: {
                create: mentionedUserIds.map(userId => ({
                    userId,
                })),
            },
        },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                },
            },
            mentions: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            },
        },
    });

    return comment;
}

/**
 * 取得特定實體的所有留言
 */
export async function getCommentsByEntity(
    entityType: CommentEntityType,
    entityId: string
): Promise<CommentWithAuthor[]> {
    const comments = await (prisma as any).systemComment.findMany({
        where: {
            entityType,
            entityId,
            isDeleted: false,
        },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                },
            },
            mentions: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    });

    return comments;
}

/**
 * 軟刪除留言
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
    // 檢查是否為作者
    const comment = await (prisma as any).systemComment.findUnique({
        where: { id: commentId },
        select: { authorId: true },
    });

    if (!comment) {
        throw new Error('留言不存在');
    }

    if (comment.authorId !== userId) {
        throw new Error('您只能刪除自己的留言');
    }

    await (prisma as any).systemComment.update({
        where: { id: commentId },
        data: { isDeleted: true },
    });
}

/**
 * 取得使用者未讀的 @提及
 */
export async function getUnreadMentions(userId: string) {
    const mentions = await (prisma as any).commentMention.findMany({
        where: {
            userId,
            isRead: false,
            comment: {
                isDeleted: false,
            },
        },
        include: {
            comment: {
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return mentions;
}

/**
 * 標記 @提及為已讀
 */
export async function markMentionAsRead(mentionId: string, userId: string): Promise<void> {
    const mention = await (prisma as any).commentMention.findUnique({
        where: { id: mentionId },
        select: { userId: true },
    });

    if (!mention) {
        throw new Error('提及記錄不存在');
    }

    if (mention.userId !== userId) {
        throw new Error('您只能標記自己的提及為已讀');
    }

    await (prisma as any).commentMention.update({
        where: { id: mentionId },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });
}

/**
 * 標記實體所有提及為已讀
 */
export async function markAllMentionsAsRead(userId: string): Promise<number> {
    const result = await (prisma as any).commentMention.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return result.count;
}

/**
 * 搜尋可 @提及的使用者
 */
export async function searchMentionableUsers(query: string, limit = 10) {
    const users = await prisma.internalUser.findMany({
        where: {
            OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            username: true,
            email: true,
        },
        take: limit,
    });

    return users;
}
