/**
 * Comments API Routes - 討論串 API
 * Phase 7.1: Discussion Threads & @Mentions
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as commentService from '../services/commentService';

const router = Router();

// Define enums locally until Prisma client is regenerated
const CommentEntityTypeEnum = z.enum(['WORKER', 'EMPLOYER', 'DEPLOYMENT', 'JOB_ORDER', 'LEAD']);

// Validation Schemas
const createCommentSchema = z.object({
    entityType: CommentEntityTypeEnum,
    entityId: z.string().uuid(),
    content: z.string().min(1, '留言內容不可為空'),
    authorId: z.string().uuid(),
    mentionedUserIds: z.array(z.string().uuid()).optional(),
});

/**
 * GET /api/comments/users/search
 * 搜尋可 @提及的使用者
 */
router.get('/users/search', async (req: Request, res: Response) => {
    try {
        const query = (req.query.q as string) || '';
        const limit = parseInt(req.query.limit as string) || 10;

        const users = await commentService.searchMentionableUsers(query, limit);

        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '搜尋使用者失敗',
        });
    }
});

/**
 * GET /api/comments/mentions/unread
 * 取得未讀 @提及
 */
router.get('/mentions/unread', async (req: Request, res: Response) => {
    try {
        // TODO: Get userId from authenticated user session
        const userId = req.query.userId as string || '00000000-0000-0000-0000-000000000000';

        const mentions = await commentService.getUnreadMentions(userId);

        res.json({
            success: true,
            data: mentions,
            count: mentions.length,
        });
    } catch (error) {
        console.error('Error fetching unread mentions:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '取得未讀提及失敗',
        });
    }
});

/**
 * PATCH /api/comments/mentions/:id/read
 * 標記為已讀
 */
router.patch('/mentions/:id/read', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // TODO: Get userId from authenticated user session
        const userId = req.body.userId || '00000000-0000-0000-0000-000000000000';

        await commentService.markMentionAsRead(id, userId);

        res.json({
            success: true,
            message: '已標記為已讀',
        });
    } catch (error) {
        console.error('Error marking mention as read:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '標記已讀失敗',
        });
    }
});

/**
 * POST /api/comments/mentions/read-all
 * 標記所有提及為已讀
 */
router.post('/mentions/read-all', async (req: Request, res: Response) => {
    try {
        // TODO: Get userId from authenticated user session
        const userId = req.body.userId || '00000000-0000-0000-0000-000000000000';

        const count = await commentService.markAllMentionsAsRead(userId);

        res.json({
            success: true,
            message: `已標記 ${count} 則提及為已讀`,
            count,
        });
    } catch (error) {
        console.error('Error marking all mentions as read:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '標記已讀失敗',
        });
    }
});

/**
 * GET /api/comments/:entityType/:entityId
 * 取得特定實體的討論串
 */
router.get('/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
        const { entityType, entityId } = req.params;

        // Validate entityType
        const validatedEntityType = CommentEntityTypeEnum.parse(entityType.toUpperCase());

        const comments = await commentService.getCommentsByEntity(
            validatedEntityType as commentService.CreateCommentInput['entityType'],
            entityId
        );

        res.json({
            success: true,
            data: comments,
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '取得留言失敗',
        });
    }
});

/**
 * POST /api/comments
 * 新增留言 (含 @提及)
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const validated = createCommentSchema.parse(req.body);

        const comment = await commentService.createComment(validated as commentService.CreateCommentInput);

        res.status(201).json({
            success: true,
            data: comment,
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: '資料驗證失敗',
                details: error.issues,
            });
        } else {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '新增留言失敗',
            });
        }
    }
});

/**
 * DELETE /api/comments/:id
 * 刪除留言
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // TODO: Get userId from authenticated user session
        const userId = req.body.userId || '00000000-0000-0000-0000-000000000000';

        await commentService.deleteComment(id, userId);

        res.json({
            success: true,
            message: '留言已刪除',
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '刪除留言失敗',
        });
    }
});

export default router;
