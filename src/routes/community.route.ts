import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import optionalAuth from '@src/middleware/optional-user-auth.middleware'
import adminAuth from '@src/middleware/admin-auth.middleware'
import logger from '@src/utils/logger'
import { FRONTEND_URL } from '@src/config/url'
import { fetchLevelFromGD, retrieveOrCreateLevel } from '@src/services/level.service'
import {
    getCommunityPosts,
    getCommunityPostsCount,
    getCommunityPost,
    createCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    getPostComments,
    createComment,
    deleteComment,
    getComment,
    togglePostLike,
    toggleCommentLike,
    getUserLikes,
    getUserCommentLikes,
    createReport,
    getReports,
    getReportsCount,
    resolveReport,
    getUserRecordsForPicker,
    getLevelsForPicker,
    searchPlayers,
    getPostsByLevel,
    toggleHidden
} from '@src/services/community.service'
import { sendNotification } from '@src/services/notification.service'

const router = express.Router()

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

        const [posts, total] = await Promise.all([
            getCommunityPosts({ type, limit, offset, sortBy, ascending, search }),
            getCommunityPostsCount(type, search)
        ])

        let userLikedPostIds: number[] = []
        if (res.locals.authenticated && res.locals.user) {
            const postIds = posts.map((p: any) => p.id)
            userLikedPostIds = await getUserLikes(res.locals.user.uid, postIds)
        }

        const postsWithLikeStatus = posts.map((p: any) => ({
            ...p,
            liked: userLikedPostIds.includes(p.id)
        }))

        res.json({ data: postsWithLikeStatus, total })
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
        const { title, content, type, image_url, video_url, attached_record, attached_level, is_recommended } = req.body

        if (!title) {
            res.status(400).json({ error: 'Title is required' })
            return
        }

        const validTypes = ['discussion', 'media', 'guide', 'announcement', 'review']
        const postType = validTypes.includes(type) ? type : 'discussion'

        // Only admins can create announcements
        if (postType === 'announcement' && !res.locals.user.isAdmin) {
            res.status(403).json({ error: 'Only admins can create announcements' })
            return
        }

        // Review posts must have an attached level and user must have an accepted record for it
        if (postType === 'review') {
            if (!attached_level || !attached_level.id) {
                res.status(400).json({ error: 'Review posts must have an attached level' })
                return
            }
            if (typeof is_recommended !== 'boolean') {
                res.status(400).json({ error: 'Review posts must specify recommendation' })
                return
            }
            // Verify user has an accepted record for this level
            const userRecords = await getUserRecordsForPicker(res.locals.user.uid)
            const hasRecord = userRecords.some((r: any) => r.levelid === attached_level.id)
            if (!hasRecord) {
                res.status(403).json({ error: 'You must have an accepted record for this level to write a review' })
                return
            }
        }

        // If a level is attached, fetch from GD and insert into levels table if not exists
        if (attached_level && attached_level.id) {
            try {
                const gdLevel = await fetchLevelFromGD(attached_level.id)
                await retrieveOrCreateLevel({
                    id: gdLevel.id,
                    name: gdLevel.name,
                    creator: gdLevel.author,
                    difficulty: gdLevel.difficulty,
                    isPlatformer: gdLevel.length === 5
                } as any)
            } catch (err) {
                // Level fetch/insert failed — continue with post creation anyway
                console.warn('Failed to insert GD level into levels table', err)
            }
        }

        const post = await createCommunityPost({
            uid: res.locals.user.uid,
            title,
            content: content || '',
            type: postType,
            image_url,
            video_url,
            attached_record: attached_record || undefined,
            attached_level: attached_level || undefined,
            is_recommended: postType === 'review' ? is_recommended : undefined
        })

        // Send Discord notification for new posts
        try {
            const typeEmoji: Record<string, string> = {
                discussion: '💬',
                media: '📸',
                guide: '📖',
                announcement: '📢',
                review: '⭐'
            }
            const emoji = typeEmoji[postType] || '💬'
            const playerName = post.players?.name || 'Someone'
            const postUrl = `${FRONTEND_URL}/community/${post.id}`
            logger.notice(`${emoji} **${playerName}** posted in Community Hub: **${title}**\n${postUrl}`)
        } catch {}

        res.status(201).json(post)
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
            const post = await getCommunityPost(parseInt(req.params.id))

            let liked = false
            if (res.locals.authenticated && res.locals.user) {
                const likes = await getUserLikes(res.locals.user.uid, [post.id])
                liked = likes.includes(post.id)
            }

            res.json({ ...post, liked })
        } catch {
            res.status(404).json({ error: 'Post not found' })
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
        const postId = parseInt(req.params.id)
        let existingPost

        try {
            existingPost = await getCommunityPost(postId)
        } catch {
            res.status(404).json({ error: 'Post not found' })
            return
        }

        if (existingPost.uid !== res.locals.user.uid && !res.locals.user.isAdmin) {
            res.status(403).json({ error: 'Forbidden' })
            return
        }

        const { title, content, type, image_url, video_url, attached_record, attached_level } = req.body
        const updates: any = {}
        if (title !== undefined) updates.title = title
        if (content !== undefined) updates.content = content
        if (type !== undefined) updates.type = type
        if (image_url !== undefined) updates.image_url = image_url
        if (video_url !== undefined) updates.video_url = video_url

        const post = await updateCommunityPost(postId, updates)
        res.json(post)
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
        const postId = parseInt(req.params.id)
        let existingPost

        try {
            existingPost = await getCommunityPost(postId)
        } catch {
            res.status(404).json({ error: 'Post not found' })
            return
        }

        if (existingPost.uid !== res.locals.user.uid && !res.locals.user.isAdmin) {
            res.status(403).json({ error: 'Forbidden' })
            return
        }

        await deleteCommunityPost(postId)
        res.json({ success: true })
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
        const postId = parseInt(req.params.id)
        let existingPost

        try {
            existingPost = await getCommunityPost(postId)
        } catch {
            res.status(404).json({ error: 'Post not found' })
            return
        }

        const post = await updateCommunityPost(postId, { pinned: !existingPost.pinned })
        res.json(post)
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
        const limit = parseInt(req.query.limit as string) || 50
        const offset = parseInt(req.query.offset as string) || 0

        const comments = await getPostComments(postId, limit, offset)

        let userLikedCommentIds: number[] = []
        if (res.locals.authenticated && res.locals.user) {
            const commentIds = comments.map((c: any) => c.id)
            userLikedCommentIds = await getUserCommentLikes(res.locals.user.uid, commentIds)
        }

        const commentsWithLikeStatus = comments.map((c: any) => ({
            ...c,
            liked: userLikedCommentIds.includes(c.id)
        }))

        res.json(commentsWithLikeStatus)
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
        const postId = parseInt(req.params.id)
        const { content, attached_level } = req.body

        if (!content) {
            res.status(400).json({ error: 'Content is required' })
            return
        }

        const commentData: any = {
            post_id: postId,
            uid: res.locals.user.uid,
            content
        }

        if (attached_level) {
            commentData.attached_level = attached_level
        }

        const comment = await createComment(commentData)

        // Parse @mentions and send notifications
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
        let match
        while ((match = mentionRegex.exec(content)) !== null) {
            const mentionedUid = match[2]
            if (mentionedUid !== res.locals.user.uid) {
                try {
                    await sendNotification({
                        to: mentionedUid,
                        content: `**${res.locals.user.name || 'Someone'}** mentioned you in a comment`,
                        redirect: `${FRONTEND_URL}/community/${postId}`
                    })
                } catch (e) {
                    // Don't fail the comment if notification fails
                    logger.error('Failed to send mention notification', e)
                }
            }
        }

        res.status(201).json(comment)
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
        const commentId = parseInt(req.params.id)
        let existingComment

        try {
            existingComment = await getComment(commentId)
        } catch {
            res.status(404).json({ error: 'Comment not found' })
            return
        }

        if (existingComment.uid !== res.locals.user.uid && !res.locals.user.isAdmin) {
            res.status(403).json({ error: 'Forbidden' })
            return
        }

        await deleteComment(commentId)
        res.json({ success: true })
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
        const postId = parseInt(req.params.id)
        const { title, content, type, pinned, image_url, video_url } = req.body
        const updates: any = {}
        if (title !== undefined) updates.title = title
        if (content !== undefined) updates.content = content
        if (type !== undefined) updates.type = type
        if (pinned !== undefined) updates.pinned = pinned
        if (image_url !== undefined) updates.image_url = image_url
        if (video_url !== undefined) updates.video_url = video_url

        const post = await updateCommunityPost(postId, updates)
        res.json(post)
    })

