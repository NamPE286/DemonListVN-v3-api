import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import optionalUserAuth from '@src/middleware/optional-user-auth.middleware'
import {
    createPost,
    getPost,
    updatePost,
    deletePost,
    getFeed,
    getUserPosts,
    likePost,
    unlikePost,
    getPostLikes,
    createComment,
    getPostComments,
    updateComment,
    deleteComment,
    repostPost,
    unrepostPost,
    getUserReposts,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    isFollowing,
    getUserFollowStats,
    getFollowingFeed
} from '@src/services/social.service'

const router = express.Router()

/**
 * @openapi
 * "/social/feed":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get general post feed
 *     parameters:
 *       - name: start
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: number
 *           default: 0
 *       - name: end
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       500:
 *         description: Internal server error
 */
router.get('/feed', optionalUserAuth, async (req, res) => {
    try {
        const start = parseInt(req.query.start as string) || 0
        const end = parseInt(req.query.end as string) || 20
        const userId = res.locals.user?.uid

        res.send(await getFeed({ start, end, userId }))
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/feed/following":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get feed from followed users
 *     parameters:
 *       - name: start
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: number
 *           default: 0
 *       - name: end
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/feed/following', userAuth, async (req, res) => {
    try {
        const start = parseInt(req.query.start as string) || 0
        const end = parseInt(req.query.end as string) || 20
        const userId = res.locals.user.uid

        res.send(await getFollowingFeed({ userId, start, end }))
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts":
 *   post:
 *     tags:
 *       - Social
 *     summary: Create a new post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Post content
 *               imageUrl:
 *                 type: string
 *                 description: Optional image URL
 *               linkEmbed:
 *                 type: string
 *                 description: Optional link embed
 *     responses:
 *       200:
 *         description: Post created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/posts', userAuth, async (req, res) => {
    try {
        const { content, imageUrl, linkEmbed } = req.body
        const authorId = res.locals.user.uid

        if (!content || content.trim().length === 0) {
            res.status(400).send({ message: 'Content is required' })
            return
        }

        const post = await createPost({
            content,
            imageUrl: imageUrl || null,
            linkEmbed: linkEmbed || null,
            authorId
        })

        res.send(post)
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get a single post by ID
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get('/posts/:postId', optionalUserAuth, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const userId = res.locals.user?.uid

        const post = await getPost(postId, userId)
        res.send(post)
    } catch (err) {
        console.error(err)
        res.status(404).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}":
 *   put:
 *     tags:
 *       - Social
 *     summary: Update a post
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               linkEmbed:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/posts/:postId', userAuth, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const authorId = res.locals.user.uid
        const { content, imageUrl, linkEmbed } = req.body

        const updateData: { content?: string; imageUrl?: string | null; linkEmbed?: string | null; updated_at: string } = { 
            updated_at: new Date().toISOString() 
        }
        if (content !== undefined) updateData.content = content
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl
        if (linkEmbed !== undefined) updateData.linkEmbed = linkEmbed

        const post = await updatePost(postId, updateData, authorId)
        res.send(post)
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}":
 *   delete:
 *     tags:
 *       - Social
 *     summary: Delete a post
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/posts/:postId', userAuth, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const userId = res.locals.user.uid
        const isAdmin = res.locals.user.isAdmin

        await deletePost(postId, userId, isAdmin)
        res.send()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}/like":
 *   post:
 *     tags:
 *       - Social
 *     summary: Like a post
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Post liked successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/posts/:postId/like', userAuth, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const userId = res.locals.user.uid

        await likePost(postId, userId)
        res.send()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}/like":
 *   delete:
 *     tags:
 *       - Social
 *     summary: Unlike a post
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/posts/:postId/like', userAuth, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const userId = res.locals.user.uid

        await unlikePost(postId, userId)
        res.send()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}/likes":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get users who liked a post
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *       - name: start
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: number
 *           default: 0
 *       - name: end
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.get('/posts/:postId/likes', async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const start = parseInt(req.query.start as string) || 0
        const end = parseInt(req.query.end as string) || 20

        res.send(await getPostLikes(postId, start, end))
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}/comments":
 *   post:
 *     tags:
 *       - Social
 *     summary: Add a comment to a post
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment content
 *     responses:
 *       200:
 *         description: Comment created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/posts/:postId/comments', userAuth, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const { content } = req.body
        const authorId = res.locals.user.uid

        if (!content || content.trim().length === 0) {
            res.status(400).send({ message: 'Content is required' })
            return
        }

        const comment = await createComment({
            postId,
            content,
            authorId
        })

        res.send(comment)
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}/comments":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get comments for a post
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *       - name: start
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: number
 *           default: 0
 *       - name: end
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.get('/posts/:postId/comments', async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const start = parseInt(req.query.start as string) || 0
        const end = parseInt(req.query.end as string) || 20

        res.send(await getPostComments(postId, start, end))
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/comments/{commentId}":
 *   put:
 *     tags:
 *       - Social
 *     summary: Update a comment
 *     parameters:
 *       - name: commentId
 *         in: path
 *         description: The ID of the comment
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/comments/:commentId', userAuth, async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId)
        const { content } = req.body
        const authorId = res.locals.user.uid

        if (!content || content.trim().length === 0) {
            res.status(400).send({ message: 'Content is required' })
            return
        }

        const comment = await updateComment(commentId, content, authorId)
        res.send(comment)
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/comments/{commentId}":
 *   delete:
 *     tags:
 *       - Social
 *     summary: Delete a comment
 *     parameters:
 *       - name: commentId
 *         in: path
 *         description: The ID of the comment
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/comments/:commentId', userAuth, async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId)
        const userId = res.locals.user.uid
        const isAdmin = res.locals.user.isAdmin

        await deleteComment(commentId, userId, isAdmin)
        res.send()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}/repost":
 *   post:
 *     tags:
 *       - Social
 *     summary: Repost a post
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Post reposted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/posts/:postId/repost', userAuth, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const userId = res.locals.user.uid

        await repostPost(postId, userId)
        res.send()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/posts/{postId}/repost":
 *   delete:
 *     tags:
 *       - Social
 *     summary: Unrepost a post
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The ID of the post
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Post unreposted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/posts/:postId/repost', userAuth, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId)
        const userId = res.locals.user.uid

        await unrepostPost(postId, userId)
        res.send()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/users/{userId}/posts":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get posts by a specific user
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The UID of the user
 *         required: true
 *         schema:
 *           type: string
 *       - name: start
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: number
 *           default: 0
 *       - name: end
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.get('/users/:userId/posts', optionalUserAuth, async (req, res) => {
    try {
        const userId = req.params.userId
        const start = parseInt(req.query.start as string) || 0
        const end = parseInt(req.query.end as string) || 20
        const viewerId = res.locals.user?.uid

        res.send(await getUserPosts({ userId, start, end, viewerId }))
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/users/{userId}/reposts":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get reposts by a specific user
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The UID of the user
 *         required: true
 *         schema:
 *           type: string
 *       - name: start
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: number
 *           default: 0
 *       - name: end
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.get('/users/:userId/reposts', optionalUserAuth, async (req, res) => {
    try {
        const userId = req.params.userId
        const start = parseInt(req.query.start as string) || 0
        const end = parseInt(req.query.end as string) || 20
        const viewerId = res.locals.user?.uid

        res.send(await getUserReposts({ userId, start, end, viewerId }))
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/users/{userId}/follow":
 *   post:
 *     tags:
 *       - Social
 *     summary: Follow a user
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The UID of the user to follow
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User followed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/users/:userId/follow', userAuth, async (req, res) => {
    try {
        const followingId = req.params.userId
        const followerId = res.locals.user.uid

        await followUser(followerId, followingId)
        res.send()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/users/{userId}/follow":
 *   delete:
 *     tags:
 *       - Social
 *     summary: Unfollow a user
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The UID of the user to unfollow
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/users/:userId/follow', userAuth, async (req, res) => {
    try {
        const followingId = req.params.userId
        const followerId = res.locals.user.uid

        await unfollowUser(followerId, followingId)
        res.send()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/users/{userId}/followers":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get a user's followers
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The UID of the user
 *         required: true
 *         schema:
 *           type: string
 *       - name: start
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: number
 *           default: 0
 *       - name: end
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.get('/users/:userId/followers', async (req, res) => {
    try {
        const userId = req.params.userId
        const start = parseInt(req.query.start as string) || 0
        const end = parseInt(req.query.end as string) || 20

        res.send(await getFollowers(userId, start, end))
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/users/{userId}/following":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get users that a user is following
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The UID of the user
 *         required: true
 *         schema:
 *           type: string
 *       - name: start
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: number
 *           default: 0
 *       - name: end
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.get('/users/:userId/following', async (req, res) => {
    try {
        const userId = req.params.userId
        const start = parseInt(req.query.start as string) || 0
        const end = parseInt(req.query.end as string) || 20

        res.send(await getFollowing(userId, start, end))
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/users/{userId}/follow-stats":
 *   get:
 *     tags:
 *       - Social
 *     summary: Get follow statistics for a user
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The UID of the user
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followers:
 *                   type: number
 *                 following:
 *                   type: number
 *       500:
 *         description: Internal server error
 */
router.get('/users/:userId/follow-stats', async (req, res) => {
    try {
        const userId = req.params.userId
        res.send(await getUserFollowStats(userId))
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

/**
 * @openapi
 * "/social/users/{userId}/is-following/{targetUserId}":
 *   get:
 *     tags:
 *       - Social
 *     summary: Check if a user is following another user
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The UID of the follower
 *         required: true
 *         schema:
 *           type: string
 *       - name: targetUserId
 *         in: path
 *         description: The UID of the user being followed
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFollowing:
 *                   type: boolean
 *       500:
 *         description: Internal server error
 */
router.get('/users/:userId/is-following/:targetUserId', async (req, res) => {
    try {
        const { userId, targetUserId } = req.params
        const result = await isFollowing(userId, targetUserId)
        res.send({ isFollowing: result })
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

export default router
