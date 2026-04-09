/**
 * @swagger
 * tags:
 *   name: Clan Community
 *   description: Clan community features (posts, comments, participants, tags, reports)
 */

/**
 * @swagger
 * /clans/{id}/community/posts:
 *   get:
 *     summary: Get clan community posts
 *     tags: [Clan Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter posts by type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of posts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: ascending
 *         schema:
 *           type: boolean
 *         description: Sort ascending if true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for posts
 *       - in: query
 *         name: tagId
 *         schema:
 *           type: integer
 *         description: Filter by tag ID
 *     responses:
 *       200:
 *         description: Posts retrieved successfully with like status
 *       403:
 *         description: Clan boost not active or clan is private and user not a member
 *       404:
 *         description: Clan not found
 *   post:
 *     summary: Create a new clan community post
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Post content
 *               type:
 *                 type: string
 *                 description: Post type
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Clan boost not active or user is not a clan member
 *       404:
 *         description: Clan not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/recommended:
 *   get:
 *     summary: Get recommended clan community posts
 *     tags: [Clan Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter posts by type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Number of posts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Recommended posts retrieved successfully with like status
 *       403:
 *         description: Clan boost not active or clan is private and user not a member
 *       404:
 *         description: Clan not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/views:
 *   post:
 *     summary: Record post views
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postIds
 *             properties:
 *               postIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of post IDs to record views for (max 50)
 *     responses:
 *       204:
 *         description: Post views recorded successfully
 *       400:
 *         description: postIds must be a non-empty array
 *       403:
 *         description: Clan boost not active or user is not a clan member
 */

/**
 * @swagger
 * /clans/{id}/community/tags:
 *   get:
 *     summary: Get all post tags
 *     tags: [Clan Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}:
 *   get:
 *     summary: Get a single clan community post
 *     tags: [Clan Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully with like status
 *       403:
 *         description: Clan boost not active or clan is private and user not a member
 *       404:
 *         description: Post not found or clan not found
 *   put:
 *     summary: Update a clan community post
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated post content
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Clan boost not active, user is not a clan member, or not post owner
 *       404:
 *         description: Clan or post not found
 *   delete:
 *     summary: Delete a clan community post
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Clan boost not active, user is not a clan member, or not post owner
 *       404:
 *         description: Clan or post not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/pin:
 *   post:
 *     summary: Toggle post pin status (clan owner or admin only)
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post pin status toggled successfully
 *       403:
 *         description: Clan boost not active, user is not a clan member, or not clan owner/admin
 *       404:
 *         description: Clan or post not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/like:
 *   post:
 *     summary: Toggle post like status
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post like status toggled successfully
 *       403:
 *         description: Clan boost not active or user is not a clan member
 *       404:
 *         description: Clan or post not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Clan Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of comments to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Comments retrieved successfully with like status
 *       403:
 *         description: Clan boost not active or clan is private and user not a member
 *       404:
 *         description: Clan not found
 *   post:
 *     summary: Create a comment on a post
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment content
 *               attachedLevel:
 *                 type: integer
 *                 description: Attached level reference
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Clan boost not active or user is not a clan member
 *       404:
 *         description: Clan not found
 */

/**
 * @swagger
 * /clans/{id}/community/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Clan boost not active, user is not a clan member, or not comment owner
 *       404:
 *         description: Clan or comment not found
 */

/**
 * @swagger
 * /clans/{id}/community/comments/{commentId}/like:
 *   post:
 *     summary: Toggle comment like status
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment like status toggled successfully
 *       403:
 *         description: Clan boost not active or user is not a clan member
 *       404:
 *         description: Clan or comment not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/report:
 *   post:
 *     summary: Report a post
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for reporting
 *               description:
 *                 type: string
 *                 description: Additional description
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Clan boost not active or user is not a clan member
 *       404:
 *         description: Clan not found
 */

/**
 * @swagger
 * /clans/{id}/community/comments/{commentId}/report:
 *   post:
 *     summary: Report a comment
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for reporting
 *               description:
 *                 type: string
 *                 description: Additional description
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Clan boost not active or user is not a clan member
 *       404:
 *         description: Clan not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/tags:
 *   put:
 *     summary: Set tags on a post
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tagIds
 *             properties:
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of tag IDs to assign to the post
 *     responses:
 *       200:
 *         description: Tags updated successfully
 *       400:
 *         description: tagIds must be an array
 *       403:
 *         description: Clan boost not active, user is not a clan member, or not post owner
 *       404:
 *         description: Clan or post not found
 */

