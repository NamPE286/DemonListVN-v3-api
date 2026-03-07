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
import type { Json } from '@src/types/supabase'

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
        sortBy = 'createdAt',
        ascending = false,
        pinFirst = true,
        search,
        hidden,
        moderationStatus
    } = options

    // Pre-filter: get post IDs that have the matching tag
    let tagFilteredIds: number[] | null = null
    if (options.tagId) {
        const { data: tagRows, error: tagError } = await supabase
            .from('communityPostsTags')
            .select('postId')
            .eq('tagId', options.tagId)
        if (tagError) throw new Error(tagError.message)
        tagFilteredIds = [...new Set((tagRows || []).map((r: any) => r.postId))] as number[]
        if (tagFilteredIds.length === 0) return []
    }

    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    // @ts-ignore
    let query = supabase
        .from('communityPosts')
        .select(`*, players!uid(${playerSelect}), communityPostsAdmin!inner(moderationStatus, moderationResult, hidden), communityPostsTags(tagId, postTags(id, name, color, adminOnly))`)

    if (type) {
        query = query.eq('type', type)
    }

    // Filter hidden posts via admin table (default: show only non-hidden)
    if (hidden === true) {
        query = query.eq('communityPostsAdmin.hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('communityPostsAdmin.hidden', false)
    }

    // Only show approved posts to public (unless admin explicitly requests all)
    if (options.moderationStatus) {
        query = query.eq('communityPostsAdmin.moderationStatus', options.moderationStatus)
    } else {
        query = query.eq('communityPostsAdmin.moderationStatus', 'approved')
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
        const { data: tagRows, error: tagError } = await supabase
            .from('communityPostsTags')
            .select('postId')
            .eq('tagId', tagId)
        if (tagError) throw new Error(tagError.message)
        tagFilteredIds = [...new Set((tagRows || []).map((r: any) => r.postId))] as number[]
        if (tagFilteredIds.length === 0) return 0
    }

    let query = supabase
        .from('communityPosts')
        .select('*, communityPostsAdmin!inner(moderationStatus, hidden)', { count: 'exact', head: true })

    if (type) {
        query = query.eq('type', type)
    }

    if (hidden === true) {
        query = query.eq('communityPostsAdmin.hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('communityPostsAdmin.hidden', false)
    }

    // Filter by moderation status (default: approved only)
    if (moderationStatus) {
        query = query.eq('communityPostsAdmin.moderationStatus', moderationStatus)
    } else {
        query = query.eq('communityPostsAdmin.moderationStatus', 'approved')
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

    // @ts-ignore
    const { data, error } = await supabase
        .from('communityPosts')
        .select(`*, players!uid(${playerSelect}), communityPostsAdmin(moderationStatus, moderationResult, hidden), communityPostsTags(tagId, postTags(id, name, color, adminOnly))`)
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
    imageUrl?: string,
    videoUrl?: string,
    attachedRecord?: any,
    attachedLevel?: any,
    isRecommended?: boolean,
    maxParticipants?: number | null,
}, adminData?: {
    moderationStatus?: string,
    moderationResult?: any
}) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await supabase
        .from('communityPosts')
        .insert(post)
        .select(`*, players!uid(${playerSelect})`)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    // Insert admin data into separate table
    const { error: adminError } = await supabase
        .from('communityPostsAdmin')
        .insert({
            postId: data.id,
            moderationStatus: adminData?.moderationStatus || 'approved',
            moderationResult: adminData?.moderationResult || null,
            hidden: false
        })

    if (adminError) {
        // Rollback: delete the post if admin insert fails
        await supabase.from('communityPosts').delete().eq('id', data.id)
        throw new Error(adminError.message)
    }

    return { ...data, communityPostsAdmin: { moderationStatus: adminData?.moderationStatus || 'approved', hidden: false } }
}