// Report a post
router.route('/posts/:id/report')
    .post(userAuth, async (req, res) => {
        const postId = parseInt(req.params.id)
        const { reason, description } = req.body

        if (!reason) {
            res.status(400).json({ error: 'Reason is required' })
            return
        }

        const validReasons = ['inappropriate', 'spam', 'harassment', 'misinformation', 'other']
        if (!validReasons.includes(reason)) {
            res.status(400).json({ error: 'Invalid reason' })
            return
        }

        try {
            const report = await createReport({
                uid: res.locals.user.uid,
                post_id: postId,
                reason,
                description
            })
            res.status(201).json(report)
        } catch (e: any) {
            res.status(409).json({ error: e.message })
        }
    })

// Report a comment
router.route('/comments/:id/report')
    .post(userAuth, async (req, res) => {
        const commentId = parseInt(req.params.id)
        const { reason, description } = req.body

        if (!reason) {
            res.status(400).json({ error: 'Reason is required' })
            return
        }

        const validReasons = ['inappropriate', 'spam', 'harassment', 'misinformation', 'other']
        if (!validReasons.includes(reason)) {
            res.status(400).json({ error: 'Invalid reason' })
            return
        }

        try {
            const report = await createReport({
                uid: res.locals.user.uid,
                comment_id: commentId,
                reason,
                description
            })
            res.status(201).json(report)
        } catch (e: any) {
            res.status(409).json({ error: e.message })
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

// Admin: toggle hide/unhide a comment
router.route('/admin/comments/:id/hidden')
    .put(adminAuth, async (req, res) => {
        const commentId = parseInt(req.params.id)
        const { hidden } = req.body

        try {
            const comment = await toggleHidden('community_comments', commentId, hidden)
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
        const posts = await getPostsByLevel(levelId, limit)

        let userLikedPostIds: number[] = []
        if (res.locals.authenticated && res.locals.user) {
            const postIds = posts.map((p: any) => p.id)
            userLikedPostIds = await getUserLikes(res.locals.user.uid, postIds)
        }

        const postsWithLikeStatus = posts.map((p: any) => ({
            ...p,
            liked: userLikedPostIds.includes(p.id)
        }))

        res.json(postsWithLikeStatus)
    })

export default router
