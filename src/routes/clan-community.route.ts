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
