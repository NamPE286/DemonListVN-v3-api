import {
    ensureStoredRatingPositions,
    ensureStoredTopPositions
} from './list-record-helpers.service'
import type {
    CustomList,
    CustomListAccessContext,
    CustomListActor,
    CustomListIdentifier,
    CustomListInvitation,
    CustomListItemFilters,
    CustomListLevelRow,
    CustomListMember,
    CustomListMemberRole,
    CustomListPermissions,
    CustomListResolvedRole,
    CustomListWithOwnerData
} from './list.common'
import {
    CUSTOM_LIST_ITEMS_SELECT_PAGE_SIZE,
    ForbiddenError,
    NotFoundError,
    ValidationError,
    buildFullTextSearchParams,
    fetchLevelFromGD,
    getCustomListBySlug,
    getCustomListInvitation,
    getCustomListMembership,
    getCustomListRow,
    getLevel,
    playerSelect,
    requireLevelId,
    requireListId,
    retrieveOrCreateLevel,
    sanitizeSlug,
    supabase
} from './list.common'

export async function resolveCustomListIdentifier(identifier: CustomListIdentifier) {
    if (typeof identifier === 'number') {
        return getCustomListRow(identifier)
    }

    const trimmed = identifier.trim()

    if (!trimmed.length) {
        throw new ValidationError('Invalid list identifier')
    }

    const numericId = Number.parseInt(trimmed, 10)

    if (String(numericId) === trimmed && Number.isInteger(numericId) && numericId > 0) {
        return getCustomListRow(numericId)
    }

    return getCustomListBySlug(sanitizeSlug(trimmed) as string)
}

export function getActorUid(actor: CustomListActor) {
    return typeof actor === 'string' ? actor : actor?.uid
}

export function canModerateList(actor: CustomListActor) {
    return Boolean(actor && typeof actor !== 'string' && (actor.isAdmin || actor.isManager))
}

export async function getCustomListAccess(list: Pick<CustomList, 'id' | 'owner' | 'adminsCanManageHelpers' | 'isBanned'>, actor: CustomListActor) {
    const actorUid = getActorUid(actor) ?? null
    const isModerator = canModerateList(actor)
    const isOwner = Boolean(actorUid && list.owner === actorUid)
    let memberRole: CustomListMemberRole | null = null
    let pendingInvitation: CustomListInvitation | null = null

    if (!isOwner && actorUid) {
        const membership = await getCustomListMembership(list.id, actorUid)

        if (membership?.role === 'admin' || membership?.role === 'helper') {
            memberRole = membership.role
        } else {
            pendingInvitation = await getCustomListInvitation(list.id, actorUid)
        }
    }

    return {
        actorUid,
        isModerator,
        isOwner,
        memberRole,
        pendingInvitation
    } satisfies CustomListAccessContext
}

export function resolveCustomListRole(access: CustomListAccessContext): CustomListResolvedRole {
    if (access.isOwner) {
        return 'owner'
    }

    if (access.isModerator) {
        return 'moderator'
    }

    return access.memberRole || 'viewer'
}

export function canReadPrivateList(access: CustomListAccessContext) {
    return access.isOwner || access.isModerator || access.memberRole !== null || access.pendingInvitation !== null
}

export function canEditCustomListSettings(list: Pick<CustomList, 'isBanned'>, access: CustomListAccessContext) {
    if (access.isModerator) {
        return true
    }

    if (list.isBanned) {
        return false
    }

    return access.isOwner || access.memberRole === 'admin'
}

export function canEditCustomListLevels(list: Pick<CustomList, 'isBanned'>, access: CustomListAccessContext) {
    if (access.isModerator) {
        return true
    }

    if (list.isBanned) {
        return false
    }

    return access.isOwner || access.memberRole === 'admin' || access.memberRole === 'helper'
}

export function canReviewCustomListSubmissions(list: Pick<CustomList, 'isOfficial'>, access: CustomListAccessContext) {
    if (list.isOfficial) {
        return access.isModerator
    }

    return access.isModerator || access.isOwner || access.memberRole === 'admin'
}

export function canConfigureCustomListCollaboration(list: Pick<CustomList, 'isBanned'>, access: CustomListAccessContext) {
    return access.isOwner && !list.isBanned
}