export async function updateCommunityPost(id: number, updates: {
    title?: string,
    content?: string,
    type?: string,
    imageUrl?: string,
    videoUrl?: string,
    pinned?: boolean,
    attachedRecord?: any,
    attachedLevel?: any,
    isRecommended?: boolean,
    updatedAt?: string
}) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await supabase
        .from('communityPosts')
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

    const { error: adminError } = await supabase
        .from('communityPostsAdmin')
        .upsert({
            postId: data.id,
            moderationStatus: moderationStatus || 'approved',
            moderationResult: (moderationResult as Json) || null,
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
    const { data } = await supabase
        .from('communityPosts')
        .select('*')
        .eq('id', id)
        .single()

    if (!data) {
        throw new NotFoundError('Post not found')
    }

    if (data.imageUrl) {
        await deleteImageFromS3(data.imageUrl)
    }

    const { error } = await supabase
        .from('communityPosts')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getPostComments(postId: number, limit = 50, offset = 0, includeAll = false) {
    const playerSelect = '*, clans!id(*)'

    let query = supabase
        .from('communityComments')
        .select(`*, players!uid(${playerSelect}), communityCommentsAdmin!inner(moderationStatus, moderationResult, hidden)`)
        .eq('postId', postId)

    if (!includeAll) {
        query = query.eq('communityCommentsAdmin.moderationStatus', 'approved')
        query = query.eq('communityCommentsAdmin.hidden', false)
    }

    query = query
        .order('createdAt', { ascending: true })
        .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function createComment(comment: {
    postId: number,
    uid: string,
    content: string,
    attachedLevel?: any
}, adminData?: {
    moderationStatus?: string,
    moderationResult?: any
}) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await supabase
        .from('communityComments')
        .insert(comment)
        .select(`*, players!uid(${playerSelect})`)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    // Insert admin data into separate table
    const { error: adminError } = await supabase
        .from('communityCommentsAdmin')
        .insert({
            commentId: data.id,
            moderationStatus: adminData?.moderationStatus || 'approved',
            moderationResult: adminData?.moderationResult || null,
            hidden: false
        })

    if (adminError) {
        console.error('Failed to insert comment admin data:', adminError.message)
    }

    return { ...data, communityCommentsAdmin: { moderationStatus: adminData?.moderationStatus || 'approved', hidden: false } }
}

export async function deleteComment(id: number) {
    const { error } = await supabase
        .from('communityComments')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getComment(id: number) {
    const { data, error } = await supabase
        .from('communityComments')
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
    const { data: existing } = await supabase
        .from('communityLikes')
        .select('id')
        .eq('uid', uid)
        .eq('postId', postId)
        .limit(1)
        .maybeSingle()

    if (existing) {
        // Unlike
        const { error } = await supabase
            .from('communityLikes')
            .delete()
            .eq('id', existing.id)

        if (error) throw new Error(error.message)
        return { liked: false }
    } else {
        // Like
        const { error } = await supabase
            .from('communityLikes')
            .insert({ uid, postId: postId })

        if (error) throw new Error(error.message)
        return { liked: true }
    }
}

export async function toggleCommentLike(uid: string, commentId: number) {
    const { data: existing } = await supabase
        .from('communityLikes')
        .select('id')
        .eq('uid', uid)
        .eq('commentId', commentId)
        .limit(1)
        .maybeSingle()

    if (existing) {
        const { error } = await supabase
            .from('communityLikes')
            .delete()
            .eq('id', existing.id)

        if (error) throw new Error(error.message)
        return { liked: false }
    } else {
        const { error } = await supabase
            .from('communityLikes')
            .insert({ uid, commentId: commentId })

        if (error) throw new Error(error.message)
        return { liked: true }
    }
}

export async function getUserLikes(uid: string, postIds: number[]) {
    if (!postIds.length) return []

    const { data, error } = await supabase
        .from('communityLikes')
        .select('postId')
        .eq('uid', uid)
        .in('postId', postIds)

    if (error) throw new Error(error.message)
    return data?.map((l: any) => l.postId) || []
}

export async function getUserCommentLikes(uid: string, commentIds: number[]) {
    if (!commentIds.length) return []

    const { data, error } = await supabase
        .from('communityLikes')
        .select('commentId')
        .eq('uid', uid)
        .in('commentId', commentIds)

    if (error) throw new Error(error.message)
    return data?.map((l: any) => l.commentId) || []
}

// ---- Reports ----

export async function createReport(report: {
    uid: string,
    postId?: number,
    commentId?: number,
    reason: string,
    description?: string
}) {
    const { data, error } = await supabase
        .from('communityReports')
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

    let query = supabase
        .from('communityReports')
        .select(`*, players!uid(${playerSelect}), communityPosts(id, title, type), communityComments(id, content)`)

    if (resolved !== undefined) {
        query = query.eq('resolved', resolved)
    }

    query = query
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
}

export async function getReportsCount(resolved?: boolean) {
    let query = supabase
        .from('communityReports')
        .select('*', { count: 'exact', head: true })

    if (resolved !== undefined) {
        query = query.eq('resolved', resolved)
    }

    const { count, error } = await query
    if (error) throw new Error(error.message)
    return count || 0
}

export async function resolveReport(id: number) {
    const { data, error } = await supabase
        .from('communityReports')
        .update({ resolved: true })
        .eq('id', id)
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function getUserRecordsForPicker(uid: string) {
    const { data, error } = await supabase
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
    let query = supabase
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
    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)')
        .ilike('name', `%${query}%`)
        .limit(limit)

    if (error) throw new Error(error.message)
    return data || []
}

export async function getPostsByLevel(levelId: number, limit = 5) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await supabase
        .from('communityPosts')
        .select(`*, players!uid(${playerSelect}), communityPostsAdmin!inner(moderationStatus, hidden)`)
        .eq('communityPostsAdmin.hidden', false)
        .eq('communityPostsAdmin.moderationStatus', 'approved')
        .or(`attachedLevel->>id.eq.${levelId},attachedRecord->>levelID.eq.${levelId}`)
        .order('createdAt', { ascending: false })
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

    let query = supabase
        .from('communityComments')
        .select(`*, players!uid(${playerSelect}), communityCommentsAdmin!inner(moderationStatus, moderationResult, hidden), communityPosts!postId(id, title)`)

    // Filter hidden comments via admin table (default: show only non-hidden)
    if (hidden === true) {
        query = query.eq('communityCommentsAdmin.hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('communityCommentsAdmin.hidden', false)
    }

    // Filter by moderation status
    if (moderationStatus) {
        query = query.eq('communityCommentsAdmin.moderationStatus', moderationStatus)
    }

    // Filter by post
    if (options.postId) {
        query = query.eq('postId', options.postId)
    }

    // Search in comment content
    if (search) {
        query = query.ilike('content', `%${search}%`)
    }

    query = query
        .order('createdAt', { ascending: false })
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

    let query = supabase
        .from('communityComments')
        .select('*, communityCommentsAdmin!inner(moderationStatus, hidden)', { count: 'exact', head: true })

    if (hidden === true) {
        query = query.eq('communityCommentsAdmin.hidden', true)
    } else if (hidden === false || hidden === undefined) {
        query = query.eq('communityCommentsAdmin.hidden', false)
    }

    if (moderationStatus) {
        query = query.eq('communityCommentsAdmin.moderationStatus', moderationStatus)
    }

    if (options.postId) {
        query = query.eq('postId', options.postId)
    }

    if (search) {
        query = query.ilike('content', `%${search}%`)
    }

    const { count, error } = await query

    if (error) throw new Error(error.message)
    return count || 0
}

export async function toggleHidden(table: 'communityPosts' | 'communityComments', id: number, hidden: boolean) {
    if (table === 'communityPosts') {
        const { data, error } = await supabase
            .from('communityPostsAdmin')
            .update({ hidden })
            .eq('postId', id)
            .select('*')
            .single()

        if (error) throw new Error(error.message)
        return data
    }

    const { data, error } = await supabase
        .from('communityComments')
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
    imageUrl?: string,
    videoUrl?: string,
    attachedRecord?: any,
    attachedLevel?: any,
    isRecommended?: boolean,
    tagIds?: number[],
    maxParticipants?: number | null
}) {
    const { uid, isAdmin, title, content, type, imageUrl, videoUrl, attachedRecord, attachedLevel, isRecommended, maxParticipants } = params

    if (!title) {
        throw new ValidationError('Title is required')
    }

    const validTypes = ['discussion', 'media', 'guide', 'announcement', 'review', 'collab']
    const postType = validTypes.includes(type || '') ? type! : 'discussion'

    // Only admins can create announcements
    if (postType === 'announcement' && !isAdmin) {
        throw new ForbiddenError('Only admins can create announcements')
    }

    // Validate maxParticipants for collab posts
    let validatedMaxParticipants: number | null = null
    if (postType === 'collab') {
        if (maxParticipants === undefined || maxParticipants === null) {
            throw new ValidationError('Collab posts must specify maxParticipants')
        }
        const parsed = Number(maxParticipants)
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
            throw new ValidationError('maxParticipants must be an integer between 1 and 100')
        }
        validatedMaxParticipants = parsed
    } else if (maxParticipants !== undefined && maxParticipants !== null) {
        throw new ValidationError('Only collab posts can have maxParticipants')
    }

    // Review posts must have an attached level and user must have an accepted record for it
    if (postType === 'review') {
        if (!attachedLevel || !attachedLevel.id) {
            throw new ValidationError('Review posts must have an attached level')
        }
        if (typeof isRecommended !== 'boolean') {
            throw new ValidationError('Review posts must specify recommendation')
        }
        const userRecords = await getUserRecordsForPicker(uid)
        const hasRecord = userRecords.some((r: any) => r.levelid === attachedLevel.id)
        if (!hasRecord) {
            throw new ForbiddenError('You must have an accepted record for this level to write a review')
        }
    }

    // If a level is attached, fetch from GD and insert into levels table if not exists
    if (attachedLevel && attachedLevel.id) {
        try {
            const gdLevel = await fetchLevelFromGD(attachedLevel.id)
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
        const modResult = await moderateContent(title, content || '', imageUrl || undefined)
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
        imageUrl,
        videoUrl,
        attachedRecord: attachedRecord || undefined,
        attachedLevel: attachedLevel || undefined,
        isRecommended: postType === 'review' ? isRecommended : undefined,
        maxParticipants: validatedMaxParticipants,
    }, {
        moderationStatus: moderationStatus,
        moderationResult: moderationResult
    })

    if (moderationStatus === 'pending') {
        logger.communityAlert(`Post flagged by AI: ${FRONTEND_URL}/community/${post.id}`)
        throw new ValidationError(
            `Bài viết của bạn cần được kiểm duyệt trước khi hiện thị công khai`
        )
    }

    // Apply user tags if provided
    if (params.tagIds && params.tagIds.length > 0) {
        await setPostTags(post.id, params.tagIds, false)
    }

    // If post is pending moderation, return early (don't send notifications/Discord)
    if (moderationStatus === 'pending') {
        return { ...post, moderationStatus: moderationStatus }
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
            review: '⭐',
            collab: '🤝'
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
    updates: { title?: string, content?: string, type?: string, imageUrl?: string, videoUrl?: string }
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
    if (updates.imageUrl !== undefined) cleanUpdates.imageUrl = updates.imageUrl
    if (updates.videoUrl !== undefined) cleanUpdates.videoUrl = updates.videoUrl

    // Set updatedAt to mark the post as edited
    cleanUpdates.updatedAt = new Date().toISOString()

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
    attachedLevel?: any
}) {
    const { postId, uid, userName, content, attachedLevel } = params

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
        postId: postId,
        uid,
        content
    }

    if (attachedLevel) {
        commentData.attachedLevel = attachedLevel
    }

    const comment = await createComment(commentData, {
        moderationStatus: moderationStatus,
        moderationResult: moderationResult
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
    postId?: number,
    commentId?: number,
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
    updates: { title?: string, content?: string, type?: string, pinned?: boolean, imageUrl?: string, videoUrl?: string }
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
    if (updates.imageUrl !== undefined) {
        cleanUpdates.imageUrl = updates.imageUrl
        hasContentChange = true
    }
    if (updates.videoUrl !== undefined) {
        cleanUpdates.videoUrl = updates.videoUrl
        hasContentChange = true
    }
    if (updates.pinned !== undefined) {
        cleanUpdates.pinned = updates.pinned
        // Pinning doesn't count as editing content
    }

    // Only set updatedAt if actual content changed (not just pinned)
    if (hasContentChange) {
        cleanUpdates.updatedAt = new Date().toISOString()
    }

    return await updateCommunityPost(postId, cleanUpdates)
}

/** Get posts by a specific user */
export async function getPostsByUser(uid: string, limit = 20, offset = 0) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await supabase
        .from('communityPosts')
        .select(`*, players!uid(${playerSelect}), communityPostsAdmin!inner(moderationStatus, hidden)`)
        .eq('uid', uid)
        .eq('communityPostsAdmin.hidden', false)
        .eq('communityPostsAdmin.moderationStatus', 'approved')
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return data || []
}

/** Get count of posts by a specific user */
export async function getPostsByUserCount(uid: string) {
    const { count, error } = await supabase
        .from('communityPosts')
        .select('*, communityPostsAdmin!inner(moderationStatus, hidden)', { count: 'exact', head: true })
        .eq('uid', uid)
        .eq('communityPostsAdmin.hidden', false)
        .eq('communityPostsAdmin.moderationStatus', 'approved')

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
    const { userId, limit = 25, offset = 0, type } = options

    const { data, error } = await supabase.rpc('get_recommended_community_posts', {
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

    const { data: posts, error } = await supabase
        .from('communityPosts')
        .select(`*, players!uid(${playerSelect}), communityPostsAdmin!inner(moderationStatus, hidden)`)
        .in('id', postIds)
        .eq('communityPostsAdmin.hidden', false)
        .eq('communityPostsAdmin.moderationStatus', 'approved')

    if (error) {
        throw new Error(error.message)
    }

    // Create a map of scores for ordering
    const scoreMap = new Map(recommended.map((r: any) => [r.id, r.recommendationScore]))

    // Merge and sort by recommendation score
    const enrichedPosts = (posts || [])
        .map((p: any) => ({
            ...p,
            recommendationScore: scoreMap.get(p.id) || 0
        }))
        .sort((a: any, b: any) => b.recommendationScore - a.recommendationScore)

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
    const { error } = await supabase.rpc('record_community_post_view', {
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

    const { data, error } = await supabase
        .from('communityPosts')
        .select(`*, players!uid(${playerSelect}), communityPostsAdmin!inner(moderationStatus, moderationResult, hidden)`)
        .eq('communityPostsAdmin.moderationStatus', 'pending')
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return data || []
}

/** Get count of posts pending moderation */
export async function getPendingModerationPostsCount() {
    const { count, error } = await supabase
        .from('communityPosts')
        .select('*, communityPostsAdmin!inner(moderationStatus)', { count: 'exact', head: true })
        .eq('communityPostsAdmin.moderationStatus', 'pending')

    if (error) throw new Error(error.message)
    return count || 0
}

/** Approve a pending post (makes it visible to all users) */
export async function approvePost(postId: number) {
    const post = await getCommunityPost(postId)
    if (!post) throw new NotFoundError('Post not found')

    const { data, error } = await supabase
        .from('communityPostsAdmin')
        .update({ moderationStatus: 'approved' })
        .eq('postId', postId)
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
            review: '⭐',
            collab: '🤝'
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

    const { data, error } = await supabase
        .from('communityComments')
        .select(`*, players!uid(${playerSelect}), communityCommentsAdmin!inner(moderationStatus, moderationResult, hidden), communityPosts!postId(id, title)`)
        .eq('communityCommentsAdmin.moderationStatus', 'pending')
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return data || []
}

/** Get count of comments pending moderation */
export async function getPendingModerationCommentsCount() {
    const { count, error } = await supabase
        .from('communityComments')
        .select('*, communityCommentsAdmin!inner(moderationStatus)', { count: 'exact', head: true })
        .eq('communityCommentsAdmin.moderationStatus', 'pending')

    if (error) throw new Error(error.message)
    return count || 0
}

/** Approve a pending comment (makes it visible to all users) */
export async function approveComment(commentId: number) {
    const comment = await getComment(commentId)
    if (!comment) throw new NotFoundError('Comment not found')

    const { data, error } = await supabase
        .from('communityCommentsAdmin')
        .update({ moderationStatus: 'approved' })
        .eq('commentId', commentId)
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

    const { error: adminError } = await supabase
        .from('communityCommentsAdmin')
        .upsert({
            commentId: commentId,
            moderationStatus: moderationStatus || 'approved',
            moderationResult: (moderationResult as Json) || null,
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
    const { data, error } = await supabase
        .from('communityCommentsAdmin')
        .update({ hidden })
        .eq('commentId', commentId)
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

// ---- Post Tags ----

/** Get all post tags */
export async function getPostTags() {
    const { data, error } = await supabase
        .from('postTags')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

/** Create a new post tag (admin only) */
export async function createPostTag(tag: { name: string, color?: string, adminOnly?: boolean }) {
    const { data, error } = await supabase
        .from('postTags')
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
    // Cascade will handle removing from communityPostsTags
    const { error } = await supabase
        .from('postTags')
        .delete()
        .eq('id', tagId)

    if (error) throw new Error(error.message)
}

/** Update a post tag's name, color, and/or adminOnly flag (admin only) */
export async function updatePostTag(tagId: number, updates: { name?: string, color?: string, adminOnly?: boolean }) {
    const { data, error } = await supabase
        .from('postTags')
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

/** Set tags on a post. isAdmin controls whether adminOnly tags can be applied */
export async function setPostTags(postId: number, tagIds: number[], isAdmin: boolean) {
    // Validate tags exist and check adminOnly constraint
    if (tagIds.length > 0) {
        const { data: tags, error: tagError } = await supabase
            .from('postTags')
            .select('id, adminOnly')
            .in('id', tagIds)

        if (tagError) throw new Error(tagError.message)

        if (!isAdmin) {
            const adminOnlyTags = tags?.filter((t: any) => t.adminOnly) || []
            if (adminOnlyTags.length > 0) {
                throw new ForbiddenError('Some tags can only be applied by admins')
            }
        }
    }

    // Remove existing tags
    await supabase
        .from('communityPostsTags')
        .delete()
        .eq('postId', postId)

    // Insert new tags
    if (tagIds.length > 0) {
        const rows = tagIds.map((tagId) => ({ postId, tagId }))
        const { error } = await supabase
            .from('communityPostsTags')
            .insert(rows)

        if (error) throw new Error(error.message)
    }

    // Return updated tags
    const { data, error } = await supabase
        .from('communityPostsTags')
        .select('tagId, postTags(id, name, color, adminOnly)')
        .eq('postId', postId)

    if (error) throw new Error(error.message)
    return data || []
}

// ---- Participant Management ----

export async function getPostParticipants(postId: number) {
    const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

    const { data, error } = await supabase
        .from('communityPostParticipants')
        .select(`*, players!uid(${playerSelect})`)
        .eq('postId', postId)
        .order('createdAt', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

export async function getParticipantStatus(postId: number, uid: string) {
    const { data, error } = await supabase
        .from('communityPostParticipants')
        .select('*')
        .eq('postId', postId)
        .eq('uid', uid)
        .maybeSingle()

    if (error) throw new Error(error.message)
    return data
}

export async function requestParticipation(postId: number, uid: string) {
    // Fetch the post to check constraints
    const { data: post, error: postError } = await supabase
        .from('communityPosts')
        .select('uid, type, maxParticipants, participantsCount')
        .eq('id', postId)
        .single()

    if (postError || !post) throw new NotFoundError('Post not found')

    // Cannot join your own post
    if (post.uid === uid) {
        throw new ValidationError('Cannot request participation on your own post')
    }

    // Only collab posts accept participants
    if (post.type !== 'collab') {
        throw new ValidationError('This post does not accept participants')
    }

    // Check if already full
    if (post.participantsCount >= post.maxParticipants!) {
        throw new ValidationError('This post has reached its participant limit')
    }

    // Check if already requested
    const existing = await getParticipantStatus(postId, uid)
    if (existing) {
        if (existing.status === 'rejected') {
            // Allow re-request after rejection
            const { data, error } = await supabase
                .from('communityPostParticipants')
                .update({ status: 'pending', updatedAt: new Date().toISOString() })
                .eq('id', existing.id)
                .select('*')
                .single()
            if (error) throw new Error(error.message)
            return data
        }
        throw new ConflictError('You have already requested to participate')
    }

    const { data, error } = await supabase
        .from('communityPostParticipants')
        .insert({ postId, uid, status: 'pending' })
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function approveParticipant(postId: number, participantUid: string, ownerUid: string) {
    // Verify ownership
    const { data: post, error: postError } = await supabase
        .from('communityPosts')
        .select('uid, type, maxParticipants, participantsCount')
        .eq('id', postId)
        .single()

    if (postError || !post) throw new NotFoundError('Post not found')
    if (post.uid !== ownerUid) throw new ForbiddenError('Only the post owner can approve participants')
    if (post.type !== 'collab') throw new ValidationError('This post does not accept participants')

    // Check if would exceed limit
    if (post.participantsCount >= post.maxParticipants!) {
        throw new ValidationError('Cannot approve: participant limit already reached')
    }

    // Find the pending request
    const existing = await getParticipantStatus(postId, participantUid)
    if (!existing) throw new NotFoundError('Participation request not found')
    if (existing.status === 'approved') throw new ConflictError('Already approved')
    if (existing.status !== 'pending') throw new ValidationError('Can only approve pending requests')

    // Approve the participant
    const { data, error } = await supabase
        .from('communityPostParticipants')
        .update({ status: 'approved', updatedAt: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*')
        .single()

    if (error) throw new Error(error.message)

    // Increment participantsCount
    await supabase
        .from('communityPosts')
        .update({ participantsCount: post.participantsCount + 1 })
        .eq('id', postId)

    // Send notification to the approved participant
    try {
        const { data: owner } = await supabase.from('players').select('name').eq('uid', ownerUid).single()
        await sendNotification({
            to: participantUid,
            content: `**${owner?.name || 'Someone'}** đã chấp nhận yêu cầu tham gia của bạn`,
            redirect: `${FRONTEND_URL}/community/${postId}`
        })
    } catch {}

    return data
}

export async function rejectParticipant(postId: number, participantUid: string, ownerUid: string) {
    // Verify ownership
    const { data: post, error: postError } = await supabase
        .from('communityPosts')
        .select('uid, maxParticipants')
        .eq('id', postId)
        .single()

    if (postError || !post) throw new NotFoundError('Post not found')
    if (post.uid !== ownerUid) throw new ForbiddenError('Only the post owner can reject participants')

    const existing = await getParticipantStatus(postId, participantUid)
    if (!existing) throw new NotFoundError('Participation request not found')
    if (existing.status !== 'pending') throw new ValidationError('Can only reject pending requests')

    const { data, error } = await supabase
        .from('communityPostParticipants')
        .update({ status: 'rejected', updatedAt: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function revokeParticipant(postId: number, participantUid: string, ownerUid: string) {
    // Verify ownership
    const { data: post, error: postError } = await supabase
        .from('communityPosts')
        .select('uid, type, maxParticipants, participantsCount')
        .eq('id', postId)
        .single()

    if (postError || !post) throw new NotFoundError('Post not found')
    if (post.uid !== ownerUid) throw new ForbiddenError('Only the post owner can revoke participants')
    if (post.type !== 'collab') throw new ValidationError('This post does not accept participants')

    // Cannot revoke when post is full
    if (post.participantsCount >= post.maxParticipants!) {
        throw new ValidationError('Cannot revoke participants after the post is full')
    }

    const existing = await getParticipantStatus(postId, participantUid)
    if (!existing) throw new NotFoundError('Participant not found')
    if (existing.status !== 'approved') throw new ValidationError('Can only revoke approved participants')

    // Remove participant record
    const { error } = await supabase
        .from('communityPostParticipants')
        .delete()
        .eq('id', existing.id)

    if (error) throw new Error(error.message)

    // Decrement participantsCount
    await supabase
        .from('communityPosts')
        .update({ participantsCount: Math.max(0, post.participantsCount - 1) })
        .eq('id', postId)

    return { success: true }
}

export async function cancelParticipation(postId: number, uid: string) {
    const existing = await getParticipantStatus(postId, uid)
    if (!existing) throw new NotFoundError('Participation request not found')

    // If approved, check if post is full - cannot cancel if full
    if (existing.status === 'approved') {
        const { data: post } = await supabase
            .from('communityPosts')
            .select('maxParticipants, participantsCount')
            .eq('id', postId)
            .single()

        if (post && post.maxParticipants !== null && post.participantsCount >= post.maxParticipants) {
            throw new ValidationError('Cannot cancel participation after the post is full')
        }

        // Decrement count
        if (post) {
            await supabase
                .from('communityPosts')
                .update({ participantsCount: Math.max(0, post.participantsCount - 1) })
                .eq('id', postId)
        }
    }

    const { error } = await supabase
        .from('communityPostParticipants')
        .delete()
        .eq('id', existing.id)

    if (error) throw new Error(error.message)
    return { success: true }
}
