
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/comments/users/search
// Simple list for mention selector
router.get('/users/search', async (req, res) => {
    try {
        const users = await prisma.internalUser.findMany({
            select: {
                id: true,
                username: true,
                role: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /api/comments/:recordTable/:recordId
// Fetch comments for a record
router.get('/:recordTable/:recordId', async (req, res) => {
    try {
        const { recordTable, recordId } = req.params;

        const comments = await prisma.systemComment.findMany({
            where: {
                recordTableName: recordTable,
                recordId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        role: true
                    }
                },
                mentions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc' // Timeline order
            }
        });

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST /api/comments
router.post('/', async (req, res) => {
    try {
        const { recordId, recordTableName, content, mentionedUserIds, createdBy } = req.body;
        // In a real app, createdBy should come from req.user (middleware auth)

        if (!createdBy) {
            return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Comment
            const comment = await tx.systemComment.create({
                data: {
                    recordId,
                    recordTableName,
                    content,
                    createdBy
                }
            });

            // 2. Create Mentions if any
            if (mentionedUserIds && Array.isArray(mentionedUserIds) && mentionedUserIds.length > 0) {
                // Deduplicate IDs
                const uniqueIds = [...new Set(mentionedUserIds)];

                await tx.commentMention.createMany({
                    data: uniqueIds.map((uid: string) => ({
                        commentId: comment.id,
                        mentionedUserId: uid
                    }))
                });
            }

            // Return full comment structure
            return await tx.systemComment.findUnique({
                where: { id: comment.id },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            role: true
                        }
                    },
                    mentions: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true
                                }
                            }
                        }
                    }
                }
            });
        });

        res.json(result);
    } catch (error) {
        console.error('Create Comment Error:', error);
        res.status(500).json({ error: 'Failed to post comment' });
    }
});

export default router;
