import supabase from "@src/client/supabase"

// Note: The community tables (community_posts, community_comments, community_likes)
// are not yet in the auto-generated Supabase types. After running the migration,
// regenerate types with: supabase gen types typescript --local > src/types/supabase.ts
// Until then, we use type assertions to bypass TypeScript checks.
const db: any = supabase

export async function getCommunityPosts(options: {
    type?: string,
    limit?: number,
    offset?: number,
    sortBy?: string,
    ascending?: boolean,
    pinFirst?: boolean
}) {
    const {
        type,
        limit = 20,
        offset = 0,
        sortBy = 'created_at',
        ascending = false,
        pinFirst = true
    } = options

    let query = db
        .from('community_posts')
        .select('*, players!uid(uid, name, isAvatarGif, supporterUntil, avatarVersion)')

    if (type) {
        query = query.eq('type', type)
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

export async function getCommunityPostsCount(type?: string) {
    let query = db
        .from('community_posts')
        .select('*', { count: 'exact', head: true })

    if (type) {
        query = query.eq('type', type)
    }

    const { count, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return count || 0
}

export async function getCommunityPost(id: number) {
    const { data, error } = await db
        .from('community_posts')
        .select('*, players!uid(uid, name, isAvatarGif, supporterUntil, avatarVersion)')
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
    image_url?: string
}) {
    const { data, error } = await db
        .from('community_posts')
        .insert(post)
        .select('*, players!uid(uid, name, isAvatarGif, supporterUntil, avatarVersion)')
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
    pinned?: boolean
}) {
    const { data, error } = await db
        .from('community_posts')
        .update(updates)
        .eq('id', id)
        .select('*, players!uid(uid, name, isAvatarGif, supporterUntil, avatarVersion)')
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
    const { data, error } = await db
        .from('community_comments')
        .select('*, players!uid(uid, name, isAvatarGif, supporterUntil, avatarVersion)')
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
    content: string
}) {
    const { data, error } = await db
        .from('community_comments')
        .insert(comment)
        .select('*, players!uid(uid, name, isAvatarGif, supporterUntil, avatarVersion)')
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