export function canManageCustomListMembers(list: Pick<CustomList, 'isBanned' | 'adminsCanManageHelpers'>, access: CustomListAccessContext) {
    if (list.isBanned) {
        return false
    }

    if (access.isOwner) {
        return true
    }

    return access.memberRole === 'admin' && Boolean(list.adminsCanManageHelpers)
}

export function canTransferCustomListOwnership(list: Pick<CustomList, 'isBanned'>, access: CustomListAccessContext) {
    return access.isOwner && !list.isBanned
}

export function canViewCustomListMembers(access: CustomListAccessContext) {
    return access.isOwner || access.isModerator || access.memberRole === 'admin'
}

export function canViewCustomListAudit(access: CustomListAccessContext) {
    return access.isOwner || access.isModerator || access.memberRole !== null
}

export function canViewCustomListPendingInvitations(access: CustomListAccessContext) {
    return access.isOwner || access.isModerator || access.memberRole === 'admin'
}

export function canRespondToCustomListInvitation(access: CustomListAccessContext) {
    return access.pendingInvitation !== null
}

export function getCustomListPermissions(list: Pick<CustomList, 'isBanned' | 'isOfficial' | 'adminsCanManageHelpers'>, access: CustomListAccessContext): CustomListPermissions {
    return {
        canEditSettings: canEditCustomListSettings(list, access),
        canEditLevels: canEditCustomListLevels(list, access),
        canReviewSubmissions: canReviewCustomListSubmissions(list, access),
        canDelete: access.isOwner && !list.isBanned && !list.isOfficial,
        canBan: access.isModerator && !list.isOfficial,
        canManageMembers: canManageCustomListMembers(list, access),
        canConfigureCollaboration: canConfigureCustomListCollaboration(list, access),
        canTransferOwnership: canTransferCustomListOwnership(list, access),
        canViewMembers: canViewCustomListMembers(access),
        canViewAudit: canViewCustomListAudit(access),
        canViewPendingInvitations: canViewCustomListPendingInvitations(access),
        canRespondToInvitation: canRespondToCustomListInvitation(access)
    }
}

export function getCustomListBannedEditMessage(access: CustomListAccessContext) {
    return access.isOwner
        ? 'This list has been banned and cannot be edited by the owner'
        : 'This list has been banned and cannot be edited'
}

export function isListOwner(list: Pick<CustomList, 'owner'>, actor: CustomListActor) {
    const actorUid = getActorUid(actor)

    return Boolean(actorUid && list.owner === actorUid)
}

export function getRequiredActorUid(actor: CustomListActor) {
    const actorUid = getActorUid(actor)

    if (!actorUid) {
        throw new ForbiddenError('Authentication required')
    }

    return actorUid
}

export async function assertOwnerEditable(list: CustomList, actor: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (!access.isOwner) {
        throw new ForbiddenError('You do not own this list')
    }

    if (list.isBanned) {
        throw new ForbiddenError('This list has been banned and cannot be edited by the owner')
    }

    return access
}

export async function assertCanEditList(list: CustomList, actor: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (canEditCustomListSettings(list, access)) {
        return access
    }

    if (list.isBanned && (access.isOwner || access.memberRole)) {
        throw new ForbiddenError(getCustomListBannedEditMessage(access))
    }

    throw new ForbiddenError('You do not have permission to edit this list')
}

export async function assertCanEditListLevels(list: CustomList, actor: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (canEditCustomListLevels(list, access)) {
        return access
    }

    if (list.isBanned && (access.isOwner || access.memberRole)) {
        throw new ForbiddenError(getCustomListBannedEditMessage(access))
    }

    throw new ForbiddenError('You do not have permission to modify levels on this list')
}

export async function assertReadable(list: CustomList, actor?: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (list.visibility === 'private' && !canReadPrivateList(access)) {
        throw new ForbiddenError('This list is private')
    }

    return access
}

