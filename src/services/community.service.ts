import supabase from "@src/client/supabase"
import { FRONTEND_URL } from '@src/config/url'
import { fetchLevelFromGD, retrieveOrCreateLevel } from '@src/services/level.service'
import { sendNotification } from '@src/services/notification.service'
import { sendMessageToChannel } from '@src/services/discord.service'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '@src/client/s3'

// Note: The community tables (community_posts, community_comments, community_likes)
// are not yet in the auto-generated Supabase types. After running the migration,
// regenerate types with: supabase gen types typescript --local > src/types/supabase.ts
// Until then, we use type assertions to bypass TypeScript checks.
const db: any = supabase

// ---- Custom error classes for business logic errors ----

export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class ForbiddenError extends Error {
    constructor(message: string = 'Forbidden') {
        super(message)
        this.name = 'ForbiddenError'
    }
}

export class NotFoundError extends Error {
    constructor(message: string = 'Not found') {
        super(message)
        this.name = 'NotFoundError'
    }
}

export class ConflictError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ConflictError'
    }
}

export async function getCommunityPosts(options: {
    type?: string,
    limit?: number,
    offset?: number,
    sortBy?: string,
    ascending?: boolean,
    pinFirst?: boolean,
    search?: string,
    hidden?: boolean
}) {
    const {
        type,
        limit = 20,
        offset = 0,
        sortBy = 'created_at',
        ascending = false,
        pinFirst = true,
        search,
        hidden
    } = options

    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    let query = db
        .from('community_posts')
        .select(`*, players!uid(${playerSelect})`)

    if (type) {
        query = query.eq('type', type)
    }

    // Filter hidden posts (default: show only non-hidden)
    if (hidden === true) {
        query = query.eq('hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('hidden', false)
    }

    // Full-text search using the fts column
    if (search) {
        query = query.textSearch('fts', search, { type: 'websearch' })
    }

    if (pinFirst) {
        query = query.order('pinned', { ascending: false })
    }

    query = query
        .order(sortBy, { ascending })
        .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getCommunityPostsCount(type?: string, search?: string, hidden?: boolean) {
    let query = db
        .from('community_posts')
        .select('*', { count: 'exact', head: true })

    if (type) {
        query = query.eq('type', type)
    }

    if (hidden === true) {
        query = query.eq('hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('hidden', false)
    }

    if (search) {
        query = query.textSearch('fts', search, { type: 'websearch' })
    }

    const { count, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return count || 0
}

export async function getCommunityPost(id: number) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await db
        .from('community_posts')
        .select(`*, players!uid(${playerSelect})`)
        .eq('id', id)
        .limit(1)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function createCommunityPost(post: {
    uid: string,
    title: string,
    content: string,
    type: string,
    image_url?: string,
    video_url?: string,
    attached_record?: any,
    attached_level?: any,
    is_recommended?: boolean
}) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await db
        .from('community_posts')
        .insert(post)
        .select(`*, players!uid(${playerSelect})`)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function updateCommunityPost(id: number, updates: {
    title?: string,
    content?: string,
    type?: string,
    image_url?: string,
    video_url?: string,
    pinned?: boolean,
    attached_record?: any,
    attached_level?: any,
    is_recommended?: boolean
}) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await db
        .from('community_posts')
        .update(updates)
        .eq('id', id)
        .select(`*, players!uid(${playerSelect})`)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function deleteCommunityPost(id: number) {
    const { error } = await db
        .from('community_posts')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getPostComments(postId: number, limit = 50, offset = 0) {
    const playerSelect = '*, clans!id(*)'

    const { data, error } = await db
        .from('community_comments')
        .select(`*, players!uid(${playerSelect})`)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function createComment(comment: {
    post_id: number,
    uid: string,
    content: string,
    attached_level?: any
}) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await db
        .from('community_comments')
        .insert(comment)
        .select(`*, players!uid(${playerSelect})`)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function deleteComment(id: number) {
    const { error } = await db
        .from('community_comments')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getComment(id: number) {
    const { data, error } = await db
        .from('community_comments')
        .select('*')
        .eq('id', id)
        .limit(1)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function togglePostLike(uid: string, postId: number) {
    // Check if already liked
    const { data: existing } = await db
        .from('community_likes')
        .select('id')
        .eq('uid', uid)
        .eq('post_id', postId)
        .limit(1)
        .maybeSingle()

    if (existing) {
        // Unlike
        const { error } = await db
            .from('community_likes')
            .delete()
            .eq('id', existing.id)

        if (error) throw new Error(error.message)
        return { liked: false }
    } else {
        // Like
        const { error } = await db
            .from('community_likes')
            .insert({ uid, post_id: postId })

        if (error) throw new Error(error.message)
        return { liked: true }
    }
}

export async function toggleCommentLike(uid: string, commentId: number) {
    const { data: existing } = await db
        .from('community_likes')
        .select('id')
        .eq('uid', uid)
        .eq('comment_id', commentId)
        .limit(1)
        .maybeSingle()

    if (existing) {
        const { error } = await db
            .from('community_likes')
            .delete()
            .eq('id', existing.id)

        if (error) throw new Error(error.message)
        return { liked: false }
    } else {
        const { error } = await db
            .from('community_likes')
            .insert({ uid, comment_id: commentId })

        if (error) throw new Error(error.message)
        return { liked: true }
    }
}

export async function getUserLikes(uid: string, postIds: number[]) {
    if (!postIds.length) return []

    const { data, error } = await db
        .from('community_likes')
        .select('post_id')
        .eq('uid', uid)
        .in('post_id', postIds)

    if (error) throw new Error(error.message)
    return data?.map((l: any) => l.post_id) || []
}

export async function getUserCommentLikes(uid: string, commentIds: number[]) {
    if (!commentIds.length) return []

    const { data, error } = await db
        .from('community_likes')
        .select('comment_id')
        .eq('uid', uid)
        .in('comment_id', commentIds)

    if (error) throw new Error(error.message)
    return data?.map((l: any) => l.comment_id) || []
}

// ---- Reports ----

export async function createReport(report: {
    uid: string,
    post_id?: number,
    comment_id?: number,
    reason: string,
    description?: string
}) {
    const { data, error } = await db
        .from('community_reports')
        .insert(report)
        .select('*')
        .single()

    if (error) {
        if (error.code === '23505') throw new Error('You have already reported this')
        throw new Error(error.message)
    }
    return data
}

export async function getReports(options: {
    resolved?: boolean,
    limit?: number,
    offset?: number
}) {
    const { resolved, limit = 50, offset = 0 } = options

    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    let query = db
        .from('community_reports')
        .select(`*, players!uid(${playerSelect}), community_posts(id, title, type), community_comments(id, content)`)

    if (resolved !== undefined) {
        query = query.eq('resolved', resolved)
    }

    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
}

export async function getReportsCount(resolved?: boolean) {
    let query = db
        .from('community_reports')
        .select('*', { count: 'exact', head: true })

    if (resolved !== undefined) {
        query = query.eq('resolved', resolved)
    }

    const { count, error } = await query
    if (error) throw new Error(error.message)
    return count || 0
}

export async function resolveReport(id: number) {
    const { data, error } = await db
        .from('community_reports')
        .update({ resolved: true })
        .eq('id', id)
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function getUserRecordsForPicker(uid: string) {
    const { data, error } = await db
        .from('records')
        .select('levelid, progress, videoLink, mobile, dlPt, flPt, plPt, clPt, levels!inner(id, name, creator, difficulty, isPlatformer)')
        .eq('userid', uid)
        .eq('isChecked', true)
        .order('timestamp', { ascending: false })
        .limit(100)

    if (error) throw new Error(error.message)
    return data || []
}

export async function getLevelsForPicker(search?: string, limit = 20) {
    let query = db
        .from('levels')
        .select('id, name, creator, difficulty, isPlatformer, rating')
        .eq('accepted', true)

    if (search) {
        query = query.ilike('name', `%${search}%`)
    }

    query = query.order('dlTop', { ascending: true }).limit(limit)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data || []
}

export async function searchPlayers(query: string, limit = 10) {
    const { data, error } = await db
        .from('players')
        .select('*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)')
        .ilike('name', `%${query}%`)
        .limit(limit)

    if (error) throw new Error(error.message)
    return data || []
}

export async function getPostsByLevel(levelId: number, limit = 5) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await db
        .from('community_posts')
        .select(`*, players!uid(${playerSelect})`)
        .eq('hidden', false)
        .or(`attached_level->>id.eq.${levelId},attached_record->>levelID.eq.${levelId}`)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw new Error(error.message)
    return data || []
}

export async function toggleHidden(table: 'community_posts' | 'community_comments', id: number, hidden: boolean) {
    const { data, error } = await db
        .from(table)
        .update({ hidden })
        .eq('id', id)
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

// ---- High-level orchestration functions ----

/** Enrich a list of posts with user like status + return total count */
export async function getPostsWithLikeStatus(
    options: {
        type?: string,
        limit?: number,
        offset?: number,
        sortBy?: string,
        ascending?: boolean,
        search?: string,
        pinFirst?: boolean,
        hidden?: boolean
    },
    userId?: string
) {
    const [posts, total] = await Promise.all([
        getCommunityPosts(options),
        getCommunityPostsCount(options.type, options.search, options.hidden)
    ])

    let userLikedPostIds: number[] = []
    if (userId) {
        const postIds = posts.map((p: any) => p.id)
        userLikedPostIds = await getUserLikes(userId, postIds)
    }

    const data = posts.map((p: any) => ({
        ...p,
        liked: userLikedPostIds.includes(p.id)
    }))

    return { data, total }
}

/** Get a single post enriched with user like status */
export async function getPostWithLikeStatus(postId: number, userId?: string) {
    let post
    try {
        post = await getCommunityPost(postId)
    } catch {
        throw new NotFoundError('Post not found')
    }

    let liked = false
    if (userId) {
        const likes = await getUserLikes(userId, [post.id])
        liked = likes.includes(post.id)
    }

    return { ...post, liked }
}

/** Full post creation orchestration: validation, GD level fetch, create, Discord notification */
export async function createPostFull(params: {
    uid: string,
    isAdmin: boolean,
    title: string,
    content?: string,
    type?: string,
    image_url?: string,
    video_url?: string,
    attached_record?: any,
    attached_level?: any,
    is_recommended?: boolean
}) {
    const { uid, isAdmin, title, content, type, image_url, video_url, attached_record, attached_level, is_recommended } = params

    if (!title) {
        throw new ValidationError('Title is required')
    }

    const validTypes = ['discussion', 'media', 'guide', 'announcement', 'review']
    const postType = validTypes.includes(type || '') ? type! : 'discussion'

    // Only admins can create announcements
    if (postType === 'announcement' && !isAdmin) {
        throw new ForbiddenError('Only admins can create announcements')
    }

    // Review posts must have an attached level and user must have an accepted record for it
    if (postType === 'review') {
        if (!attached_level || !attached_level.id) {
            throw new ValidationError('Review posts must have an attached level')
        }
        if (typeof is_recommended !== 'boolean') {
            throw new ValidationError('Review posts must specify recommendation')
        }
        const userRecords = await getUserRecordsForPicker(uid)
        const hasRecord = userRecords.some((r: any) => r.levelid === attached_level.id)
        if (!hasRecord) {
            throw new ForbiddenError('You must have an accepted record for this level to write a review')
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
            console.warn('Failed to insert GD level into levels table', err)
        }
    }

    const post = await createCommunityPost({
        uid,
        title,
        content: content || '',
        type: postType,
        image_url,
        video_url,
        attached_record: attached_record || undefined,
        attached_level: attached_level || undefined,
        is_recommended: postType === 'review' ? is_recommended : undefined
    })

    // Send @mention notifications from post content
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    let mentionMatch
    const notifiedUids = new Set<string>()
    while ((mentionMatch = mentionRegex.exec(content || '')) !== null) {
        const mentionedUid = mentionMatch[2]
        if (mentionedUid !== uid && !notifiedUids.has(mentionedUid)) {
            notifiedUids.add(mentionedUid)
            try {
                const playerName = post.players?.name || 'Someone'
                await sendNotification({
                    to: mentionedUid,
                    content: `**${playerName}** mentioned you in a post: **${title}**`,
                    redirect: `${FRONTEND_URL}/community/${post.id}`
                })
            } catch (e) {
                console.error('Failed to send mention notification', e)
            }
        }
    }

    // Send Discord notification
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
        const playerProfileUrl = `${FRONTEND_URL}/player/${post.uid}`

        await sendMessageToChannel(
            String(process.env.DISCORD_GENERAL_CHANNEL_ID),
            `${emoji} **[${playerName}](${playerProfileUrl})** posted in Community Hub: **${title}**\n${postUrl}`
        )
    } catch (err) {
        console.error(err)
    }

    return post
}

/** Update a post with ownership check */
export async function updatePostAsUser(
    postId: number,
    uid: string,
    isAdmin: boolean,
    updates: { title?: string, content?: string, type?: string, image_url?: string, video_url?: string }
) {
    let existingPost
    try {
        existingPost = await getCommunityPost(postId)
    } catch {
        throw new NotFoundError('Post not found')
    }

    if (existingPost.uid !== uid && !isAdmin) {
        throw new ForbiddenError()
    }

    const cleanUpdates: any = {}
    if (updates.title !== undefined) cleanUpdates.title = updates.title
    if (updates.content !== undefined) cleanUpdates.content = updates.content
    if (updates.type !== undefined) cleanUpdates.type = updates.type
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url
    if (updates.video_url !== undefined) cleanUpdates.video_url = updates.video_url

    return await updateCommunityPost(postId, cleanUpdates)
}

/** Extract S3 key from a CDN URL (e.g. https://cdn.gdvn.net/community/uid/123.jpg -> community/uid/123.jpg) */
function getS3KeyFromUrl(url: string): string | null {
    try {
        const parsed = new URL(url)
        // Remove leading slash
        return parsed.pathname.replace(/^\//, '')
    } catch {
        return null
    }
}

/** Delete an image from S3 by its CDN URL */
async function deleteImageFromS3(imageUrl: string) {
    const key = getS3KeyFromUrl(imageUrl)
    if (!key) return

    try {
        await s3.send(new DeleteObjectCommand({
            Bucket: process.env.S3_CDN_BUCKET,
            Key: key
        }))
    } catch (err) {
        console.error('Failed to delete image from S3:', key, err)
    }
}

/** Delete a post with ownership check */
export async function deletePostAsUser(postId: number, uid: string, isAdmin: boolean) {
    let existingPost
    try {
        existingPost = await getCommunityPost(postId)
    } catch {
        throw new NotFoundError('Post not found')
    }

    if (existingPost.uid !== uid && !isAdmin) {
        throw new ForbiddenError()
    }

    // Delete the post's image from S3 if it exists
    if (existingPost.image_url) {
        await deleteImageFromS3(existingPost.image_url)
    }

    await deleteCommunityPost(postId)
}

/** Toggle pin on a post */
export async function togglePostPin(postId: number) {
    let existingPost
    try {
        existingPost = await getCommunityPost(postId)
    } catch {
        throw new NotFoundError('Post not found')
    }

    return await updateCommunityPost(postId, { pinned: !existingPost.pinned })
}

/** Get comments enriched with user like status */
export async function getCommentsWithLikeStatus(
    postId: number,
    limit: number,
    offset: number,
    userId?: string
) {
    const comments = await getPostComments(postId, limit, offset)

    let userLikedCommentIds: number[] = []
    if (userId) {
        const commentIds = comments.map((c: any) => c.id)
        userLikedCommentIds = await getUserCommentLikes(userId, commentIds)
    }

    return comments.map((c: any) => ({
        ...c,
        liked: userLikedCommentIds.includes(c.id)
    }))
}

/** Create a comment and send @mention notifications */
export async function createCommentFull(params: {
    postId: number,
    uid: string,
    userName?: string,
    content: string,
    attached_level?: any
}) {
    const { postId, uid, userName, content, attached_level } = params

    if (!content) {
        throw new ValidationError('Content is required')
    }

    const commentData: any = {
        post_id: postId,
        uid,
        content
    }

    if (attached_level) {
        commentData.attached_level = attached_level
    }

    const comment = await createComment(commentData)

    // Notify post author about the new comment (if commenter is not the author)
    try {
        const post = await getCommunityPost(postId)
        if (post && post.uid !== uid) {
            await sendNotification({
                to: post.uid,
                content: `**${userName || 'Someone'}** commented on your post: **${post.title}**`,
                redirect: `${FRONTEND_URL}/community/${postId}`
            })
        }
    } catch (e) {
        console.error('Failed to send comment notification to post author', e)
    }

    // Parse @mentions and send notifications
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    let match
    const notifiedUids = new Set<string>()
    while ((match = mentionRegex.exec(content)) !== null) {
        const mentionedUid = match[2]
        if (mentionedUid !== uid && !notifiedUids.has(mentionedUid)) {
            notifiedUids.add(mentionedUid)
            try {
                await sendNotification({
                    to: mentionedUid,
                    content: `**${userName || 'Someone'}** mentioned you in a comment`,
                    redirect: `${FRONTEND_URL}/community/${postId}`
                })
            } catch (e) {
                console.error('Failed to send mention notification', e)
            }
        }
    }

    return comment
}

/** Delete a comment with ownership check */
export async function deleteCommentAsUser(commentId: number, uid: string, isAdmin: boolean) {
    let existingComment
    try {
        existingComment = await getComment(commentId)
    } catch {
        throw new NotFoundError('Comment not found')
    }

    if (existingComment.uid !== uid && !isAdmin) {
        throw new ForbiddenError()
    }

    await deleteComment(commentId)
}

/** Report a post or comment with validation */
export async function reportContent(params: {
    uid: string,
    post_id?: number,
    comment_id?: number,
    reason: string,
    description?: string
}) {
    const { reason } = params

    if (!reason) {
        throw new ValidationError('Reason is required')
    }

    const validReasons = ['inappropriate', 'spam', 'harassment', 'misinformation', 'other']
    if (!validReasons.includes(reason)) {
        throw new ValidationError('Invalid reason')
    }

    try {
        return await createReport(params)
    } catch (e: any) {
        throw new ConflictError(e.message)
    }
}

/** Admin: update any post (supports all fields including pinned) */
export async function adminUpdatePost(
    postId: number,
    updates: { title?: string, content?: string, type?: string, pinned?: boolean, image_url?: string, video_url?: string }
) {
    const cleanUpdates: any = {}
    if (updates.title !== undefined) cleanUpdates.title = updates.title
    if (updates.content !== undefined) cleanUpdates.content = updates.content
    if (updates.type !== undefined) cleanUpdates.type = updates.type
    if (updates.pinned !== undefined) cleanUpdates.pinned = updates.pinned
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url
    if (updates.video_url !== undefined) cleanUpdates.video_url = updates.video_url

    return await updateCommunityPost(postId, cleanUpdates)
}

/** Get posts by a specific user */
export async function getPostsByUser(uid: string, limit = 20, offset = 0) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await db
        .from('community_posts')
        .select(`*, players!uid(${playerSelect})`)
        .eq('uid', uid)
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return data || []
}

/** Get count of posts by a specific user */
export async function getPostsByUserCount(uid: string) {
    const { count, error } = await db
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('uid', uid)
        .eq('hidden', false)

    if (error) throw new Error(error.message)
    return count || 0
}

/** Get posts by user enriched with user like status */
export async function getPostsByUserWithLikeStatus(uid: string, limit: number, offset: number, viewerId?: string) {
    const [posts, total] = await Promise.all([
        getPostsByUser(uid, limit, offset),
        getPostsByUserCount(uid)
    ])

    let userLikedPostIds: number[] = []
    if (viewerId) {
        const postIds = posts.map((p: any) => p.id)
        userLikedPostIds = await getUserLikes(viewerId, postIds)
    }

    const data = posts.map((p: any) => ({
        ...p,
        liked: userLikedPostIds.includes(p.id)
    }))

    return { data, total }
}

/** Get posts by level enriched with user like status */
export async function getPostsByLevelWithLikeStatus(levelId: number, limit: number, userId?: string) {
    const posts = await getPostsByLevel(levelId, limit)

    let userLikedPostIds: number[] = []
    if (userId) {
        const postIds = posts.map((p: any) => p.id)
        userLikedPostIds = await getUserLikes(userId, postIds)
    }

    return posts.map((p: any) => ({
        ...p,
        liked: userLikedPostIds.includes(p.id)
    }))
}