/**
 * @swagger
 * /clans/{id}/community/players/search:
 *   get:
 *     summary: Search players for @ mention
 *     tags: [Clan Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (minimum 1 character)
 *     responses:
 *       200:
 *         description: List of matching players (max 8)
 *       403:
 *         description: Clan boost not active or clan is private and user not a member
 *       404:
 *         description: Clan not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/participants:
 *   get:
 *     summary: Get participants for a post
 *     tags: [Clan Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Participants retrieved successfully with current user's status
 *       403:
 *         description: Clan boost not active or clan is private and user not a member
 *       404:
 *         description: Clan not found
 *   post:
 *     summary: Request participation in a post
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       201:
 *         description: Participation request submitted successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Clan boost not active or user is not a clan member
 *       404:
 *         description: Clan not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/participants/cancel:
 *   post:
 *     summary: Cancel participation in a post
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Participation cancelled successfully
 *       403:
 *         description: Clan boost not active or user is not a clan member
 *       404:
 *         description: Clan not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/participants/{uid}/approve:
 *   put:
 *     summary: Approve a participant's participation request
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the participant to approve
 *     responses:
 *       200:
 *         description: Participant approved successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Clan boost not active, user is not a clan member, or not authorized
 *       404:
 *         description: Clan or post not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/participants/{uid}/reject:
 *   put:
 *     summary: Reject a participant's participation request
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the participant to reject
 *     responses:
 *       200:
 *         description: Participant rejected successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Clan boost not active, user is not a clan member, or not authorized
 *       404:
 *         description: Clan or post not found
 */

/**
 * @swagger
 * /clans/{id}/community/posts/{postId}/participants/{uid}/revoke:
 *   delete:
 *     summary: Revoke a participant's participation
 *     tags: [Clan Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clan ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the participant to revoke
 *     responses:
 *       200:
 *         description: Participant revoked successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Clan boost not active, user is not a clan member, or not authorized
 *       404:
 *         description: Clan or post not found
 */

import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import optionalAuth from '@src/middleware/optional-user-auth.middleware'
import supabase from '@src/client/supabase'
import { getClan, isBoostActive } from '@src/services/clan.service'
import {
    getPostsWithLikeStatus,
    getPostWithLikeStatus,
    getRecommendedPostsWithLikeStatus,
    createPostFull,
    updatePostAsUser,
    deletePostAsUser,
    togglePostPin,
    togglePostLike,
    getCommentsWithLikeStatus,
    createCommentFull,
    deleteCommentAsUser,
    toggleCommentLike,
    reportContent,
    searchPlayers,
    recordPostViews,
    getPostTags,
    setPostTags,
    getPostParticipants,
    getParticipantStatus,
    requestParticipation,
    approveParticipant,
    rejectParticipant,
    revokeParticipant,
    cancelParticipation,
    ValidationError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
} from '@src/services/community.service'

const router = express.Router()

function handleServiceError(res: express.Response, e: unknown) {
    if (e instanceof ValidationError) {
        res.status(400).json({ error: e.message })
    } else if (e instanceof ForbiddenError) {
        res.status(403).json({ error: e.message })
    } else if (e instanceof NotFoundError) {
        res.status(404).json({ error: e.message })
    } else if (e instanceof ConflictError) {
        res.status(409).json({ error: e.message })
    } else {
        throw e
    }
}

/**
 * Middleware factory for clan community access control.
 * @param requireMembership - If true, requires the user to be a clan member (for write operations).
 *                            If false, public clans allow read access to anyone, private clans require membership.
 */
function clanCommunityAccess(requireMembership: boolean) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const clanId = parseInt(req.params.id)
        if (!clanId) {
            res.status(400).json({ error: 'Invalid clan ID' })
            return
        }

        try {
            const clan = await getClan(clanId)
            if (!isBoostActive(clan as any)) {
                res.status(403).json({ error: 'Clan boost is not active' })
                return
            }

            res.locals.clan = clan

            if (requireMembership) {
                if (!res.locals.authenticated || res.locals.user?.clan != clanId) {
                    res.status(403).json({ error: 'Must be a clan member' })
                    return
                }
            } else if (!(clan as any).isPublic) {
                // Private clan: require membership for read access
                if (!res.locals.authenticated || res.locals.user?.clan != clanId) {
                    res.status(403).json({ error: 'This clan is private' })
                    return
                }
            }

            next()
        } catch {
            res.status(404).json({ error: 'Clan not found' })
        }
    }
}

