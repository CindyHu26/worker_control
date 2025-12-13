
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// Helper to get a demo user ID (since we don't have full auth context passed yet)
// In prod, this comes from req.user
const getDemoUserId = async () => {
    const user = await prisma.internalUser.findFirst();
    return user?.id;
};

// GET /api/notifications
// List mentions for current user
router.get('/', async (req, res) => {
    try {
        const userId = await getDemoUserId();
        if (!userId) return res.json([]);

        const mentions = await prisma.commentMention.findMany({
            where: {
                mentionedUserId: userId,
                // Optional: filter unread only? or return all recent
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

        // Format for frontend
        const notifications = mentions.map(m => ({
            id: m.id,
            type: 'mention',
            isRead: m.isRead,
            createdAt: m.createdAt,
            actorName: m.comment.author.username,
            content: `mentioned you: "${m.comment.content.substring(0, 50)}${m.comment.content.length > 50 ? '...' : ''}"`,
            referenceId: m.comment.recordId,
            referenceType: m.comment.recordTableName
        }));

        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// POST /api/notifications/:id/read
router.post('/:id/read', async (req, res) => {
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
router.post('/read-all', async (req, res) => {
    try {
        const userId = await getDemoUserId();
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