export async function assertCanManageListMembers(list: CustomList, actor: CustomListActor, options: {
    targetRole?: CustomListMemberRole
    targetMember?: CustomListMember | null
} = {}) {
    const access = await getCustomListAccess(list, actor)

    if (canConfigureCustomListCollaboration(list, access)) {
        return access
    }

    if (list.isBanned && (access.isOwner || access.memberRole)) {
        throw new ForbiddenError('This list has been banned and collaborators cannot be changed')
    }

    if (!canManageCustomListMembers(list, access)) {
        throw new ForbiddenError('You do not have permission to manage collaborators for this list')
    }

    if (access.memberRole === 'admin' && !access.isOwner) {
        if (options.targetRole && options.targetRole !== 'helper') {
            throw new ForbiddenError('Only the owner can assign admin access')
        }

        if (options.targetMember && options.targetMember.role !== 'helper') {
            throw new ForbiddenError('Only the owner can manage admin collaborators')
        }
    }

    return access
}

export async function assertCanTransferListOwnership(list: CustomList, actor: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (canTransferCustomListOwnership(list, access)) {
        return access
    }

    if (list.isBanned && access.isOwner) {
        throw new ForbiddenError('This list has been banned and ownership cannot be transferred')
    }

    throw new ForbiddenError('Only the owner can transfer ownership')
}

export function assertLevelTypeMatchesList(list: CustomList, level: { isPlatformer?: boolean | null }) {
    const levelIsPlatformer = Boolean(level.isPlatformer)

    if (levelIsPlatformer !== list.isPlatformer) {
        throw new ValidationError(
            list.isPlatformer
                ? 'This list only accepts platformer levels'
                : 'This list only accepts classic levels'
        )
    }
}

export async function assertExistingLevelsMatchType(listId: number, isPlatformer: boolean) {
    const { data: listLevels, error: listLevelsError } = await supabase
        .from('listLevels')
        .select('levelId')
        .eq('listId', listId)

    if (listLevelsError) {
        throw new Error(listLevelsError.message)
    }

    const levelIds = [...new Set((listLevels || []).map((entry) => entry.levelId))]

    if (!levelIds.length) {
        return
    }

    const { data: levels, error: levelsError } = await supabase
        .from('levels')
        .select('id, isPlatformer')
        .in('id', levelIds)

    if (levelsError) {
        throw new Error(levelsError.message)
    }

    const hasMismatch = (levels || []).some((level) => Boolean(level.isPlatformer) !== isPlatformer)

    if (hasMismatch) {
        throw new ValidationError(
            isPlatformer
                ? 'This list already contains classic levels'
                : 'This list already contains platformer levels'
        )
    }
}

export async function syncLevelCount(listId: number) {
    const { count, error: countError } = await supabase
        .from('listLevels')
        .select('id', { count: 'exact', head: true })
        .eq('listId', listId)
        .eq('accepted', true)

    if (countError) {
        throw new Error(countError.message)
    }

    const { error: updateError } = await supabase
        .from('lists')
        .update({
            levelCount: count ?? 0,
            updated_at: new Date().toISOString()
        })
        .eq('id', listId)

    if (updateError) {
        throw new Error(updateError.message)
    }

    return count ?? 0
}

