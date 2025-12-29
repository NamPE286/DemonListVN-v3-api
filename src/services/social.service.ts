import supabase from '@src/client/supabase'
import type { Database } from '@src/types/supabase'

type Post = Database['public']['Tables']['posts']['Row']
type PostInsert = Database['public']['Tables']['posts']['Insert']
type PostUpdate = Database['public']['Tables']['posts']['Update']
type PostComment = Database['public']['Tables']['postComments']['Row']
type PostCommentInsert = Database['public']['Tables']['postComments']['Insert']

const POST_SELECT = '*, players!posts_authorId_fkey(uid, name, profilepic)'
const COMMENT_SELECT = '*, players!postComments_authorId_fkey(uid, name, profilepic)'

// Post operations
export async function createPost(data: PostInsert) {
    const { data: post, error } = await supabase
        .from('posts')
        .insert(data)
        .select(POST_SELECT)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return post
}

export async function getPost(postId: number, userId?: string) {
    let query = supabase
        .from('posts')
        .select(`
            *,
            players!posts_authorId_fkey(uid, name, profilepic),
            postLikes(count),
            postComments(count),
            postReposts(count)
        `)
        .eq('id', postId)
        .eq('isDeleted', false)

    const { data: post, error } = await query.maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!post) {
        throw new Error('Post not found')
    }

    // Check if current user has liked, commented, or reposted
    if (userId) {
        const { data: userInteractions } = await supabase
            .from('postLikes')
            .select('userId')
            .eq('postId', postId)
            .eq('userId', userId)
            .maybeSingle()

        const { data: userRepost } = await supabase
            .from('postReposts')
            .select('id')
            .eq('postId', postId)
            .eq('userId', userId)
            .maybeSingle()

        return {
            ...post,
            isLiked: !!userInteractions,
            isReposted: !!userRepost
        }
    }

    return post
}

export async function updatePost(postId: number, data: PostUpdate, authorId: string) {
    const { data: post, error } = await supabase
        .from('posts')
        .update(data)
        .eq('id', postId)
        .eq('authorId', authorId)
        .select(POST_SELECT)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return post
}

export async function deletePost(postId: number, userId: string, isAdmin: boolean = false) {
    let query = supabase
        .from('posts')
        .update({ isDeleted: true })
        .eq('id', postId)

    if (!isAdmin) {
        query = query.eq('authorId', userId)
    }

    const { error } = await query

    if (error) {
        throw new Error(error.message)
    }
}