// GET /clans/:id/community/posts
router.route('/:id/community/posts')
    .get(optionalAuth, clanCommunityAccess(false), async (req, res) => {
        const clanId = parseInt(req.params.id)
        const type = req.query.type as string | undefined
        const limit = parseInt(req.query.limit as string) || 20
        const offset = parseInt(req.query.offset as string) || 0
        const sortBy = (req.query.sortBy as string) || 'createdAt'
        const ascending = req.query.ascending === 'true'
        const search = req.query.search as string | undefined
        const tagId = req.query.tagId ? parseInt(req.query.tagId as string) : undefined
        const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

        const result = await getPostsWithLikeStatus(
            { type, limit, offset, sortBy, ascending, search, tagId, clanId },
            userId
        )

        res.json(result)
    })

// POST /clans/:id/community/posts
router.route('/:id/community/posts')
    .post(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const clanId = parseInt(req.params.id)
            const post = await createPostFull({
                uid: res.locals.user.uid,
                isAdmin: res.locals.user.isAdmin,
                clanId,
                ...req.body
            })
            res.status(201).json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// GET /clans/:id/community/posts/recommended
router.route('/:id/community/posts/recommended')
    .get(optionalAuth, clanCommunityAccess(false), async (req, res) => {
        const clanId = parseInt(req.params.id)
        const type = req.query.type as string | undefined
        const limit = parseInt(req.query.limit as string) || 25
        const offset = parseInt(req.query.offset as string) || 0
        const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

        const result = await getRecommendedPostsWithLikeStatus(
            { type, limit, offset, clanId },
            userId
        )

        res.json(result)
    })

// POST /clans/:id/community/posts/views
router.route('/:id/community/posts/views')
    .post(userAuth, clanCommunityAccess(false), async (req, res) => {
        const { postIds } = req.body
        if (!Array.isArray(postIds) || postIds.length === 0) {
            res.status(400).json({ error: 'postIds must be a non-empty array' })
            return
        }
        const capped = postIds.slice(0, 50).map(Number).filter(Boolean)
        await recordPostViews(res.locals.user.uid, capped)
        res.status(204).end()
    })

// GET /clans/:id/community/tags
router.route('/:id/community/tags')
    .get(async (req, res) => {
        const tags = await getPostTags()
        res.json(tags)
    })

// GET /clans/:id/community/posts/:postId - Get single post
router.route('/:id/community/posts/:postId')
    .get(optionalAuth, clanCommunityAccess(false), async (req, res) => {
        try {
            const postId = parseInt(req.params.postId)
            const userId = res.locals.authenticated ? res.locals.user?.uid : undefined
            const post = await getPostWithLikeStatus(postId, userId)

            if (!post || post.clanId !== parseInt(req.params.id)) {
                res.status(404).json({ error: 'Post not found' })
                return
            }

            res.json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// PUT /clans/:id/community/posts/:postId - Update post
router.route('/:id/community/posts/:postId')
    .put(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const post = await updatePostAsUser(
                parseInt(req.params.postId),
                res.locals.user.uid,
                res.locals.user.isAdmin,
                req.body
            )
            res.json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// DELETE /clans/:id/community/posts/:postId - Delete post
router.route('/:id/community/posts/:postId')
    .delete(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            await deletePostAsUser(parseInt(req.params.postId), res.locals.user.uid, res.locals.user.isAdmin)
            res.json({ success: true })
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// POST /clans/:id/community/posts/:postId/pin - Toggle pin (clan owner or admin)
router.route('/:id/community/posts/:postId/pin')
    .post(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const clanId = parseInt(req.params.id)
            const isAdmin = res.locals.user?.isAdmin

            if (!isAdmin) {
                const { data: clan } = await supabase
                    .from('clans')
                    .select('owner')
                    .eq('id', clanId)
                    .single()
                if (!clan || clan.owner !== res.locals.user.uid) {
                    res.status(403).json({ error: 'Forbidden' })
                    return
                }
            }

            const post = await togglePostPin(parseInt(req.params.postId))
            res.json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// POST /clans/:id/community/posts/:postId/like - Toggle like
router.route('/:id/community/posts/:postId/like')
    .post(userAuth, clanCommunityAccess(true), async (req, res) => {
        const result = await togglePostLike(res.locals.user.uid, parseInt(req.params.postId))
        res.json(result)
    })

// GET /clans/:id/community/posts/:postId/comments - Get comments
router.route('/:id/community/posts/:postId/comments')
    .get(optionalAuth, clanCommunityAccess(false), async (req, res) => {
        const postId = parseInt(req.params.postId)
        const limit = parseInt(req.query.limit as string) || 50
        const offset = parseInt(req.query.offset as string) || 0
        const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

        const comments = await getCommentsWithLikeStatus(postId, limit, offset, userId)
        res.json(comments)
    })

// POST /clans/:id/community/posts/:postId/comments - Create comment
router.route('/:id/community/posts/:postId/comments')
    .post(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const comment = await createCommentFull({
                postId: parseInt(req.params.postId),
                uid: res.locals.user.uid,
                userName: res.locals.user.name || undefined,
                content: req.body.content,
                attachedLevel: req.body.attachedLevel
            })
            res.status(201).json(comment)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// DELETE /clans/:id/community/comments/:commentId - Delete comment
router.route('/:id/community/comments/:commentId')
    .delete(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            await deleteCommentAsUser(parseInt(req.params.commentId), res.locals.user.uid, res.locals.user.isAdmin)
            res.json({ success: true })
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// POST /clans/:id/community/comments/:commentId/like - Toggle comment like
router.route('/:id/community/comments/:commentId/like')
    .post(userAuth, clanCommunityAccess(true), async (req, res) => {
        const result = await toggleCommentLike(res.locals.user.uid, parseInt(req.params.commentId))
        res.json(result)
    })

// POST /clans/:id/community/posts/:postId/report - Report post
router.route('/:id/community/posts/:postId/report')
    .post(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const report = await reportContent({
                uid: res.locals.user.uid,
                postId: parseInt(req.params.postId),
                reason: req.body.reason,
                description: req.body.description
            })
            res.status(201).json(report)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// POST /clans/:id/community/comments/:commentId/report - Report comment
router.route('/:id/community/comments/:commentId/report')
    .post(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const report = await reportContent({
                uid: res.locals.user.uid,
                commentId: parseInt(req.params.commentId),
                reason: req.body.reason,
                description: req.body.description
            })
            res.status(201).json(report)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// PUT /clans/:id/community/posts/:postId/tags - Set tags on post
router.route('/:id/community/posts/:postId/tags')
    .put(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const { tagIds } = req.body
            if (!Array.isArray(tagIds)) {
                res.status(400).json({ error: 'tagIds must be an array' })
                return
            }
            const isAdmin = res.locals.user.isAdmin
            const tags = await setPostTags(parseInt(req.params.postId), tagIds, isAdmin)
            res.json(tags)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// GET /clans/:id/community/players/search - Search players for @ mention
router.route('/:id/community/players/search')
    .get(optionalAuth, clanCommunityAccess(false), async (req, res) => {
        const q = req.query.q as string
        if (!q || q.length < 1) {
            res.json([])
            return
        }
        const players = await searchPlayers(q, 8)
        res.json(players)
    })

// GET /clans/:id/community/posts/:postId/participants - Get participants
router.route('/:id/community/posts/:postId/participants')
    .get(optionalAuth, clanCommunityAccess(false), async (req, res) => {
        try {
            const postId = parseInt(req.params.postId)
            const participants = await getPostParticipants(postId)
            const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

            let myStatus = null
            if (userId) {
                const status = await getParticipantStatus(postId, userId)
                myStatus = status?.status || null
            }

            res.json({ participants, myStatus })
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// POST /clans/:id/community/posts/:postId/participants - Request participation
router.route('/:id/community/posts/:postId/participants')
    .post(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const result = await requestParticipation(
                parseInt(req.params.postId),
                res.locals.user.uid
            )
            res.status(201).json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// POST /clans/:id/community/posts/:postId/participants/cancel - Cancel participation
router.route('/:id/community/posts/:postId/participants/cancel')
    .post(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const result = await cancelParticipation(
                parseInt(req.params.postId),
                res.locals.user.uid
            )
            res.json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// PUT /clans/:id/community/posts/:postId/participants/:uid/approve
router.route('/:id/community/posts/:postId/participants/:uid/approve')
    .put(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const result = await approveParticipant(
                parseInt(req.params.postId),
                req.params.uid,
                res.locals.user.uid
            )
            res.json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// PUT /clans/:id/community/posts/:postId/participants/:uid/reject
router.route('/:id/community/posts/:postId/participants/:uid/reject')
    .put(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const result = await rejectParticipant(
                parseInt(req.params.postId),
                req.params.uid,
                res.locals.user.uid
            )
            res.json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// DELETE /clans/:id/community/posts/:postId/participants/:uid/revoke
router.route('/:id/community/posts/:postId/participants/:uid/revoke')
    .delete(userAuth, clanCommunityAccess(true), async (req, res) => {
        try {
            const result = await revokeParticipant(
                parseInt(req.params.postId),
                req.params.uid,
                res.locals.user.uid
            )
            res.json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

export default router