export async function touchCustomListActivity(listId: number) {
    const { error } = await supabase
        .from('lists')
        .update({
            updated_at: new Date().toISOString()
        })
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getStarSummary(listIds: number[], viewerId?: string) {
    const counts = new Map<number, number>()
    const starredIds = new Set<number>()

    if (!listIds.length) {
        return { counts, starredIds }
    }

    const { data, error } = await supabase
        .from('listStars')
        .select('listId, uid')
        .in('listId', listIds)

    if (error) {
        throw new Error(error.message)
    }

    for (const star of data || []) {
        counts.set(star.listId, (counts.get(star.listId) || 0) + 1)

        if (viewerId && star.uid === viewerId) {
            starredIds.add(star.listId)
        }
    }

    return { counts, starredIds }
}

export async function enrichListsWithStars<T extends { id: number }>(lists: T[], viewerId?: string) {
    const { counts, starredIds } = await getStarSummary(lists.map((list) => list.id), viewerId)

    return lists.map((list) => ({
        ...list,
        starCount: counts.get(list.id) || 0,
        starred: starredIds.has(list.id)
    }))
}

export async function getListWithOwnerData(listId: number) {
    requireListId(listId)

    // @ts-ignore
    const { data, error } = await supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
        .eq('id', listId)
        .single()

    if (error || !data) {
        throw new NotFoundError('List not found')
    }

    return data as CustomListWithOwnerData
}

export async function ensureLevelExists(levelId: number) {
    const { level } = await ensureLevelExistsWithSource(levelId)
    return level
}

export async function ensureLevelExistsWithSource(levelId: number) {
    requireLevelId(levelId)

    const existingLevel = await supabase
        .from('levels')
        .select('id')
        .eq('id', levelId)
        .maybeSingle()

    if (existingLevel.error) {
        throw new Error(existingLevel.error.message)
    }

    if (existingLevel.data) {
        return {
            level: await getLevel(levelId),
            fetchedFromGd: false
        }
    }

    let gdLevel: Awaited<ReturnType<typeof fetchLevelFromGD>>

    try {
        console.log('[MirrorCrawl:gd] fetch-missing-level:start', { levelId })
        gdLevel = await fetchLevelFromGD(levelId)
        console.log('[MirrorCrawl:gd] fetch-missing-level:success', {
            levelId,
            name: gdLevel.name,
            author: gdLevel.author
        })
    } catch {
        console.log('[MirrorCrawl:gd] fetch-missing-level:not-found', { levelId })
        throw new NotFoundError('Level not found on the official Geometry Dash server')
    }

    return {
        level: await retrieveOrCreateLevel({
            id: levelId,
            name: gdLevel.name,
            creator: gdLevel.author,
            difficulty: gdLevel.difficulty ?? null,
            isPlatformer: gdLevel.length == 5,
            isChallenge: false,
            isNonList: false,
        } as any),
        fetchedFromGd: true
    }
}

export async function getCustomListItems(listId: number, mode: string = 'rating', itemRange?: {
    start?: number
    end?: number
}, itemSort: string = 'mode_default', itemFilters?: CustomListItemFilters) {
    const isTop = mode === 'top'

    if (isTop) {
        await ensureStoredTopPositions(listId)
    } else {
        await ensureStoredRatingPositions(listId)
    }

    const filters = itemFilters ?? {}
    const nameSearchParams = buildFullTextSearchParams(filters.nameSearch, filters.searchType)
    const creatorSearchParams = buildFullTextSearchParams(filters.creatorSearch, filters.searchType)

    let levelIdFilter: number[] | null = null

    if (filters.tagIds && filters.tagIds.length > 0) {
        const { data: tagRows, error: tagError } = await (supabase as any)
            .from('levelsTags')
            .select('level_id')
            .in('tag_id', filters.tagIds)

        if (tagError) {
            throw new Error(tagError.message)
        }

        const tagFilteredIds = [...new Set((tagRows || []).map((row: any) => row.level_id as number))] as number[]

        if (tagFilteredIds.length === 0) {
            return []
        }

        levelIdFilter = tagFilteredIds
    }

    if (nameSearchParams || creatorSearchParams) {
        let levelQuery = supabase
            .from('levels')
            .select('id')

        if (nameSearchParams) {
            levelQuery = levelQuery.textSearch('nameFts', nameSearchParams.query, nameSearchParams.options)
        }

        if (creatorSearchParams) {
            levelQuery = levelQuery.textSearch('creatorFts', creatorSearchParams.query, creatorSearchParams.options)
        }

        if (levelIdFilter !== null) {
            levelQuery = levelQuery.in('id', levelIdFilter)
        }

        const { data: matchedLevels, error: levelMatchError } = await levelQuery

        if (levelMatchError) {
            throw new Error(levelMatchError.message)
        }

        const matchedIds = (matchedLevels || []).map((row) => row.id as number)

        if (matchedIds.length === 0) {
            return []
        }

        levelIdFilter = matchedIds
    }

    const buildItemsQuery = () => {
        let itemsQuery = supabase
            .from('listLevels')
            .select('id, created_at, listId, levelId, addedBy, rating, position, minProgress, videoID, accepted, submissionComment')
            .eq('listId', listId)
            .eq('accepted', true)

        if (levelIdFilter !== null) {
            itemsQuery = itemsQuery.in('levelId', levelIdFilter)
        }

        if (filters.topMin != null) {
            itemsQuery = itemsQuery.gte('position', filters.topMin)
        }

        if (filters.topMax != null) {
            itemsQuery = itemsQuery.lte('position', filters.topMax)
        }

        if (filters.ratingMin != null) {
            itemsQuery = itemsQuery.gte('rating', filters.ratingMin)
        }

        if (filters.ratingMax != null) {
            itemsQuery = itemsQuery.lte('rating', filters.ratingMax)
        }

        const overrideAscending = filters.ascending

        if (itemSort === 'created_at') {
            const ascending = overrideAscending ?? true
            itemsQuery = itemsQuery
                .order('created_at', { ascending })
                .order('id', { ascending })
        } else {
            const defaultAscending = isTop
            const ascending = overrideAscending ?? defaultAscending
            itemsQuery = itemsQuery
                .order(isTop ? 'position' : 'rating', { ascending, nullsFirst: false })
                .order('created_at', { ascending: true })
                .order('id', { ascending: true })
        }

        return itemsQuery
    }

    let items: CustomListLevelRow[] = []

    if (itemRange?.start !== undefined && itemRange?.end !== undefined) {
        const { data, error } = await buildItemsQuery().range(itemRange.start, itemRange.end)

        if (error) {
            throw new Error(error.message)
        }

        items = (data || []) as CustomListLevelRow[]
    } else {
        // Supabase caps uncapped select queries at 1000 rows, so page until the ordered result set is exhausted.
        for (let start = 0; ; start += CUSTOM_LIST_ITEMS_SELECT_PAGE_SIZE) {
            const end = start + CUSTOM_LIST_ITEMS_SELECT_PAGE_SIZE - 1
            const { data, error } = await buildItemsQuery().range(start, end)

            if (error) {
                throw new Error(error.message)
            }

            const pageItems = (data || []) as CustomListLevelRow[]
            items.push(...pageItems)

            if (pageItems.length < CUSTOM_LIST_ITEMS_SELECT_PAGE_SIZE) {
                break
            }
        }
    }

    const levelIds = [...new Set(items.map((item) => item.levelId))]

    if (!levelIds.length) {
        return []
    }

    // @ts-ignore
    const { data: levels, error: levelsError } = await supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levelsTags(tag_id, levelTags(id, name, color))')
        .in('id', levelIds)

    if (levelsError) {
        throw new Error(levelsError.message)
    }

    const levelsById = new Map((levels || []).map((level) => [level.id, level]))

    const missingLevelIds = levelIds.filter((levelId) => !levelsById.has(levelId))
    const recoveredLevelIds: number[] = []

    for (const levelId of missingLevelIds) {
        try {
            await ensureLevelExists(levelId)
            recoveredLevelIds.push(levelId)
        } catch (error) {
            console.warn('[CustomList] failed to hydrate missing level metadata', {
                listId,
                levelId,
                error: error instanceof Error ? error.message : String(error)
            })
        }
    }

    if (recoveredLevelIds.length) {
        // @ts-ignore
        const { data: recoveredLevels, error: recoveredLevelsError } = await supabase
            .from('levels')
            .select('*, creatorData:players!creatorId(*, clans!id(*)), levelsTags(tag_id, levelTags(id, name, color))')
            .in('id', recoveredLevelIds)

        if (recoveredLevelsError) {
            throw new Error(recoveredLevelsError.message)
        }

        for (const level of recoveredLevels || []) {
            levelsById.set(level.id, level)
        }
    }

    return items.map((item) => {
        const level = levelsById.get(item.levelId) ?? null

        return {
            ...item,
            level: level
                ? {
                    ...level,
                    videoID: item.videoID ?? level.videoID ?? null
                }
                : null
        }
    })
}

export function sanitizeSubmissionComment(value: unknown) {
    if (value == null) {
        return null
    }

    if (typeof value !== 'string') {
        throw new ValidationError('comment must be a string')
    }

    const trimmed = value.trim()

    if (!trimmed.length) {
        return null
    }

    if (trimmed.length > 1000) {
        throw new ValidationError('comment must be at most 1000 characters')
    }

    return trimmed
}

export function sanitizeSubmissionPosition(value: unknown) {
    if (value == null || value === '') {
        return null
    }

    const position = Number(value)

    if (!Number.isInteger(position) || position < 1) {
        throw new ValidationError('position must be a positive integer')
    }

    return position
}

