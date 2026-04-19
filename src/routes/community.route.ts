import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import optionalAuth from '@src/middleware/optional-user-auth.middleware'
import adminAuth from '@src/middleware/admin-auth.middleware'
import _supabase from '@src/client/supabase'
const db = _supabase
import {
    getPostsWithLikeStatus,
    getPostWithLikeStatus,
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
    getUserRecordsForPicker,
    getLevelsForPicker,
    searchPlayers,
    getPostsByListWithLikeStatus,
    getPostsByLevelWithLikeStatus,
    getCommunityPosts,
    getCommunityPostsCount,
    deleteCommunityPost,
    adminUpdatePost,
    getReports,
    getReportsCount,
    resolveReport,
    toggleHidden,
    getRecommendedPostsWithLikeStatus,
    recordPostView,
    recordPostViews,
    getPendingModerationPosts,
    getPendingModerationPostsCount,
    approvePost,
    getPendingModerationComments,
    getPendingModerationCommentsCount,
    approveComment,
    rejectComment,
    toggleCommentHidden,
    getAdminComments,
    getAdminCommentsCount,
    deleteComment,
    getPostTags,
    createPostTag,
    deletePostTag,
    setPostTags,
    updatePostTag,
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

/** Check moderation status for post IDs, returns set of approved post IDs */
async function getApprovedPostIds(postIds: number[]): Promise<Set<number>> {
    if (postIds.length === 0) return new Set()
    const { data, error } = await db
        .from('communityPostsAdmin')
        .select('postId')
        .in('postId', postIds)
        .eq('moderationStatus', 'approved')
    if (error) throw new Error(error.message)
    return new Set((data || []).map((r: any) => r.postId))
}

/** Check if a single post is approved */
async function isPostApproved(postId: number): Promise<boolean> {
    const { data, error } = await db
        .from('communityPostsAdmin')
        .select('moderationStatus')
        .eq('postId', postId)
        .single()
    if (error) return false
    return data?.moderationStatus === 'approved'
}

/** Map service errors to HTTP status codes */
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

router.route('/posts')
    /**
     * @openapi
     * "/community/posts":
     *   get:
     *     tags:
     *       - Community
     *     summary: Get community posts
     *     parameters:
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [discussion, media, guide, announcement, collab]
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           default: created_at
     *       - in: query
     *         name: ascending
     *         schema:
     *           type: boolean
     *           default: false
     *     responses:
     *       200:
     *         description: List of community posts
     */
    .get(optionalAuth, async (req, res) => {
        const type = req.query.type as string | undefined
        const limit = parseInt(req.query.limit as string) || 20
        const offset = parseInt(req.query.offset as string) || 0
        const sortBy = (req.query.sortBy as string) || 'createdAt'
        const ascending = req.query.ascending === 'true'
        const search = req.query.search as string | undefined
        const tagId = req.query.tagId ? parseInt(req.query.tagId as string) : undefined
        const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

        const result = await getPostsWithLikeStatus(
            { type, limit, offset, sortBy, ascending, search, tagId, clanId: null },
            userId
        )

        const isAdmin = res.locals.authenticated && res.locals.user?.isAdmin
        if (!isAdmin && result.data.length > 0) {
            const postIds = result.data.map((p: any) => p.id)
            const approvedIds = await getApprovedPostIds(postIds)
            const filtered = result.data.filter((p: any) => approvedIds.has(p.id))
            result.total -= (result.data.length - filtered.length)
            result.data = filtered
        }

        res.json(result)
    })

router.route('/posts/recommended')
    /**
     * @openapi
     * "/community/posts/recommended":
     *   get:
     *     tags:
     *       - Community
     *     summary: Get recommended community posts
     *     parameters:
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [discussion, media, guide, announcement, review, collab]
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 25
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *     responses:
     *       200:
     *         description: List of recommended community posts
     */
    .get(optionalAuth, async (req, res) => {
        const type = req.query.type as string | undefined
        const limit = parseInt(req.query.limit as string) || 25
        const offset = parseInt(req.query.offset as string) || 0
        const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

        const result = await getRecommendedPostsWithLikeStatus(
            { type, limit, offset, clanId: null },
            userId
        )

        const isAdmin = res.locals.authenticated && res.locals.user?.isAdmin
        if (!isAdmin && result.data.length > 0) {
            const postIds = result.data.map((p: any) => p.id)
            const approvedIds = await getApprovedPostIds(postIds)
            const filtered = result.data.filter((p: any) => approvedIds.has(p.id))
            result.total -= (result.data.length - filtered.length)
            result.data = filtered
        }

        res.json(result)
    })

router.route('/posts/views')
    /**
     * @openapi
     * "/community/posts/views":
     *   post:
     *     tags:
     *       - Community
     *     summary: Record post views for the current user
     *     security:
     *       - bearerAuth: []
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
     *     responses:
     *       204:
     *         description: Views recorded
     *       401:
     *         description: Unauthorized
     */
    .post(userAuth, async (req, res) => {
        const { postIds } = req.body
        if (!Array.isArray(postIds) || postIds.length === 0) {
            res.status(400).json({ error: 'postIds must be a non-empty array' })
            return
        }
        // Cap to 50 to prevent abuse
        const capped = postIds.slice(0, 50).map(Number).filter(Boolean)
        await recordPostViews(res.locals.user.uid, capped)
        res.status(204).end()
    })

router.route('/posts/:id/view')
    /**
     * @openapi
     * "/community/posts/{id}/view":
     *   post:
     *     tags:
     *       - Community
     *     summary: Record a single post view
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: View recorded
     *       401:
     *         description: Unauthorized
     */
    .post(userAuth, async (req, res) => {
        const postId = parseInt(req.params.id)
        if (!postId) {
            res.status(400).json({ error: 'Invalid post ID' })
            return
        }
        await recordPostView(res.locals.user.uid, postId)
        res.status(204).end()
    })

router.route('/posts')
    /**
     * @openapi
     * "/community/posts":
     *   post:
     *     tags:
     *       - Community
     *     summary: Create a community post
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - title
     *             properties:
     *               title:
     *                 type: string
     *               content:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [discussion, media, guide, announcement, collab]
     *               image_url:
     *                 type: string
     *     responses:
     *       201:
     *         description: Post created
     *       401:
     *         description: Unauthorized
     */
    .post(userAuth, async (req, res) => {
        try {
            const post = await createPostFull({
                uid: res.locals.user.uid,
                isAdmin: res.locals.user.isAdmin,
                ...req.body
            })
            res.status(201).json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

router.route('/posts/:id')
    /**
     * @openapi
     * "/community/posts/{id}":
     *   get:
     *     tags:
     *       - Community
     *     summary: Get a single community post
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Post details
     *       404:
     *         description: Post not found
     */
    .get(optionalAuth, async (req, res) => {
        try {
            const userId = res.locals.authenticated ? res.locals.user?.uid : undefined
            const isAdmin = res.locals.authenticated && res.locals.user?.isAdmin
            const postId = parseInt(req.params.id)

            if (!isAdmin && !(await isPostApproved(postId))) {
                res.status(404).json({ error: 'Post not found' })
                return
            }

            const post = await getPostWithLikeStatus(postId, userId)

            // Clan posts should not be served via global URL
            if (post?.clanId) {
                res.status(404).json({ error: 'Post not found' })
                return
            }

            res.json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

router.route('/posts/:id')
    /**
     * @openapi
     * "/community/posts/{id}":
     *   put:
     *     tags:
     *       - Community
     *     summary: Update a community post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               content:
     *                 type: string
     *               type:
     *                 type: string
     *               image_url:
     *                 type: string
     *     responses:
     *       200:
     *         description: Post updated
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    .put(userAuth, async (req, res) => {
        try {
            const post = await updatePostAsUser(
                parseInt(req.params.id),
                res.locals.user.uid,
                res.locals.user.isAdmin,
                req.body
            )
            res.json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

router.route('/posts/:id')
    /**
     * @openapi
     * "/community/posts/{id}":
     *   delete:
     *     tags:
     *       - Community
     *     summary: Delete a community post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Post deleted
     *       403:
     *         description: Forbidden
     */
    .delete(userAuth, async (req, res) => {
        try {
            await deletePostAsUser(parseInt(req.params.id), res.locals.user.uid, res.locals.user.isAdmin)
            res.json({ success: true })
        } catch (e) {
            handleServiceError(res, e)
        }
    })

router.route('/posts/:id/pin')
    /**
     * @openapi
     * "/community/posts/{id}/pin":
     *   post:
     *     tags:
     *       - Community
     *     summary: Toggle pin on a community post (admin only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Pin toggled
     *       403:
     *         description: Forbidden
     */
    .post(adminAuth, async (req, res) => {
        try {
            const post = await togglePostPin(parseInt(req.params.id))
            res.json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

router.route('/posts/:id/like')
    /**
     * @openapi
     * "/community/posts/{id}/like":
     *   post:
     *     tags:
     *       - Community
     *     summary: Toggle like on a community post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Like toggled
     */
    .post(userAuth, async (req, res) => {
        const result = await togglePostLike(res.locals.user.uid, parseInt(req.params.id))
        res.json(result)
    })

router.route('/posts/:id/comments')
    /**
     * @openapi
     * "/community/posts/{id}/comments":
     *   get:
     *     tags:
     *       - Community
     *     summary: Get comments for a post
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *     responses:
     *       200:
     *         description: List of comments
     */
    .get(optionalAuth, async (req, res) => {
        const postId = parseInt(req.params.id)
        const isAdmin = res.locals.authenticated && res.locals.user?.isAdmin

        if (!isAdmin && !(await isPostApproved(postId))) {
            res.status(404).json({ error: 'Post not found' })
            return
        }

        const limit = parseInt(req.query.limit as string) || 50
        const offset = parseInt(req.query.offset as string) || 0
        const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

        const comments = await getCommentsWithLikeStatus(postId, limit, offset, userId)
        res.json(comments)
    })

router.route('/posts/:id/comments')
    /**
     * @openapi
     * "/community/posts/{id}/comments":
     *   post:
     *     tags:
     *       - Community
     *     summary: Add a comment to a post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
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
     *     responses:
     *       201:
     *         description: Comment created
     */
    .post(userAuth, async (req, res) => {
        try {
            const comment = await createCommentFull({
                postId: parseInt(req.params.id),
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

router.route('/comments/:id')
    /**
     * @openapi
     * "/community/comments/{id}":
     *   delete:
     *     tags:
     *       - Community
     *     summary: Delete a comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Comment deleted
     *       403:
     *         description: Forbidden
     */
    .delete(userAuth, async (req, res) => {
        try {
            await deleteCommentAsUser(parseInt(req.params.id), res.locals.user.uid, res.locals.user.isAdmin)
            res.json({ success: true })
        } catch (e) {
            handleServiceError(res, e)
        }
    })

router.route('/comments/:id/like')
    /**
     * @openapi
     * "/community/comments/{id}/like":
     *   post:
     *     tags:
     *       - Community
     *     summary: Toggle like on a comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Like toggled
     */
    .post(userAuth, async (req, res) => {
        const commentId = parseInt(req.params.id)
        // Note: comment-level clan access check is not added here for simplicity;
        // the post-level checks on GET/POST comments are sufficient
        const result = await toggleCommentLike(res.locals.user.uid, commentId)
        res.json(result)
    })

// Admin: list all posts with search/filter
router.route('/admin/posts')
    /**
     * @openapi
     * "/community/admin/posts":
     *   get:
     *     tags:
     *       - Community
     *     summary: Admin - List all community posts with search
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *     responses:
     *       200:
     *         description: List of all community posts
     */
    .get(adminAuth, async (req, res) => {
        const type = req.query.type as string | undefined
        const limit = parseInt(req.query.limit as string) || 50
        const offset = parseInt(req.query.offset as string) || 0
        const hidden = req.query.hidden === 'true' ? true : req.query.hidden === 'false' ? false : undefined

        const [posts, total] = await Promise.all([
            getCommunityPosts({ type, limit, offset, sortBy: 'createdAt', ascending: false, pinFirst: false, hidden }),
            getCommunityPostsCount(type, undefined, hidden)
        ])

        res.json({ data: posts, total })
    })

// Admin: force delete any post
router.route('/admin/posts/:id')
    /**
     * @openapi
     * "/community/admin/posts/{id}":
     *   delete:
     *     tags:
     *       - Community
     *     summary: Admin - Force delete a community post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Post deleted
     */
    .delete(adminAuth, async (req, res) => {
        const postId = parseInt(req.params.id)
        await deleteCommunityPost(postId)
        res.json({ success: true })
    })

// Admin: update any post (edit type, pin, etc.)
router.route('/admin/posts/:id')
    /**
     * @openapi
     * "/community/admin/posts/{id}":
     *   put:
     *     tags:
     *       - Community
     *     summary: Admin - Update any community post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               content:
     *                 type: string
     *               type:
     *                 type: string
     *               pinned:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Post updated
     */
    .put(adminAuth, async (req, res) => {
        const post = await adminUpdatePost(parseInt(req.params.id), req.body)
        res.json(post)
    })

// Report a post
router.route('/posts/:id/report')
    /**
     * @openapi
     * "/community/posts/{id}/report":
     *   post:
     *     tags:
     *       - Community
     *     summary: Report a post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
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
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Report submitted successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     */
    .post(userAuth, async (req, res) => {
        try {
            const report = await reportContent({
                uid: res.locals.user.uid,
                postId: parseInt(req.params.id),
                reason: req.body.reason,
                description: req.body.description
            })
            res.status(201).json(report)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Report a comment
router.route('/comments/:id/report')
    /**
     * @openapi
     * "/community/comments/{id}/report":
     *   post:
     *     tags:
     *       - Community
     *     summary: Report a comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
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
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Report submitted successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     */
    .post(userAuth, async (req, res) => {
        try {
            const report = await reportContent({
                uid: res.locals.user.uid,
                commentId: parseInt(req.params.id),
                reason: req.body.reason,
                description: req.body.description
            })
            res.status(201).json(report)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Get user's verified records for attachment picker
router.route('/my/records')
    /**
     * @openapi
     * "/community/my/records":
     *   get:
     *     tags:
     *       - Community
     *     summary: Get user's verified records for attachment picker
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of user's verified records
     *       401:
     *         description: Unauthorized
     */
    .get(userAuth, async (req, res) => {
        const records = await getUserRecordsForPicker(res.locals.user.uid)
        res.json(records)
    })

// Search levels for attachment picker
router.route('/levels/search')
    /**
     * @openapi
     * "/community/levels/search":
     *   get:
     *     tags:
     *       - Community
     *     summary: Search levels for attachment picker
     *     parameters:
     *       - in: query
     *         name: q
     *         schema:
     *           type: string
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *     responses:
     *       200:
     *         description: List of matching levels
     */
    .get(optionalAuth, async (req, res) => {
        const search = req.query.q as string | undefined
        const limit = parseInt(req.query.limit as string) || 20
        const levels = await getLevelsForPicker(search, limit)
        res.json(levels)
    })

// Admin: list reports
router.route('/admin/reports')
    /**
     * @openapi
     * "/community/admin/reports":
     *   get:
     *     tags:
     *       - Community
     *     summary: Admin - List all reports
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: resolved
     *         schema:
     *           type: boolean
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *     responses:
     *       200:
     *         description: List of reports
     *       403:
     *         description: Forbidden
     */
    .get(adminAuth, async (req, res) => {
        const resolved = req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined
        const limit = parseInt(req.query.limit as string) || 50
        const offset = parseInt(req.query.offset as string) || 0

        const [reports, total] = await Promise.all([
            getReports({ resolved, limit, offset }),
            getReportsCount(resolved)
        ])

        res.json({ data: reports, total })
    })

// Admin: resolve a report
router.route('/admin/reports/:id/resolve')
    /**
     * @openapi
     * "/community/admin/reports/{id}/resolve":
     *   put:
     *     tags:
     *       - Community
     *     summary: Admin - Resolve a report
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Report resolved
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Report not found
     */
    .put(adminAuth, async (req, res) => {
        const reportId = parseInt(req.params.id)
        const report = await resolveReport(reportId)
        res.json(report)
    })

// Admin: toggle hide/unhide a post
router.route('/admin/posts/:id/hidden')
    /**
     * @openapi
     * "/community/admin/posts/{id}/hidden":
     *   put:
     *     tags:
     *       - Community
     *     summary: Admin - Toggle hide/unhide a post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - hidden
     *             properties:
     *               hidden:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Post hidden/unhidden
     *       400:
     *         description: Bad request
     *       403:
     *         description: Forbidden
     */
    .put(adminAuth, async (req, res) => {
        const postId = parseInt(req.params.id)
        const { hidden } = req.body

        try {
            const post = await toggleHidden('communityPosts', postId, hidden)
            res.json(post)
        } catch (e: any) {
            res.status(400).json({ error: e.message })
        }
    })

// Admin: list all comments with search/filter
router.route('/admin/comments')
    /**
     * @openapi
     * "/community/admin/comments":
     *   get:
     *     tags:
     *       - Community
     *     summary: Admin - List all comments with search/filter
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *       - in: query
     *         name: hidden
     *         schema:
     *           type: boolean
     *       - in: query
     *         name: moderationStatus
     *         schema:
     *           type: string
     *       - in: query
     *         name: postId
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *     responses:
     *       200:
     *         description: List of comments
     *       403:
     *         description: Forbidden
     */
    .get(adminAuth, async (req, res) => {
        const limit = parseInt(req.query.limit as string) || 50
        const offset = parseInt(req.query.offset as string) || 0
        const search = req.query.search as string | undefined
        const hidden = req.query.hidden === 'true' ? true : req.query.hidden === 'false' ? false : undefined
        const moderationStatus = req.query.moderationStatus as string | undefined
        const postId = req.query.postId ? parseInt(req.query.postId as string) : undefined

        const [comments, total] = await Promise.all([
            getAdminComments({ limit, offset, search, hidden, moderationStatus, postId }),
            getAdminCommentsCount({ search, hidden, moderationStatus, postId })
        ])

        res.json({ data: comments, total })
    })

// Admin: force delete any comment
router.route('/admin/comments/:id')
    /**
     * @openapi
     * "/community/admin/comments/{id}":
     *   delete:
     *     tags:
     *       - Community
     *     summary: Admin - Force delete a comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Comment deleted
     *       403:
     *         description: Forbidden
     */
    .delete(adminAuth, async (req, res) => {
        const commentId = parseInt(req.params.id)
        await deleteComment(commentId)
        res.json({ success: true })
    })

// Admin: list posts pending moderation
router.route('/admin/moderation/pending')
    /**
     * @openapi
     * "/community/admin/moderation/pending":
     *   get:
     *     tags:
     *       - Community
     *     summary: Admin - List posts pending moderation approval
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *     responses:
     *       200:
     *         description: List of posts pending moderation
     */
    .get(adminAuth, async (req, res) => {
        const limit = parseInt(req.query.limit as string) || 50
        const offset = parseInt(req.query.offset as string) || 0

        const [posts, total] = await Promise.all([
            getPendingModerationPosts({ limit, offset }),
            getPendingModerationPostsCount()
        ])

        res.json({ data: posts, total })
    })

// Admin: approve a pending post
router.route('/admin/moderation/:id/approve')
    /**
     * @openapi
     * "/community/admin/moderation/{id}/approve":
     *   put:
     *     tags:
     *       - Community
     *     summary: Admin - Approve a pending post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Post approved
     */
    .put(adminAuth, async (req, res) => {
        try {
            const post = await approvePost(parseInt(req.params.id))
            res.json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Admin: reject a pending post
router.route('/admin/moderation/:id/reject')
    /**
     * @openapi
     * "/community/admin/moderation/{id}/reject":
     *   put:
     *     tags:
     *       - Community
     *     summary: Admin - Reject a pending post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Post rejected
     */
    .put(adminAuth, async (req, res) => {
        try {
            const post = await deleteCommunityPost(parseInt(req.params.id))
            res.json(post)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Admin: list comments pending moderation
router.route('/admin/moderation/comments/pending')
    /**
     * @openapi
     * "/community/admin/moderation/comments/pending":
     *   get:
     *     tags:
     *       - Community
     *     summary: Admin - List comments pending moderation
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *     responses:
     *       200:
     *         description: List of comments pending moderation
     *       403:
     *         description: Forbidden
     */
    .get(adminAuth, async (req, res) => {
        const limit = parseInt(req.query.limit as string) || 50
        const offset = parseInt(req.query.offset as string) || 0

        const [comments, total] = await Promise.all([
            getPendingModerationComments({ limit, offset }),
            getPendingModerationCommentsCount()
        ])

        res.json({ data: comments, total })
    })

// Admin: approve a pending comment
router.route('/admin/moderation/comments/:id/approve')
    /**
     * @openapi
     * "/community/admin/moderation/comments/{id}/approve":
     *   put:
     *     tags:
     *       - Community
     *     summary: Admin - Approve a pending comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Comment approved
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Comment not found
     */
    .put(adminAuth, async (req, res) => {
        try {
            const comment = await approveComment(parseInt(req.params.id))
            res.json(comment)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Admin: reject a pending comment
router.route('/admin/moderation/comments/:id/reject')
    /**
     * @openapi
     * "/community/admin/moderation/comments/{id}/reject":
     *   put:
     *     tags:
     *       - Community
     *     summary: Admin - Reject a pending comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Comment rejected
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Comment not found
     */
    .put(adminAuth, async (req, res) => {
        try {
            await rejectComment(parseInt(req.params.id))
            res.json({ success: true })
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Admin: toggle hide/unhide a comment (via admin table)
router.route('/admin/comments/:id/hidden')
    /**
     * @openapi
     * "/community/admin/comments/{id}/hidden":
     *   put:
     *     tags:
     *       - Community
     *     summary: Admin - Toggle hide/unhide a comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - hidden
     *             properties:
     *               hidden:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Comment hidden/unhidden
     *       400:
     *         description: Bad request
     *       403:
     *         description: Forbidden
     */
    .put(adminAuth, async (req, res) => {
        const commentId = parseInt(req.params.id)
        const { hidden } = req.body

        try {
            const comment = await toggleCommentHidden(commentId, hidden)
            res.json(comment)
        } catch (e: any) {
            res.status(400).json({ error: e.message })
        }
    })

// Search players for @ mention
router.route('/players/search')
    /**
     * @openapi
     * "/community/players/search":
     *   get:
     *     tags:
     *       - Community
     *     summary: Search players for @ mention
     *     parameters:
     *       - in: query
     *         name: q
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: List of matching players
     */
    .get(optionalAuth, async (req, res) => {
        const q = req.query.q as string
        if (!q || q.length < 1) {
            res.json([])
            return
        }
        const players = await searchPlayers(q, 8)
        res.json(players)
    })

// Get community posts related to a level
router.route('/levels/:id/posts')
    /**
     * @openapi
     * "/community/levels/{id}/posts":
     *   get:
     *     tags:
     *       - Community
     *     summary: Get community posts related to a level
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 5
     *     responses:
     *       200:
     *         description: List of posts related to the level
     */
    .get(optionalAuth, async (req, res) => {
        const levelId = parseInt(req.params.id)
        const limit = parseInt(req.query.limit as string) || 5
        const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

        let posts = await getPostsByLevelWithLikeStatus(levelId, limit, userId)

        const isAdmin = res.locals.authenticated && res.locals.user?.isAdmin
        if (!isAdmin && posts.length > 0) {
            const postIds = posts.map((p: any) => p.id)
            const approvedIds = await getApprovedPostIds(postIds)
            posts = posts.filter((p: any) => approvedIds.has(p.id))
        }

        res.json(posts)
    })

// Get community posts related to a custom list
router.route('/lists/:id/posts')
    .get(optionalAuth, async (req, res) => {
        const listId = parseInt(req.params.id)
        const limit = parseInt(req.query.limit as string) || 5
        const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

        let posts = await getPostsByListWithLikeStatus(listId, limit, userId)

        const isAdmin = res.locals.authenticated && res.locals.user?.isAdmin
        if (!isAdmin && posts.length > 0) {
            const postIds = posts.map((p: any) => p.id)
            const approvedIds = await getApprovedPostIds(postIds)
            posts = posts.filter((p: any) => approvedIds.has(p.id))
        }

        res.json(posts)
    })

// ---- Participants ----

// Get participants for a post
router.route('/posts/:id/participants')
    /**
     * @openapi
     * "/community/posts/{id}/participants":
     *   get:
     *     tags:
     *       - Community
     *     summary: Get participants for a post
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: List of participants and current user's status
     */
    .get(optionalAuth, async (req, res) => {
        try {
            const postId = parseInt(req.params.id)
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

// Request to participate in a post
router.route('/posts/:id/participants')
    /**
     * @openapi
     * "/community/posts/{id}/participants":
     *   post:
     *     tags:
     *       - Community
     *     summary: Request to participate in a post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       201:
     *         description: Participation request created
     *       401:
     *         description: Unauthorized
     *       409:
     *         description: Conflict (already participating)
     */
    .post(userAuth, async (req, res) => {
        try {
            const result = await requestParticipation(
                parseInt(req.params.id),
                res.locals.user.uid
            )
            res.status(201).json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Cancel own participation request
router.route('/posts/:id/participants/cancel')
    /**
     * @openapi
     * "/community/posts/{id}/participants/cancel":
     *   post:
     *     tags:
     *       - Community
     *     summary: Cancel own participation request
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Participation request cancelled
     *       401:
     *         description: Unauthorized
     */
    .post(userAuth, async (req, res) => {
        try {
            const result = await cancelParticipation(
                parseInt(req.params.id),
                res.locals.user.uid
            )
            res.json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Approve a participant (post owner only)
router.route('/posts/:id/participants/:uid/approve')
    /**
     * @openapi
     * "/community/posts/{id}/participants/{uid}/approve":
     *   put:
     *     tags:
     *       - Community
     *     summary: Approve a participant (post owner only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Participant approved
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    .put(userAuth, async (req, res) => {
        try {
            const result = await approveParticipant(
                parseInt(req.params.id),
                req.params.uid,
                res.locals.user.uid
            )
            res.json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Reject a participant (post owner only)
router.route('/posts/:id/participants/:uid/reject')
    /**
     * @openapi
     * "/community/posts/{id}/participants/{uid}/reject":
     *   put:
     *     tags:
     *       - Community
     *     summary: Reject a participant (post owner only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Participant rejected
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    .put(userAuth, async (req, res) => {
        try {
            const result = await rejectParticipant(
                parseInt(req.params.id),
                req.params.uid,
                res.locals.user.uid
            )
            res.json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Revoke an approved participant (post owner only)
router.route('/posts/:id/participants/:uid/revoke')
    /**
     * @openapi
     * "/community/posts/{id}/participants/{uid}/revoke":
     *   delete:
     *     tags:
     *       - Community
     *     summary: Revoke an approved participant (post owner only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Participant revoked
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    .delete(userAuth, async (req, res) => {
        try {
            const result = await revokeParticipant(
                parseInt(req.params.id),
                req.params.uid,
                res.locals.user.uid
            )
            res.json(result)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// ---- Post Tags ----

// Get all post tags
router.route('/tags')
    /**
     * @openapi
     * "/community/tags":
     *   get:
     *     tags:
     *       - Community
     *     summary: Get all post tags
     *     responses:
     *       200:
     *         description: List of all post tags
     */
    .get(optionalAuth, async (_req, res) => {
        const tags = await getPostTags()
        res.json(tags)
    })

// Admin: create a post tag
router.route('/tags')
    /**
     * @openapi
     * "/community/tags":
     *   post:
     *     tags:
     *       - Community
     *     summary: Admin - Create a post tag
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *               color:
     *                 type: string
     *               admin_only:
     *                 type: boolean
     *     responses:
     *       201:
     *         description: Tag created
     *       400:
     *         description: Bad request
     *       403:
     *         description: Forbidden
     */
    .post(adminAuth, async (req, res) => {
        try {
            const tag = await createPostTag(req.body)
            res.status(201).json(tag)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Admin: delete a post tag (removes from all posts)
router.route('/tags/:id')
    /**
     * @openapi
     * "/community/tags/{id}":
     *   delete:
     *     tags:
     *       - Community
     *     summary: Admin - Delete a post tag (removes from all posts)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Tag deleted
     *       403:
     *         description: Forbidden
     */
    .delete(adminAuth, async (req, res) => {
        await deletePostTag(parseInt(req.params.id))
        res.json({ success: true })
    })

// Admin: update a post tag (name, color, admin_only)
router.route('/tags/:id')
    /**
     * @openapi
     * "/community/tags/{id}":
     *   put:
     *     tags:
     *       - Community
     *     summary: Admin - Update a post tag
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               color:
     *                 type: string
     *               admin_only:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Tag updated
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Tag not found
     */
    .put(adminAuth, async (req, res) => {
        try {
            const tag = await updatePostTag(parseInt(req.params.id), req.body)
            res.json(tag)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

// Set tags on a post
router.route('/posts/:id/tags')
    /**
     * @openapi
     * "/community/posts/{id}/tags":
     *   put:
     *     tags:
     *       - Community
     *     summary: Set tags on a post
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
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
     *     responses:
     *       200:
     *         description: Tags updated
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    .put(userAuth, async (req, res) => {
        try {
            const { tagIds } = req.body
            if (!Array.isArray(tagIds)) {
                res.status(400).json({ error: 'tagIds must be an array' })
                return
            }
            const isAdmin = res.locals.user.isAdmin
            const tags = await setPostTags(parseInt(req.params.id), tagIds, isAdmin)
            res.json(tags)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

export default router
