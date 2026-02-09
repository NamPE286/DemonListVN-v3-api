import supabase from "@src/client/supabase"
import { FRONTEND_URL } from '@src/config/url'
import { fetchLevelFromGD, retrieveOrCreateLevel } from '@src/services/level.service'
import { sendNotification } from '@src/services/notification.service'
import { sendMessageToChannel } from '@src/services/discord.service'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '@src/client/s3'
import { DiscordChannel } from "@src/const/discord-channel-const"
import { moderateContent } from '@src/services/moderation.service'
import logger from "@src/utils/logger"

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
    hidden?: boolean,
    moderationStatus?: string,
    tagId?: number
}) {
    const {
        type,
        limit = 20,
        offset = 0,
        sortBy = 'created_at',
        ascending = false,
        pinFirst = true,
        search,
        hidden,
        moderationStatus
    } = options

    // Pre-filter: get post IDs that have the matching tag
    let tagFilteredIds: number[] | null = null
    if (options.tagId) {
        const { data: tagRows, error: tagError } = await db
            .from('community_posts_tags')
            .select('post_id')
            .eq('tag_id', options.tagId)
        if (tagError) throw new Error(tagError.message)
        tagFilteredIds = [...new Set((tagRows || []).map((r: any) => r.post_id))] as number[]
        if (tagFilteredIds.length === 0) return []
    }

    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    let query = db
        .from('community_posts')
        .select(`*, players!uid(${playerSelect}), community_posts_admin!inner(moderation_status, moderation_result, hidden), community_posts_tags(tag_id, post_tags(id, name, color, admin_only))`)

    if (type) {
        query = query.eq('type', type)
    }

    // Filter hidden posts via admin table (default: show only non-hidden)
    if (hidden === true) {
        query = query.eq('community_posts_admin.hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('community_posts_admin.hidden', false)
    }

    // Only show approved posts to public (unless admin explicitly requests all)
    if (options.moderationStatus) {
        query = query.eq('community_posts_admin.moderation_status', options.moderationStatus)
    } else {
        query = query.eq('community_posts_admin.moderation_status', 'approved')
    }

    // Filter by tag: only include posts that have the matching tag
    if (tagFilteredIds !== null) {
        query = query.in('id', tagFilteredIds)
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

export async function getCommunityPostsCount(type?: string, search?: string, hidden?: boolean, moderationStatus?: string, tagId?: number) {
    // Pre-filter: get post IDs that have the matching tag
    let tagFilteredIds: number[] | null = null
    if (tagId) {
        const { data: tagRows, error: tagError } = await db
            .from('community_posts_tags')
            .select('post_id')
            .eq('tag_id', tagId)
        if (tagError) throw new Error(tagError.message)
        tagFilteredIds = [...new Set((tagRows || []).map((r: any) => r.post_id))] as number[]
        if (tagFilteredIds.length === 0) return 0
    }

    let query = db
        .from('community_posts')
        .select('*, community_posts_admin!inner(moderation_status, hidden)', { count: 'exact', head: true })

    if (type) {
        query = query.eq('type', type)
    }

    if (hidden === true) {
        query = query.eq('community_posts_admin.hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('community_posts_admin.hidden', false)
    }

    // Filter by moderation status (default: approved only)
    if (moderationStatus) {
        query = query.eq('community_posts_admin.moderation_status', moderationStatus)
    } else {
        query = query.eq('community_posts_admin.moderation_status', 'approved')
    }

    // Filter by tag: only count posts that have the matching tag
    if (tagFilteredIds !== null) {
        query = query.in('id', tagFilteredIds)
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
        .select(`*, players!uid(${playerSelect}), community_posts_admin(moderation_status, moderation_result, hidden), community_posts_tags(tag_id, post_tags(id, name, color, admin_only))`)
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
    is_recommended?: boolean,
}, adminData?: {
    moderation_status?: string,
    moderation_result?: any
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

    // Insert admin data into separate table
    const { error: adminError } = await db
        .from('community_posts_admin')
        .insert({
            post_id: data.id,
            moderation_status: adminData?.moderation_status || 'approved',
            moderation_result: adminData?.moderation_result || null,
            hidden: false
        })

    if (adminError) {
        // Rollback: delete the post if admin insert fails
        await db.from('community_posts').delete().eq('id', data.id)
        throw new Error(adminError.message)
    }

    return { ...data, community_posts_admin: { moderation_status: adminData?.moderation_status || 'approved', hidden: false } }
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
    is_recommended?: boolean,
    updated_at?: string
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

    let moderationStatus = 'approved'
    let moderationResult = null

    try {
        const modResult = await moderateContent(updates.title!, updates.content!)
        moderationResult = modResult

        if (modResult.flagged) {
            moderationStatus = 'pending'
        }
    } catch (err) {
        console.error('OpenAI moderation check failed, defaulting to pending:', err)
        moderationStatus = 'pending'
        moderationResult = err ?? null
    }

    const { error: adminError } = await db
        .from('community_posts_admin')
        .upsert({
            post_id: data.id,
            moderation_status: moderationStatus || 'approved',
            moderation_result: moderationResult || null,
            hidden: false
        })

    if (adminError) {
        throw new Error(adminError.message)
    }

    if (moderationStatus === 'pending') {
        logger.communityAlert(`Post flagged by AI: ${FRONTEND_URL}/community/${data.id}`)
        throw new ValidationError(
            `Bài viết của bạn cần được kiểm duyệt trước khi hiện thị công khai`
        )
    }

    return data
}

export async function deleteCommunityPost(id: number) {
    const { data } = await db
        .from('community_posts')
        .select('*')
        .eq('id', id)
        .single()

    if (data.image_url) {
        await deleteImageFromS3(data.image_url)
    }

    const { error } = await db
        .from('community_posts')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getPostComments(postId: number, limit = 50, offset = 0, includeAll = false) {
    const playerSelect = '*, clans!id(*)'

    let query = db
        .from('community_comments')
        .select(`*, players!uid(${playerSelect}), community_comments_admin!inner(moderation_status, moderation_result, hidden)`)
        .eq('post_id', postId)

    if (!includeAll) {
        query = query.eq('community_comments_admin.moderation_status', 'approved')
        query = query.eq('community_comments_admin.hidden', false)
    }

    query = query
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1)

    const { data, error } = await query

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
}, adminData?: {
    moderation_status?: string,
    moderation_result?: any
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

    // Insert admin data into separate table
    const { error: adminError } = await db
        .from('community_comments_admin')
        .insert({
            comment_id: data.id,
            moderation_status: adminData?.moderation_status || 'approved',
            moderation_result: adminData?.moderation_result || null,
            hidden: false
        })

    if (adminError) {
        console.error('Failed to insert comment admin data:', adminError.message)
    }

    return { ...data, community_comments_admin: { moderation_status: adminData?.moderation_status || 'approved', hidden: false } }
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
        .select('levelid, progress, videoLink, mobile, dlPt, flPt, plPt, clPt, levels!public_records_levelid_fkey!inner(id, name, creator, difficulty, isPlatformer)')
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
        .select(`*, players!uid(${playerSelect}), community_posts_admin!inner(moderation_status, hidden)`)
        .eq('community_posts_admin.hidden', false)
        .eq('community_posts_admin.moderation_status', 'approved')
        .or(`attached_level->>id.eq.${levelId},attached_record->>levelID.eq.${levelId}`)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw new Error(error.message)
    return data || []
}

/** Admin: get all comments with filtering (like getCommunityPosts but for comments) */
export async function getAdminComments(options: {
    limit?: number,
    offset?: number,
    search?: string,
    hidden?: boolean,
    moderationStatus?: string,
    postId?: number
}) {
    const {
        limit = 50,
        offset = 0,
        search,
        hidden,
        moderationStatus
    } = options

    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    let query = db
        .from('community_comments')
        .select(`*, players!uid(${playerSelect}), community_comments_admin!inner(moderation_status, moderation_result, hidden), community_posts!post_id(id, title)`)

    // Filter hidden comments via admin table (default: show only non-hidden)
    if (hidden === true) {
        query = query.eq('community_comments_admin.hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('community_comments_admin.hidden', false)
    }

    // Filter by moderation status
    if (moderationStatus) {
        query = query.eq('community_comments_admin.moderation_status', moderationStatus)
    }

    // Filter by post
    if (options.postId) {
        query = query.eq('post_id', options.postId)
    }

    // Search in comment content
    if (search) {
        query = query.ilike('content', `%${search}%`)
    }

    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data || []
}

/** Admin: get count of all comments with filtering */
export async function getAdminCommentsCount(options: {
    search?: string,
    hidden?: boolean,
    moderationStatus?: string,
    postId?: number
}) {
    const { search, hidden, moderationStatus } = options

    let query = db
        .from('community_comments')
        .select('*, community_comments_admin!inner(moderation_status, hidden)', { count: 'exact', head: true })

    if (hidden === true) {
        query = query.eq('community_comments_admin.hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('community_comments_admin.hidden', false)
    }

    if (moderationStatus) {
        query = query.eq('community_comments_admin.moderation_status', moderationStatus)
    }

    if (options.postId) {
        query = query.eq('post_id', options.postId)
    }

    if (search) {
        query = query.ilike('content', `%${search}%`)
    }

    const { count, error } = await query

    if (error) throw new Error(error.message)
    return count || 0
}

export async function toggleHidden(table: 'community_posts' | 'community_comments', id: number, hidden: boolean) {
    if (table === 'community_posts') {
        const { data, error } = await db
            .from('community_posts_admin')
            .update({ hidden })
            .eq('post_id', id)
            .select('*')
            .single()

        if (error) throw new Error(error.message)
        return data
    }

    const { data, error } = await db
        .from('community_comments')
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
        hidden?: boolean,
        tagId?: number
    },
    userId?: string
) {
    const [posts, total] = await Promise.all([
        getCommunityPosts(options),
        getCommunityPostsCount(options.type, options.search, options.hidden, undefined, options.tagId)
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
    is_recommended?: boolean,
    tag_ids?: number[]
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

    // Run OpenAI moderation check on title + content + image (single API call)
    let moderationStatus = 'approved'
    let moderationResult = null

    try {
        const modResult = await moderateContent(title, content || '', image_url || undefined)
        moderationResult = modResult

        if (modResult.flagged) {
            moderationStatus = 'pending'
        }
    } catch (err) {
        console.error('OpenAI moderation check failed, defaulting to pending:', err)
        // If moderation API fails, default to pending for safety
        moderationStatus = 'pending'
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
        is_recommended: postType === 'review' ? is_recommended : undefined,
    }, {
        moderation_status: moderationStatus,
        moderation_result: moderationResult
    })

    if (moderationStatus === 'pending') {
        logger.communityAlert(`Post flagged by AI: ${FRONTEND_URL}/community/${post.id}`)
        throw new ValidationError(
            `Bài viết của bạn cần được kiểm duyệt trước khi hiện thị công khai`
        )
    }

    // Apply user tags if provided
    if (params.tag_ids && params.tag_ids.length > 0) {
        await setPostTags(post.id, params.tag_ids, false)
    }

    // If post is pending moderation, return early (don't send notifications/Discord)
    if (moderationStatus === 'pending') {
        return { ...post, moderation_status: moderationStatus }
    }

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
                    content: `**${playerName}** đã nhắc đến bạn trong bài viết: **${title}**`,
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
            String(DiscordChannel.GENERAL),
            `${emoji} **[${playerName}](${playerProfileUrl})** đã đăng bài trong Community Hub: **${title}**\n${postUrl}`
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

    // Set updated_at to mark the post as edited
    cleanUpdates.updated_at = new Date().toISOString()

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

    // Run OpenAI moderation check on comment content
    let moderationStatus = 'approved'
    let moderationResult = null

    try {
        const modResult = await moderateContent('', content)
        moderationResult = modResult

        if (modResult.flagged) {
            moderationStatus = 'pending'
        }
    } catch (err) {
        console.error('OpenAI moderation check failed for comment, defaulting to pending:', err)
        moderationStatus = 'pending'
    }

    const commentData: any = {
        post_id: postId,
        uid,
        content
    }

    if (attached_level) {
        commentData.attached_level = attached_level
    }

    const comment = await createComment(commentData, {
        moderation_status: moderationStatus,
        moderation_result: moderationResult
    })

    if (moderationStatus === 'pending') {
        logger.communityAlert(`Comment flagged by AI: comment #${comment.id} on post #${postId}`)
        throw new ValidationError(
            `Bình luận của bạn cần được kiểm duyệt trước khi hiện thị công khai`
        )
    }

    // Notify post author about the new comment (if commenter is not the author)
    try {
        const post = await getCommunityPost(postId)
        if (post && post.uid !== uid) {
            await sendNotification({
                to: post.uid,
                content: `**${userName || 'Ai đó'}** đã bình luận bài viết của bạn: **${post.title}**`,
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
                    content: `**${userName || 'Ai đó'}** đã nhắc đến bạn trong bình luận`,
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
    let hasContentChange = false

    if (updates.title !== undefined) {
        cleanUpdates.title = updates.title
        hasContentChange = true
    }
    if (updates.content !== undefined) {
        cleanUpdates.content = updates.content
        hasContentChange = true
    }
    if (updates.type !== undefined) {
        cleanUpdates.type = updates.type
        hasContentChange = true
    }
    if (updates.image_url !== undefined) {
        cleanUpdates.image_url = updates.image_url
        hasContentChange = true
    }
    if (updates.video_url !== undefined) {
        cleanUpdates.video_url = updates.video_url
        hasContentChange = true
    }
    if (updates.pinned !== undefined) {
        cleanUpdates.pinned = updates.pinned
        // Pinning doesn't count as editing content
    }

    // Only set updated_at if actual content changed (not just pinned)
    if (hasContentChange) {
        cleanUpdates.updated_at = new Date().toISOString()
    }

    return await updateCommunityPost(postId, cleanUpdates)
}

/** Get posts by a specific user */
export async function getPostsByUser(uid: string, limit = 20, offset = 0) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await db
        .from('community_posts')
        .select(`*, players!uid(${playerSelect}), community_posts_admin!inner(moderation_status, hidden)`)
        .eq('uid', uid)
        .eq('community_posts_admin.hidden', false)
        .eq('community_posts_admin.moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return data || []
}

/** Get count of posts by a specific user */
export async function getPostsByUserCount(uid: string) {
    const { count, error } = await db
        .from('community_posts')
        .select('*, community_posts_admin!inner(moderation_status, hidden)', { count: 'exact', head: true })
        .eq('uid', uid)
        .eq('community_posts_admin.hidden', false)
        .eq('community_posts_admin.moderation_status', 'approved')

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

// ---- Recommendation System ----

/** Get recommended posts using the scoring function */
export async function getRecommendedPosts(options: {
    userId?: string,
    limit?: number,
    offset?: number,
    type?: string
}) {
    const { userId = null, limit = 25, offset = 0, type = null } = options

    const { data, error } = await db.rpc('get_recommended_community_posts', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
        p_type: type
    })

    if (error) {
        throw new Error(error.message)
    }

    return data || []
}

/** Get recommended posts enriched with player info and like status */
export async function getRecommendedPostsWithLikeStatus(
    options: {
        type?: string,
        limit?: number,
        offset?: number,
    },
    userId?: string
) {
    const { type, limit = 25, offset = 0 } = options

    // Get recommended post IDs with scores
    const recommended = await getRecommendedPosts({
        userId,
        limit,
        offset,
        type
    })

    if (recommended.length === 0) {
        return { data: [], total: 0 }
    }

    // Get full post data with player info for these IDs
    const postIds = recommended.map((r: any) => r.id)
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data: posts, error } = await db
        .from('community_posts')
        .select(`*, players!uid(${playerSelect}), community_posts_admin!inner(moderation_status, hidden)`)
        .in('id', postIds)
        .eq('community_posts_admin.hidden', false)
        .eq('community_posts_admin.moderation_status', 'approved')

    if (error) {
        throw new Error(error.message)
    }

    // Create a map of scores for ordering
    const scoreMap = new Map(recommended.map((r: any) => [r.id, r.recommendation_score]))

    // Merge and sort by recommendation score
    const enrichedPosts = (posts || [])
        .map((p: any) => ({
            ...p,
            recommendation_score: scoreMap.get(p.id) || 0
        }))
        .sort((a: any, b: any) => b.recommendation_score - a.recommendation_score)

    // Add like status
    let userLikedPostIds: number[] = []
    if (userId) {
        userLikedPostIds = await getUserLikes(userId, postIds)
    }

    const data = enrichedPosts.map((p: any) => ({
        ...p,
        liked: userLikedPostIds.includes(p.id)
    }))

    // Get total count for pagination
    const total = await getCommunityPostsCount(type, undefined, false)

    return { data, total }
}

/** Record that a user viewed a post */
export async function recordPostView(userId: string, postId: number) {
    const { error } = await db.rpc('record_community_post_view', {
        p_user_id: userId,
        p_post_id: postId
    })

    if (error) {
        // Non-critical, don't throw
        console.error('Failed to record post view:', error.message)
    }
}

/** Record views for multiple posts (batch) */
export async function recordPostViews(userId: string, postIds: number[]) {
    // Record views in parallel (fire-and-forget style, non-blocking)
    await Promise.allSettled(
        postIds.map(postId => recordPostView(userId, postId))
    )
}

// ---- Moderation (Admin) ----

/** Get posts pending moderation review */
export async function getPendingModerationPosts(options: {
    limit?: number,
    offset?: number
}) {
    const { limit = 50, offset = 0 } = options
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await db
        .from('community_posts')
        .select(`*, players!uid(${playerSelect}), community_posts_admin!inner(moderation_status, moderation_result, hidden)`)
        .eq('community_posts_admin.moderation_status', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return data || []
}

/** Get count of posts pending moderation */
export async function getPendingModerationPostsCount() {
    const { count, error } = await db
        .from('community_posts')
        .select('*, community_posts_admin!inner(moderation_status)', { count: 'exact', head: true })
        .eq('community_posts_admin.moderation_status', 'pending')

    if (error) throw new Error(error.message)
    return count || 0
}

/** Approve a pending post (makes it visible to all users) */
export async function approvePost(postId: number) {
    const post = await getCommunityPost(postId)
    if (!post) throw new NotFoundError('Post not found')

    const { data, error } = await db
        .from('community_posts_admin')
        .update({ moderation_status: 'approved' })
        .eq('post_id', postId)
        .select('*')
        .single()

    if (error) throw new Error(error.message)

    // Now send notifications & Discord message that were deferred
    try {
        const typeEmoji: Record<string, string> = {
            discussion: '💬',
            media: '📸',
            guide: '📖',
            announcement: '📢',
            review: '⭐'
        }
        const emoji = typeEmoji[post.type] || '💬'
        const playerName = post.players?.name || 'Someone'
        const postUrl = `${FRONTEND_URL}/community/${post.id}`
        const playerProfileUrl = `${FRONTEND_URL}/player/${post.uid}`

        await sendMessageToChannel(
            String(DiscordChannel.GENERAL),
            `${emoji} **[${playerName}](${playerProfileUrl})** đã đăng bài trong Community Hub: **${post.title}**\n${postUrl}`
        )
    } catch (err) {
        console.error('Failed to send Discord notification after approval:', err)
    }

    return data
}

/** Get comments pending moderation review */
export async function getPendingModerationComments(options: {
    limit?: number,
    offset?: number
}) {
    const { limit = 50, offset = 0 } = options
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await db
        .from('community_comments')
        .select(`*, players!uid(${playerSelect}), community_comments_admin!inner(moderation_status, moderation_result, hidden), community_posts!post_id(id, title)`)
        .eq('community_comments_admin.moderation_status', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return data || []
}

/** Get count of comments pending moderation */
export async function getPendingModerationCommentsCount() {
    const { count, error } = await db
        .from('community_comments')
        .select('*, community_comments_admin!inner(moderation_status)', { count: 'exact', head: true })
        .eq('community_comments_admin.moderation_status', 'pending')

    if (error) throw new Error(error.message)
    return count || 0
}

/** Approve a pending comment (makes it visible to all users) */
export async function approveComment(commentId: number) {
    const comment = await getComment(commentId)
    if (!comment) throw new NotFoundError('Comment not found')

    const { data, error } = await db
        .from('community_comments_admin')
        .update({ moderation_status: 'approved' })
        .eq('comment_id', commentId)
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

/** Reject a pending comment (deletes it) */
export async function rejectComment(commentId: number) {
    await deleteComment(commentId)
}

/** Update comment moderation status after edit */
export async function updateCommentModeration(commentId: number, content: string) {
    let moderationStatus = 'approved'
    let moderationResult = null

    try {
        const modResult = await moderateContent('', content)
        moderationResult = modResult

        if (modResult.flagged) {
            moderationStatus = 'pending'
        }
    } catch (err) {
        console.error('OpenAI moderation check failed for comment edit, defaulting to pending:', err)
        moderationStatus = 'pending'
    }

    const { error: adminError } = await db
        .from('community_comments_admin')
        .upsert({
            comment_id: commentId,
            moderation_status: moderationStatus || 'approved',
            moderation_result: moderationResult || null,
            hidden: false
        })

    if (adminError) {
        throw new Error(adminError.message)
    }

    if (moderationStatus === 'pending') {
            logger.communityAlert(`Comment flagged by AI: ${FRONTEND_URL}/community/${commentId}`)
        throw new ValidationError(
            `Bình luận của bạn cần được kiểm duyệt trước khi hiện thị công khai`
        )
    }
}

/** Toggle hidden status for a comment via admin table */
export async function toggleCommentHidden(commentId: number, hidden: boolean) {
    const { data, error } = await db
        .from('community_comments_admin')
        .update({ hidden })
        .eq('comment_id', commentId)
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

// ---- Post Tags ----

/** Get all post tags */
export async function getPostTags() {
    const { data, error } = await db
        .from('post_tags')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

/** Create a new post tag (admin only) */
export async function createPostTag(tag: { name: string, color?: string, admin_only?: boolean }) {
    const { data, error } = await db
        .from('post_tags')
        .insert(tag)
        .select('*')
        .single()

    if (error) {
        if (error.code === '23505') throw new ConflictError('Tag already exists')
        throw new Error(error.message)
    }
    return data
}

/** Delete a post tag and all its associations (admin only) */
export async function deletePostTag(tagId: number) {
    // Cascade will handle removing from community_posts_tags
    const { error } = await db
        .from('post_tags')
        .delete()
        .eq('id', tagId)

    if (error) throw new Error(error.message)
}

/** Update a post tag's name, color, and/or admin_only flag (admin only) */
export async function updatePostTag(tagId: number, updates: { name?: string, color?: string, admin_only?: boolean }) {
    const { data, error } = await db
        .from('post_tags')
        .update(updates)
        .eq('id', tagId)
        .select('*')
        .single()

    if (error) {
        if (error.code === '23505') throw new ConflictError('Tag already exists')
        throw new Error(error.message)
    }
    return data
}

/** Set tags on a post. isAdmin controls whether admin_only tags can be applied */
export async function setPostTags(postId: number, tagIds: number[], isAdmin: boolean) {
    // Validate tags exist and check admin_only constraint
    if (tagIds.length > 0) {
        const { data: tags, error: tagError } = await db
            .from('post_tags')
            .select('id, admin_only')
            .in('id', tagIds)

        if (tagError) throw new Error(tagError.message)

        if (!isAdmin) {
            const adminOnlyTags = tags?.filter((t: any) => t.admin_only) || []
            if (adminOnlyTags.length > 0) {
                throw new ForbiddenError('Some tags can only be applied by admins')
            }
        }
    }

    // Remove existing tags
    await db
        .from('community_posts_tags')
        .delete()
        .eq('post_id', postId)

    // Insert new tags
    if (tagIds.length > 0) {
        const rows = tagIds.map(tag_id => ({ post_id: postId, tag_id }))
        const { error } = await db
            .from('community_posts_tags')
            .insert(rows)

        if (error) throw new Error(error.message)
    }

    // Return updated tags
    const { data, error } = await db
        .from('community_posts_tags')
        .select('tag_id, post_tags(id, name, color, admin_only)')
        .eq('post_id', postId)

    if (error) throw new Error(error.message)
    return data || []
}
