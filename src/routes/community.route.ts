import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import optionalAuth from '@src/middleware/optional-user-auth.middleware'
import adminAuth from '@src/middleware/admin-auth.middleware'
import _supabase from '@src/client/supabase'
const db: any = _supabase
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
        .from('community_posts_admin')
        .select('post_id')
        .in('post_id', postIds)
        .eq('moderation_status', 'approved')
    if (error) throw new Error(error.message)
    return new Set((data || []).map((r: any) => r.post_id))
}

/** Check if a single post is approved */
async function isPostApproved(postId: number): Promise<boolean> {
    const { data, error } = await db
        .from('community_posts_admin')
        .select('moderation_status')
        .eq('post_id', postId)
        .single()
    if (error) return false
    return data?.moderation_status === 'approved'
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
     *           enum: [discussion, media, guide, announcement]
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
        const sortBy = (req.query.sortBy as string) || 'created_at'
        const ascending = req.query.ascending === 'true'
        const search = req.query.search as string | undefined
        const tagId = req.query.tagId ? parseInt(req.query.tagId as string) : undefined
        const userId = res.locals.authenticated ? res.locals.user?.uid : undefined

        const result = await getPostsWithLikeStatus(
            { type, limit, offset, sortBy, ascending, search, tagId },
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
     *           enum: [discussion, media, guide, announcement, review]
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
            { type, limit, offset },
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
     *                 enum: [discussion, media, guide, announcement]
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
        const postId = parseInt(req.params.id)
        const result = await togglePostLike(res.locals.user.uid, postId)
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
                attached_level: req.body.attached_level
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
            getCommunityPosts({ type, limit, offset, sortBy: 'created_at', ascending: false, pinFirst: false, hidden }),
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
    .post(userAuth, async (req, res) => {
        try {
            const report = await reportContent({
                uid: res.locals.user.uid,
                post_id: parseInt(req.params.id),
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
    .post(userAuth, async (req, res) => {
        try {
            const report = await reportContent({
                uid: res.locals.user.uid,
                comment_id: parseInt(req.params.id),
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
    .get(userAuth, async (req, res) => {
        const records = await getUserRecordsForPicker(res.locals.user.uid)
        res.json(records)
    })

// Search levels for attachment picker
router.route('/levels/search')
    .get(optionalAuth, async (req, res) => {
        const search = req.query.q as string | undefined
        const limit = parseInt(req.query.limit as string) || 20
        const levels = await getLevelsForPicker(search, limit)
        res.json(levels)
    })

// Admin: list reports
router.route('/admin/reports')
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
    .put(adminAuth, async (req, res) => {
        const reportId = parseInt(req.params.id)
        const report = await resolveReport(reportId)
        res.json(report)
    })

// Admin: toggle hide/unhide a post
router.route('/admin/posts/:id/hidden')
    .put(adminAuth, async (req, res) => {
        const postId = parseInt(req.params.id)
        const { hidden } = req.body

        try {
            const post = await toggleHidden('community_posts', postId, hidden)
            res.json(post)
        } catch (e: any) {
            res.status(400).json({ error: e.message })
        }
    })

// Admin: list all comments with search/filter
router.route('/admin/comments')
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

// ---- Post Tags ----

// Get all post tags
router.route('/tags')
    .get(optionalAuth, async (_req, res) => {
        const tags = await getPostTags()
        res.json(tags)
    })

// Admin: create a post tag
router.route('/tags')
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
    .delete(adminAuth, async (req, res) => {
        await deletePostTag(parseInt(req.params.id))
        res.json({ success: true })
    })

// Admin: update a post tag (name, color, admin_only)
router.route('/tags/:id')
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
    .put(userAuth, async (req, res) => {
        try {
            const { tag_ids } = req.body
            if (!Array.isArray(tag_ids)) {
                res.status(400).json({ error: 'tag_ids must be an array' })
                return
            }
            const isAdmin = res.locals.user.isAdmin
            const tags = await setPostTags(parseInt(req.params.id), tag_ids, isAdmin)
            res.json(tags)
        } catch (e) {
            handleServiceError(res, e)
        }
    })

export default router
