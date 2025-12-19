
import { Router } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to get user ID from request or fallback to first admin
const getUserId = async (req: AuthRequest) => {
    if (req.user?.id) return req.user.id;

    // Fallback for development with error handling
    try {
        const user = await prisma.internalUser.findFirst({
            where: { role: 'admin' }
        });
        return user?.id;
    } catch (error) {
        console.error('[getUserId] Error fetching user:', error);
        return null;
    }
};

// GET /api/notifications
// List mentions for current user
router.get('/', async (req: AuthRequest, res) => {
    try {
        const userId = await getUserId(req);
        console.log('[Notifications] Fetching for userId:', userId);
        if (!userId) return res.json([]);

        const mentions = await prisma.commentMention.findMany({
            where: {
                mentionedUserId: userId,
            },
            include: {
                comment: {
                    include: {
                        author: {
                            select: { username: true, email: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        console.log(`[Notifications] Found ${mentions.length} mentions`);

        // Format for frontend
        const notifications = mentions.map(m => {
            if (!m.comment?.author) {
                console.warn('[Notifications] Mention missing comment or author:', m.id);
                return {
                    id: m.id,
                    type: 'mention',
                    isRead: m.isRead,
                    createdAt: m.createdAt,
                    actorName: 'System',
                    content: `mentioned you`,
                    referenceId: m.comment?.recordId,
                    referenceType: m.comment?.recordTableName
                };
            }
            return {
                id: m.id,
                type: 'mention',
                isRead: m.isRead,
                createdAt: m.createdAt,
                actorName: m.comment.author.username,
                content: `mentioned you: "${m.comment.content.substring(0, 50)}${m.comment.content.length > 50 ? '...' : ''}"`,
                referenceId: m.comment.recordId,
                referenceType: m.comment.recordTableName
            };
        });

        res.json(notifications);
    } catch (error) {
        console.error('[Notifications] Error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// POST /api/notifications/:id/read
router.post('/:id/read', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        await prisma.commentMention.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// POST /api/notifications/read-all
router.post('/read-all', async (req: AuthRequest, res) => {
    try {
        const userId = await getUserId(req);
        if (!userId) return res.status(400).json({ error: 'No user' });

        await prisma.commentMention.updateMany({
            where: { mentionedUserId: userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark all read' });
    }
});

export default router;