// Feed operations
export async function getFeed({ start = 0, end = 20, userId }: { start?: number, end?: number, userId?: string } = {}) {
    let query = supabase
        .from('posts')
        .select(`
            *,
            players!posts_authorId_fkey(uid, name, profilepic),
            postLikes(count),
            postComments(count),
            postReposts(count)
        `)
        .eq('isDeleted', false)
        .order('created_at', { ascending: false })
        .range(start, end)

    const { data: posts, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    // If user is logged in, check their interactions
    if (userId && posts && posts.length > 0) {
        const postIds = posts.map(p => p.id)

        const { data: likes } = await supabase
            .from('postLikes')
            .select('postId')
            .eq('userId', userId)
            .in('postId', postIds)

        const { data: reposts } = await supabase
            .from('postReposts')
            .select('postId')
            .eq('userId', userId)
            .in('postId', postIds)

        const likedPostIds = new Set(likes?.map(l => l.postId) || [])
        const repostedPostIds = new Set(reposts?.map(r => r.postId) || [])

        return posts.map(post => ({
            ...post,
            isLiked: likedPostIds.has(post.id),
            isReposted: repostedPostIds.has(post.id)
        }))
    }

    return posts
}

export async function getUserPosts({ userId, start = 0, end = 20, viewerId }: { userId: string, start?: number, end?: number, viewerId?: string }) {
    let query = supabase
        .from('posts')
        .select(`
            *,
            players!posts_authorId_fkey(uid, name, profilepic),
            postLikes(count),
            postComments(count),
            postReposts(count)
        `)
        .eq('authorId', userId)
        .eq('isDeleted', false)
        .order('created_at', { ascending: false })
        .range(start, end)

    const { data: posts, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    // If viewer is logged in, check their interactions
    if (viewerId && posts && posts.length > 0) {
        const postIds = posts.map(p => p.id)

        const { data: likes } = await supabase
            .from('postLikes')
            .select('postId')
            .eq('userId', viewerId)
            .in('postId', postIds)

        const { data: reposts } = await supabase
            .from('postReposts')
            .select('postId')
            .eq('userId', viewerId)
            .in('postId', postIds)

        const likedPostIds = new Set(likes?.map(l => l.postId) || [])
        const repostedPostIds = new Set(reposts?.map(r => r.postId) || [])

        return posts.map(post => ({
            ...post,
            isLiked: likedPostIds.has(post.id),
            isReposted: repostedPostIds.has(post.id)
        }))
    }

    return posts
}

// Like operations
export async function likePost(postId: number, userId: string) {
    const { error } = await supabase
        .from('postLikes')
        .insert({ postId, userId })

    if (error) {
        throw new Error(error.message)
    }
}

export async function unlikePost(postId: number, userId: string) {
    const { error } = await supabase
        .from('postLikes')
        .delete()
        .eq('postId', postId)
        .eq('userId', userId)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getPostLikes(postId: number, start = 0, end = 20) {
    const { data, error } = await supabase
        .from('postLikes')
        .select('*, players!postLikes_userId_fkey(uid, name, profilepic)')
        .eq('postId', postId)
        .order('created_at', { ascending: false })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

// Comment operations
export async function createComment(data: PostCommentInsert) {
    const { data: comment, error } = await supabase
        .from('postComments')
        .insert(data)
        .select(COMMENT_SELECT)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return comment
}

export async function getPostComments(postId: number, start = 0, end = 20) {
    const { data, error } = await supabase
        .from('postComments')
        .select(COMMENT_SELECT)
        .eq('postId', postId)
        .eq('isDeleted', false)
        .order('created_at', { ascending: false })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function updateComment(commentId: number, content: string, authorId: string) {
    const { data: comment, error } = await supabase
        .from('postComments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('authorId', authorId)
        .select(COMMENT_SELECT)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return comment
}

export async function deleteComment(commentId: number, userId: string, isAdmin: boolean = false) {
    let query = supabase
        .from('postComments')
        .update({ isDeleted: true })
        .eq('id', commentId)

    if (!isAdmin) {
        query = query.eq('authorId', userId)
    }

    const { error } = await query

    if (error) {
        throw new Error(error.message)
    }
}

// Repost operations
export async function repostPost(postId: number, userId: string) {
    const { error } = await supabase
        .from('postReposts')
        .insert({ postId, userId })

    if (error) {
        throw new Error(error.message)
    }
}

export async function unrepostPost(postId: number, userId: string) {
    const { error } = await supabase
        .from('postReposts')
        .delete()
        .eq('postId', postId)
        .eq('userId', userId)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getUserReposts({ userId, start = 0, end = 20, viewerId }: { userId: string, start?: number, end?: number, viewerId?: string }) {
    const { data: reposts, error } = await supabase
        .from('postReposts')
        .select(`
            *,
            posts!postReposts_postId_fkey(
                *,
                players!posts_authorId_fkey(uid, name, profilepic),
                postLikes(count),
                postComments(count),
                postReposts(count)
            )
        `)
        .eq('userId', userId)
        .order('created_at', { ascending: false })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    // Filter out deleted posts
    const validReposts = reposts?.filter(r => r.posts && !r.posts.isDeleted) || []

    // If viewer is logged in, check their interactions
    if (viewerId && validReposts.length > 0) {
        const postIds = validReposts.map(r => r.posts!.id)

        const { data: likes } = await supabase
            .from('postLikes')
            .select('postId')
            .eq('userId', viewerId)
            .in('postId', postIds)

        const { data: userReposts } = await supabase
            .from('postReposts')
            .select('postId')
            .eq('userId', viewerId)
            .in('postId', postIds)

        const likedPostIds = new Set(likes?.map(l => l.postId) || [])
        const repostedPostIds = new Set(userReposts?.map(r => r.postId) || [])

        return validReposts.map(repost => ({
            ...repost,
            posts: {
                ...repost.posts,
                isLiked: likedPostIds.has(repost.posts!.id),
                isReposted: repostedPostIds.has(repost.posts!.id)
            }
        }))
    }

    return validReposts
}

// Follow operations
export async function followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
        throw new Error('Cannot follow yourself')
    }

    const { error } = await supabase
        .from('userFollows')
        .insert({ followerId, followingId })

    if (error) {
        throw new Error(error.message)
    }
}

export async function unfollowUser(followerId: string, followingId: string) {
    const { error } = await supabase
        .from('userFollows')
        .delete()
        .eq('followerId', followerId)
        .eq('followingId', followingId)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getFollowers(userId: string, start = 0, end = 20) {
    const { data, error } = await supabase
        .from('userFollows')
        .select('*, players!userFollows_followerId_fkey(uid, name, profilepic)')
        .eq('followingId', userId)
        .order('created_at', { ascending: false })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getFollowing(userId: string, start = 0, end = 20) {
    const { data, error } = await supabase
        .from('userFollows')
        .select('*, players!userFollows_followingId_fkey(uid, name, profilepic)')
        .eq('followerId', userId)
        .order('created_at', { ascending: false })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function isFollowing(followerId: string, followingId: string) {
    const { data } = await supabase
        .from('userFollows')
        .select('followerId')
        .eq('followerId', followerId)
        .eq('followingId', followingId)
        .maybeSingle()

    return !!data
}

export async function getUserFollowStats(userId: string) {
    const { count: followersCount, error: followersError } = await supabase
        .from('userFollows')
        .select('*', { count: 'exact', head: true })
        .eq('followingId', userId)

    const { count: followingCount, error: followingError } = await supabase
        .from('userFollows')
        .select('*', { count: 'exact', head: true })
        .eq('followerId', userId)

    if (followersError || followingError) {
        throw new Error('Failed to get follow stats')
    }

    return {
        followers: followersCount || 0,
        following: followingCount || 0
    }
}

export async function getFollowingFeed({ userId, start = 0, end = 20 }: { userId: string, start?: number, end?: number }) {
    // Get list of users the current user is following
    const { data: followingList, error: followingError } = await supabase
        .from('userFollows')
        .select('followingId')
        .eq('followerId', userId)

    if (followingError) {
        throw new Error(followingError.message)
    }

    if (!followingList || followingList.length === 0) {
        return []
    }

    const followingIds = followingList.map(f => f.followingId)

    // Get posts from followed users
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
            *,
            players!posts_authorId_fkey(uid, name, profilepic),
            postLikes(count),
            postComments(count),
            postReposts(count)
        `)
        .in('authorId', followingIds)
        .eq('isDeleted', false)
        .order('created_at', { ascending: false })
        .range(start, end)

    if (postsError) {
        throw new Error(postsError.message)
    }

    // Check user's interactions with these posts
    if (posts && posts.length > 0) {
        const postIds = posts.map(p => p.id)

        const { data: likes } = await supabase
            .from('postLikes')
            .select('postId')
            .eq('userId', userId)
            .in('postId', postIds)

        const { data: reposts } = await supabase
            .from('postReposts')
            .select('postId')
            .eq('userId', userId)
            .in('postId', postIds)

        const likedPostIds = new Set(likes?.map(l => l.postId) || [])
        const repostedPostIds = new Set(reposts?.map(r => r.postId) || [])

        return posts.map(post => ({
            ...post,
            isLiked: likedPostIds.has(post.id),
            isReposted: repostedPostIds.has(post.id)
        }))
    }

    return posts || []
}
