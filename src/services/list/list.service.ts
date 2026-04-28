import {
    assertCanEditList,
    assertCanManageListMembers,
    assertCanTransferListOwnership,
    assertExistingLevelsMatchType,
    assertOwnerEditable,
    assertReadable,
    canModerateList,
    enrichListsWithStars,
    getActorUid,
    getCustomListItems,
    getCustomListPermissions,
    getListWithOwnerData,
    getRequiredActorUid,
    resolveCustomListIdentifier,
    resolveCustomListRole,
    touchCustomListActivity
} from './list-access.service'
import {
    deleteCustomListLeaderboardArtifacts,
    getOfficialList,
    getOfficialListSummary
} from './list-leaderboard-core.service'
import {
    enrichItemsWithViewerEligibleRecords
} from './list-record-helpers.service'
import {
    CUSTOM_LIST_ITEM_SORT_VALUES,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    OFFICIAL_LIST_SLUGS,
    ValidationError,
    appendCustomListAuditLog,
    areCustomListValuesEqual,
    buildCustomListInvitationRedirect,
    buildCustomListInvitationRejectRedirect,
    buildFullTextSearchParams,
    deleteCustomListInvitation,
    ensurePlayerExists,
    ensureUniqueListSlug,
    getCustomListAuditLog,
    getCustomListInvitation,
    getCustomListInvitations,
    getCustomListMembers,
    getCustomListMembership,
    getCustomListRow,
    getLatestCustomListLeaderboardRefresh,
    getManualAcceptanceOnlyForStatus,
    getOfficialListConfig,
    hydrateCustomListInvitation,
    isOfficialListSlug,
    normalizeCustomListAuditValue,
    normalizeFullTextSearchQuery,
    normalizeRankBadges,
    playerSelect,
    sanitizeActorUid,
    sanitizeAdminsCanManageHelpers,
    sanitizeCommunityEnabled,
    sanitizeCustomListItemSort,
    sanitizeCustomListManualAcceptanceOnly,
    sanitizeCustomListMemberRole,
    sanitizeCustomListRecordAcceptanceStatus,
    sanitizeCustomListRecordPlatform,
    sanitizeCustomListRecordRefreshRate,
    sanitizeDescription,
    sanitizeLeaderboardEnabled,
    sanitizeLevelSubmissionEnabled,
    sanitizeListBanState,
    sanitizeListPlatformer,
    sanitizeMode,
    sanitizeOfficial,
    sanitizeRankBadges,
    sanitizeRecordScoreFormula,
    sanitizeSlug,
    sanitizeStaffListEnabled,
    sanitizeTags,
    sanitizeThemeColor,
    sanitizeThemeUrl,
    sanitizeTitle,
    sanitizeTopEnabled,
    sanitizeVisibility,
    sanitizeWeightFormula,
    sendNotification,
    supabase
} from './list.common'
import type {
    CustomList,
    CustomListAccessContext,
    CustomListActor,
    CustomListAuditLogWithPlayerData,
    CustomListIdentifier,
    CustomListInsert,
    CustomListInvitationInsert,
    CustomListInvitationWithPlayerData,
    CustomListItemFilters,
    CustomListMember,
    CustomListMemberInsert,
    CustomListMemberRole,
    CustomListMemberUpdate,
    CustomListMemberWithPlayerData,
    CustomListSettingsPayload,
    CustomListUpdate,
    CustomListWithOwnerData,
    OfficialListSlug
} from './list.common'

import {
    CONFIGURED_MIRROR_LIST_IDS,
    getMirrorSourceByListId,
    normalizeCustomListMirrorState,
    normalizeCustomListMirrorStates
} from './list-crawler.service'

export async function getOwnCustomLists(ownerId: string) {
    const [{ data: ownedLists, error: ownedError }, { data: memberships, error: membershipsError }] = await Promise.all([
        // @ts-ignore
        supabase
            .from('lists')
            .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
            .eq('owner', ownerId)
            .order('updated_at', { ascending: false }),
        supabase
            .from('listMembers')
            .select('listId, role')
            .eq('uid', ownerId)
    ])

    if (ownedError) {
        throw new Error(ownedError.message)
    }

    if (membershipsError) {
        throw new Error(membershipsError.message)
    }

    const owned = (ownedLists || []) as CustomListWithOwnerData[]
    const membershipEntries = (memberships || []) as Array<Pick<CustomListMember, 'listId' | 'role'>>
    const ownedIds = new Set(owned.map((list) => list.id))
    const collaboratorListIds = membershipEntries
        .map((entry) => entry.listId)
        .filter((listId) => !ownedIds.has(listId))
    let collaboratorLists: CustomListWithOwnerData[] = []

    if (collaboratorListIds.length) {
        const { data, error } = await supabase
            .from('lists')
            .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
            .in('id', collaboratorListIds)

        if (error) {
            throw new Error(error.message)
        }

        collaboratorLists = (data || []) as CustomListWithOwnerData[]
    }

    const allListsById = new Map<number, CustomListWithOwnerData>()

    for (const list of [...owned, ...collaboratorLists]) {
        allListsById.set(list.id, list)
    }

    const membershipRolesByListId = new Map<number, CustomListMemberRole>()

    for (const entry of membershipEntries) {
        if (entry.role === 'admin' || entry.role === 'helper') {
            membershipRolesByListId.set(entry.listId, entry.role)
        }
    }

    const enriched = normalizeCustomListMirrorStates(
        await enrichListsWithStars([...allListsById.values()], ownerId)
    )

    return enriched
        .map((list) => {
            const access: CustomListAccessContext = {
                actorUid: ownerId,
                isModerator: false,
                isOwner: list.owner === ownerId,
                memberRole: list.owner === ownerId ? null : membershipRolesByListId.get(list.id) || null,
                pendingInvitation: null
            }

            return {
                ...list,
                rankBadges: normalizeRankBadges((list as any).rankBadges),
                currentUserRole: resolveCustomListRole(access),
                permissions: getCustomListPermissions(list as CustomList, access)
            }
        })
        .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
}

export async function getStarredCustomLists(userId: string) {
    const { data: starredEntries, error: starredError } = await supabase
        .from('listStars')
        .select('listId')
        .eq('uid', userId)

    if (starredError) {
        throw new Error(starredError.message)
    }

    const listIds = [...new Set((starredEntries || []).map((entry) => entry.listId))]

    if (!listIds.length) {
        return []
    }


    const { data, error } = await supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
        .in('id', listIds)
        .order('updated_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    const readableLists = ((data || []) as CustomListWithOwnerData[])
        .filter((list) => list.visibility !== 'private' || list.owner === userId)

    return normalizeCustomListMirrorStates(await enrichListsWithStars(readableLists, userId))
}


export async function browseLists(options: {
    limit?: number
    offset?: number
    search?: string
    searchType?: string
    viewerId?: string
    kind?: 'custom' | 'official' | 'verified' | 'mirror'
}) {
    const {
        limit = 24,
        offset = 0,
        search = '',
        searchType,
        viewerId,
        kind
    } = options

    const searchParams = buildFullTextSearchParams(search, searchType)
    const normalizedSearch = normalizeFullTextSearchQuery(search)
    const normalizedSyntheticSearch = normalizedSearch.toLowerCase()

    let query = supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`, { count: 'exact' })
        .eq('visibility', 'public')

    if (kind === 'custom') {
        query = query.eq('isOfficial', false)
    } else if (kind === 'official') {
        query = query.eq('isOfficial', true)
    } else if (kind === 'verified') {
        query = query.eq('isVerified', true)
    } else if (kind === 'mirror') {
        query = query.or([
            'isMirror.eq.true',
            ...CONFIGURED_MIRROR_LIST_IDS.map((listId) => `id.eq.${listId}`)
        ].join(','))
    }

    if (searchParams) {
        query = query.textSearch('fts', searchParams.query, searchParams.options)
    }

    let orderedQuery = query
        .order('isOfficial', { ascending: false })
        .order('updated_at', { ascending: false })

    if (kind !== 'mirror') {
        orderedQuery = orderedQuery.range(0, offset + limit - 1)
    }

    const { data, error, count } = await orderedQuery

    if (error) {
        throw new Error(error.message)
    }

    let databaseLists = normalizeCustomListMirrorStates(
        await enrichListsWithStars((data || []) as CustomListWithOwnerData[], viewerId)
    )

    if (kind === 'mirror') {
        databaseLists = databaseLists.sort((left, right) => {
            const leftSource = getMirrorSourceByListId(left.id)
            const rightSource = getMirrorSourceByListId(right.id)
            const leftSourceRank = leftSource
                ? CONFIGURED_MIRROR_LIST_IDS.indexOf(leftSource.mirrorListId)
                : Number.MAX_SAFE_INTEGER
            const rightSourceRank = rightSource
                ? CONFIGURED_MIRROR_LIST_IDS.indexOf(rightSource.mirrorListId)
                : Number.MAX_SAFE_INTEGER

            if (leftSourceRank !== rightSourceRank) {
                return leftSourceRank - rightSourceRank
            }

            return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
        })
    }
    const databaseOfficialSlugs = new Set(
        databaseLists
            .map((list) => list.slug)
            .filter((slug): slug is OfficialListSlug => Boolean(slug) && isOfficialListSlug(slug!))
    )
    const syntheticOfficialLists = await Promise.all(
        kind === 'custom' || kind === 'verified' || kind === 'mirror'
            ? []
            : OFFICIAL_LIST_SLUGS
                .filter((slug) => !databaseOfficialSlugs.has(slug))
                .filter((slug) => {
                    if (!normalizedSyntheticSearch.length) {
                        return true
                    }

                    const entry = getOfficialListConfig(slug)
                    return entry.title.toLowerCase().includes(normalizedSyntheticSearch)
                        || entry.description.toLowerCase().includes(normalizedSyntheticSearch)
                })
                .map((slug) => getOfficialListSummary(slug))
    )
    const combinedLists = kind === 'custom' || kind === 'verified' || kind === 'mirror'
        ? databaseLists
        : [...syntheticOfficialLists, ...databaseLists]

    return {
        data: combinedLists.slice(offset, offset + limit),
        total: syntheticOfficialLists.length + (count || 0)
    }
}

export async function getCustomList(listId: CustomListIdentifier, viewerId?: CustomListActor, options: {
    itemsStart?: number
    itemsEnd?: number
    itemSort?: unknown
    itemFilters?: CustomListItemFilters
} = {}) {
    const actorUid = getActorUid(viewerId)
    const itemRange = options.itemsStart !== undefined && options.itemsEnd !== undefined
        ? {
            start: options.itemsStart,
            end: options.itemsEnd
        }
        : undefined

    try {
        const resolved = await resolveCustomListIdentifier(listId)
        const list = normalizeCustomListMirrorState(await getListWithOwnerData(resolved.id))
        const access = await assertReadable(list, viewerId)
        const permissions = getCustomListPermissions(list, access)
        const effectiveItemSort = options.itemSort !== undefined
            ? sanitizeCustomListItemSort(options.itemSort)
            : (CUSTOM_LIST_ITEM_SORT_VALUES.has(list.itemSort) ? list.itemSort as 'mode_default' | 'created_at' : 'mode_default')
        const [items, [{ starCount = 0, starred = false } = { starCount: 0, starred: false }], latestRefresh, members, auditLog, pendingInvitations, pendingInvitation] = await Promise.all([
            enrichItemsWithViewerEligibleRecords(
                await getCustomListItems(list.id, list.mode, itemRange, effectiveItemSort, options.itemFilters),
                list,
                actorUid
            ),
            enrichListsWithStars([list], actorUid),
            getLatestCustomListLeaderboardRefresh(list.id),
            permissions.canViewMembers || list.staffListEnabled
                ? getCustomListMembers(list.id)
                : Promise.resolve([] as CustomListMemberWithPlayerData[]),
            permissions.canViewAudit ? getCustomListAuditLog(list.id) : Promise.resolve([] as CustomListAuditLogWithPlayerData[]),
            permissions.canViewPendingInvitations ? getCustomListInvitations(list.id) : Promise.resolve([] as CustomListInvitationWithPlayerData[]),
            permissions.canRespondToInvitation ? hydrateCustomListInvitation(access.pendingInvitation) : Promise.resolve(null)
        ])

        return {
            ...list,
            itemSort: effectiveItemSort,
            rankBadges: normalizeRankBadges(list.rankBadges),
            starCount,
            starred,
            lastRefreshedAt: latestRefresh?.lastRefreshedAt ?? null,
            leaderboardTotalPlayers: latestRefresh?.totalPlayers ?? 0,
            leaderboardTotalRecords: latestRefresh?.totalRecords ?? 0,
            currentUserRole: resolveCustomListRole(access),
            permissions,
            members,
            pendingInvitations,
            pendingInvitation,
            auditLog,
            items
        }
    } catch (error) {
        if (error instanceof NotFoundError && typeof listId === 'string') {
            const normalizedIdentifier = listId.trim().toLowerCase()

            if (isOfficialListSlug(normalizedIdentifier)) {
                return getOfficialList(normalizedIdentifier, actorUid, itemRange)
            }
        }

        throw error
    }
}

export async function getCustomListSummary(identifier: CustomListIdentifier, viewerId?: CustomListActor) {
    const actorUid = getActorUid(viewerId)

    try {
        const resolved = await resolveCustomListIdentifier(identifier)
        const access = await assertReadable(resolved, viewerId)

        const list = await getListWithOwnerData(resolved.id)
        const [[{ starCount = 0, starred = false } = { starCount: 0, starred: false }], latestRefresh] = await Promise.all([
            enrichListsWithStars([list], actorUid),
            getLatestCustomListLeaderboardRefresh(list.id)
        ])

        return {
            ...list,
            rankBadges: normalizeRankBadges(list.rankBadges),
            starCount,
            starred,
            lastRefreshedAt: latestRefresh?.lastRefreshedAt ?? null,
            leaderboardTotalPlayers: latestRefresh?.totalPlayers ?? 0,
            leaderboardTotalRecords: latestRefresh?.totalRecords ?? 0,
            currentUserRole: resolveCustomListRole(access),
            permissions: getCustomListPermissions(list, access)
        }
    } catch (error) {
        if (error instanceof NotFoundError && typeof identifier === 'string') {
            const normalizedIdentifier = identifier.trim().toLowerCase()

            if (isOfficialListSlug(normalizedIdentifier)) {
                return getOfficialListSummary(normalizedIdentifier)
            }
        }

        throw error
    }
}


export async function createCustomList(ownerId: string, payload: {
    title: unknown
    description?: unknown
    backgroundColor?: unknown
    bannerUrl?: unknown
    borderColor?: unknown
    visibility?: unknown
    tags?: unknown
    mode?: unknown
    isPlatformer?: unknown
    communityEnabled?: unknown
    leaderboardEnabled?: unknown
    faviconUrl?: unknown
    logoUrl?: unknown
    topEnabled?: unknown
    levelSubmissionEnabled?: unknown
    staffListEnabled?: unknown
    slug?: unknown
    isOfficial?: unknown
    weightFormula?: unknown
    recordScoreFormula?: unknown
    rankBadges?: unknown
    itemSort?: unknown
    recordFilterPlatform?: unknown
    recordFilterMinRefreshRate?: unknown
    recordFilterMaxRefreshRate?: unknown
    recordFilterManualAcceptanceOnly?: unknown
    recordFilterAcceptanceStatus?: unknown
}) {
    const recordFilterAcceptanceStatus = payload.recordFilterAcceptanceStatus !== undefined
        ? sanitizeCustomListRecordAcceptanceStatus(payload.recordFilterAcceptanceStatus)
        : sanitizeCustomListManualAcceptanceOnly(payload.recordFilterManualAcceptanceOnly)
            ? 'manual'
            : 'any'
    const listInsert: CustomListInsert = {
        owner: ownerId,
        title: sanitizeTitle(payload.title),
        description: sanitizeDescription(payload.description),
        backgroundColor: sanitizeThemeColor(payload.backgroundColor, 'backgroundColor'),
        bannerUrl: sanitizeThemeUrl(payload.bannerUrl, 'bannerUrl'),
        borderColor: sanitizeThemeColor(payload.borderColor, 'borderColor'),
        visibility: sanitizeVisibility(payload.visibility),
        tags: sanitizeTags(payload.tags),
        mode: sanitizeMode(payload.mode),
        isPlatformer: sanitizeListPlatformer(payload.isPlatformer),
        communityEnabled: sanitizeCommunityEnabled(payload.communityEnabled),
        leaderboardEnabled: sanitizeLeaderboardEnabled(payload.leaderboardEnabled),
        faviconUrl: sanitizeThemeUrl(payload.faviconUrl, 'faviconUrl'),
        logoUrl: sanitizeThemeUrl(payload.logoUrl, 'logoUrl'),
        topEnabled: sanitizeTopEnabled(payload.topEnabled),
        levelSubmissionEnabled: sanitizeLevelSubmissionEnabled(payload.levelSubmissionEnabled),
        staffListEnabled: sanitizeStaffListEnabled(payload.staffListEnabled),
        itemSort: sanitizeCustomListItemSort(payload.itemSort),
        recordFilterPlatform: sanitizeCustomListRecordPlatform(payload.recordFilterPlatform),
        recordFilterMinRefreshRate: sanitizeCustomListRecordRefreshRate(payload.recordFilterMinRefreshRate, 'recordFilterMinRefreshRate'),
        recordFilterMaxRefreshRate: sanitizeCustomListRecordRefreshRate(payload.recordFilterMaxRefreshRate, 'recordFilterMaxRefreshRate'),
        recordFilterAcceptanceStatus,
        recordFilterManualAcceptanceOnly: getManualAcceptanceOnlyForStatus(recordFilterAcceptanceStatus),
        slug: sanitizeSlug(payload.slug),
        isOfficial: false,
        rankBadges: sanitizeRankBadges(payload.rankBadges),
        recordScoreFormula: sanitizeRecordScoreFormula(payload.recordScoreFormula),
        weightFormula: sanitizeWeightFormula(payload.weightFormula),
        updated_at: new Date().toISOString()
    }

    if (
        listInsert.recordFilterMinRefreshRate != null
        && listInsert.recordFilterMaxRefreshRate != null
        && listInsert.recordFilterMinRefreshRate > listInsert.recordFilterMaxRefreshRate
    ) {
        throw new ValidationError('recordFilterMinRefreshRate must be less than or equal to recordFilterMaxRefreshRate')
    }

    if (listInsert.slug) {
        await ensureUniqueListSlug(listInsert.slug)
    }

    const { data, error } = await supabase
        .from('lists')
        .insert(listInsert)
        .select('*')
        .single()

    if (error || !data) {
        throw new Error(error?.message || 'Failed to create list')
    }

    await appendCustomListAuditLog(data.id, {
        actorUid: ownerId,
        action: 'list_created',
        metadata: {
            title: data.title,
            visibility: data.visibility,
            mode: data.mode,
            isPlatformer: data.isPlatformer
        }
    })

    return getCustomList(data.id, ownerId)
}

export async function buildCustomListSettingsUpdatePlan(listId: number, existing: CustomList, payload: CustomListSettingsPayload) {
    const pendingUpdates: Partial<CustomListUpdate> = {}
    const existingValues = existing as Record<string, unknown>

    if (payload.title !== undefined) {
        pendingUpdates.title = sanitizeTitle(payload.title)
    }

    if (payload.description !== undefined) {
        pendingUpdates.description = sanitizeDescription(payload.description)
    }

    if (payload.backgroundColor !== undefined) {
        pendingUpdates.backgroundColor = sanitizeThemeColor(payload.backgroundColor, 'backgroundColor')
    }

    if (payload.bannerUrl !== undefined) {
        pendingUpdates.bannerUrl = sanitizeThemeUrl(payload.bannerUrl, 'bannerUrl')
    }

    if (payload.borderColor !== undefined) {
        pendingUpdates.borderColor = sanitizeThemeColor(payload.borderColor, 'borderColor')
    }

    if (payload.visibility !== undefined) {
        const visibility = sanitizeVisibility(payload.visibility)

        if (existing.isBanned && visibility !== 'private') {
            throw new ValidationError('Banned lists must remain private')
        }

        pendingUpdates.visibility = visibility
    }

    if (payload.tags !== undefined) {
        pendingUpdates.tags = sanitizeTags(payload.tags)
    }

    if (payload.mode !== undefined) {
        pendingUpdates.mode = sanitizeMode(payload.mode)
    }

    if (payload.isPlatformer !== undefined) {
        const isPlatformer = sanitizeListPlatformer(payload.isPlatformer)

        if (isPlatformer !== existing.isPlatformer) {
            await assertExistingLevelsMatchType(listId, isPlatformer)
        }

        pendingUpdates.isPlatformer = isPlatformer
    }

    if (payload.communityEnabled !== undefined) {
        pendingUpdates.communityEnabled = sanitizeCommunityEnabled(payload.communityEnabled)
    }

    if (payload.leaderboardEnabled !== undefined) {
        pendingUpdates.leaderboardEnabled = sanitizeLeaderboardEnabled(payload.leaderboardEnabled)
    }

    if (payload.faviconUrl !== undefined) {
        pendingUpdates.faviconUrl = sanitizeThemeUrl(payload.faviconUrl, 'faviconUrl')
    }

    if (payload.logoUrl !== undefined) {
        pendingUpdates.logoUrl = sanitizeThemeUrl(payload.logoUrl, 'logoUrl')
    }

    if (payload.topEnabled !== undefined) {
        pendingUpdates.topEnabled = sanitizeTopEnabled(payload.topEnabled)
    }

    if (payload.levelSubmissionEnabled !== undefined) {
        pendingUpdates.levelSubmissionEnabled = sanitizeLevelSubmissionEnabled(payload.levelSubmissionEnabled)
    }

    if (payload.staffListEnabled !== undefined) {
        pendingUpdates.staffListEnabled = sanitizeStaffListEnabled(payload.staffListEnabled)
    }

    if (payload.slug !== undefined) {
        const slug = sanitizeSlug(payload.slug)

        if (slug) {
            await ensureUniqueListSlug(slug, listId)
        }

        pendingUpdates.slug = slug
    }

    if (payload.weightFormula !== undefined) {
        pendingUpdates.weightFormula = sanitizeWeightFormula(payload.weightFormula)
    }

    if (payload.recordScoreFormula !== undefined) {
        pendingUpdates.recordScoreFormula = sanitizeRecordScoreFormula(payload.recordScoreFormula)
    }

    if (payload.rankBadges !== undefined) {
        pendingUpdates.rankBadges = sanitizeRankBadges(payload.rankBadges)
    }

    if (payload.itemSort !== undefined) {
        pendingUpdates.itemSort = sanitizeCustomListItemSort(payload.itemSort)
    }

    if (payload.recordFilterPlatform !== undefined) {
        pendingUpdates.recordFilterPlatform = sanitizeCustomListRecordPlatform(payload.recordFilterPlatform)
    }

    if (payload.recordFilterMinRefreshRate !== undefined) {
        pendingUpdates.recordFilterMinRefreshRate = sanitizeCustomListRecordRefreshRate(payload.recordFilterMinRefreshRate, 'recordFilterMinRefreshRate')
    }

    if (payload.recordFilterMaxRefreshRate !== undefined) {
        pendingUpdates.recordFilterMaxRefreshRate = sanitizeCustomListRecordRefreshRate(payload.recordFilterMaxRefreshRate, 'recordFilterMaxRefreshRate')
    }

    const nextMinRefreshRate = pendingUpdates.recordFilterMinRefreshRate ?? existing.recordFilterMinRefreshRate
    const nextMaxRefreshRate = pendingUpdates.recordFilterMaxRefreshRate ?? existing.recordFilterMaxRefreshRate

    if (
        nextMinRefreshRate != null
        && nextMaxRefreshRate != null
        && nextMinRefreshRate > nextMaxRefreshRate
    ) {
        throw new ValidationError('recordFilterMinRefreshRate must be less than or equal to recordFilterMaxRefreshRate')
    }

    if (payload.recordFilterAcceptanceStatus !== undefined) {
        const acceptanceStatus = sanitizeCustomListRecordAcceptanceStatus(payload.recordFilterAcceptanceStatus)

        pendingUpdates.recordFilterAcceptanceStatus = acceptanceStatus
        pendingUpdates.recordFilterManualAcceptanceOnly = getManualAcceptanceOnlyForStatus(acceptanceStatus)
    } else if (payload.recordFilterManualAcceptanceOnly !== undefined) {
        pendingUpdates.recordFilterManualAcceptanceOnly = sanitizeCustomListManualAcceptanceOnly(payload.recordFilterManualAcceptanceOnly)
        pendingUpdates.recordFilterAcceptanceStatus = pendingUpdates.recordFilterManualAcceptanceOnly ? 'manual' : 'any'
    }

    const changedEntries = (Object.entries(pendingUpdates) as Array<[string, unknown]>)
        .filter(([field, nextValue]) => !areCustomListValuesEqual(existingValues[field], nextValue))

    const updates: CustomListUpdate = {
        updated_at: new Date().toISOString()
    }
    const changes: Record<string, { old: unknown; new: unknown }> = {}

    for (const [field, nextValue] of changedEntries) {
        ;(updates as Record<string, unknown>)[field] = nextValue
        changes[field] = {
            old: normalizeCustomListAuditValue(existingValues[field]),
            new: normalizeCustomListAuditValue(nextValue)
        }
    }

    return {
        changedEntries,
        changes,
        updates
    }
}

export async function applyCustomListSettingsUpdate(listId: number, existing: CustomList, access: CustomListAccessContext, payload: CustomListSettingsPayload) {
    const updatePlan = await buildCustomListSettingsUpdatePlan(listId, existing, payload)

    if (!updatePlan.changedEntries.length) {
        return {
            changed: false,
            list: existing
        }
    }

    const { error } = await supabase
        .from('lists')
        .update(updatePlan.updates)
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }

    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'list_updated',
        metadata: {
            fields: updatePlan.changedEntries.map(([field]) => field),
            changes: updatePlan.changes
        }
    })

    if (updatePlan.updates.leaderboardEnabled === false) {
        await deleteCustomListLeaderboardArtifacts(listId)
    }

    return {
        changed: true,
        list: {
            ...existing,
            ...updatePlan.updates
        } as CustomList
    }
}

export async function updateCustomList(listId: number, ownerId: CustomListActor, payload: CustomListSettingsPayload) {
    const existing = await getCustomListRow(listId)
    const access = await assertCanEditList(existing, ownerId)
    const result = await applyCustomListSettingsUpdate(listId, existing, access, payload)

    if (!result.changed) {
        return getCustomList(listId, ownerId)
    }

    return getCustomList(listId, ownerId)
}

export async function setCustomListBanState(listId: number, actor: CustomListActor, value: unknown) {
    const existing = await getCustomListRow(listId)
    const actorUid = getActorUid(actor)

    if (!canModerateList(actor)) {
        throw new ForbiddenError('Only managers can ban custom lists')
    }

    if (existing.isOfficial) {
        throw new ForbiddenError('Official lists cannot be banned')
    }

    const isBanned = sanitizeListBanState(value)
    const updates: CustomListUpdate = {
        isBanned,
        updated_at: new Date().toISOString()
    }

    if (isBanned) {
        updates.visibility = 'private'
    }

    const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }

    await appendCustomListAuditLog(listId, {
        actorUid,
        action: 'ban_state_updated',
        metadata: {
            isBanned
        }
    })

    return getCustomList(listId, actor)
}

export async function updateCustomListCollaborationSettings(listId: number, actor: CustomListActor, payload: {
    adminsCanManageHelpers?: unknown
}) {
    const list = await getCustomListRow(listId)
    const access = await assertOwnerEditable(list, actor)
    const updates: CustomListUpdate = {
        updated_at: new Date().toISOString()
    }

    if (payload.adminsCanManageHelpers !== undefined) {
        updates.adminsCanManageHelpers = sanitizeAdminsCanManageHelpers(payload.adminsCanManageHelpers)
    }

    const changedFields = Object.keys(updates).filter((field) => field !== 'updated_at')

    if (!changedFields.length) {
        return getCustomList(listId, actor)
    }

    const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }

    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'collaboration_settings_updated',
        metadata: {
            adminsCanManageHelpers: updates.adminsCanManageHelpers
        }
    })

    return getCustomList(listId, actor)
}

export async function addCustomListMember(listId: number, actor: CustomListActor, payload: {
    uid?: unknown
    role?: unknown
}) {
    const list = await getCustomListRow(listId)
    const uid = sanitizeActorUid(payload.uid, 'member uid')
    const role = sanitizeCustomListMemberRole(payload.role)
    const access = await assertCanManageListMembers(list, actor, { targetRole: role })
    const actorUid = getRequiredActorUid(actor)

    if (uid === list.owner) {
        throw new ValidationError('The owner cannot be added as a collaborator')
    }

    await ensurePlayerExists(uid)

    const existingMember = await getCustomListMembership(listId, uid)

    if (existingMember) {
        throw new ConflictError('This player is already a collaborator on this list')
    }

    const existingInvitation = await getCustomListInvitation(listId, uid)
    const now = new Date().toISOString()

    const invitationInsert: CustomListInvitationInsert = {
        listId,
        uid,
        role,
        invitedBy: actorUid,
        created_at: existingInvitation?.created_at ?? now,
        updated_at: now
    }

    const { error } = await supabase
        .from('listInvitations')
        .upsert(invitationInsert, { onConflict: 'listId,uid' })

    if (error) {
        throw new Error(error.message)
    }

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: existingInvitation ? 'member_invitation_updated' : 'member_invited',
        targetUid: uid,
        metadata: existingInvitation
            ? {
                fromRole: existingInvitation.role,
                toRole: role
            }
            : {
                role
            }
    })

    const inviter = await ensurePlayerExists(actorUid)
    const invitationMessage = existingInvitation
        ? `Lời mời cộng tác vào danh sách ${list.title} đã được cập nhật bởi ${inviter.name || actorUid}. Nhấn để xem và phản hồi.`
        : `Bạn đã được mời cộng tác vào danh sách ${list.title} bởi ${inviter.name || actorUid}. Nhấn để xem và phản hồi.`

    await sendNotification({
        to: uid,
        content: invitationMessage,
        redirect: buildCustomListInvitationRedirect(list)
    })

    return getCustomList(listId, actor)
}

export async function acceptCustomListInvitation(listId: number, actor: CustomListActor) {
    await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(actor)
    const invitation = await getCustomListInvitation(listId, actorUid)

    if (!invitation) {
        throw new NotFoundError('Pending invitation not found')
    }

    const existingMember = await getCustomListMembership(listId, actorUid)

    if (!existingMember) {
        const memberInsert: CustomListMemberInsert = {
            listId,
            uid: actorUid,
            role: invitation.role,
            addedBy: invitation.invitedBy,
            updated_at: new Date().toISOString()
        }

        const { error } = await supabase
            .from('listMembers')
            .insert(memberInsert)

        if (error) {
            throw new Error(error.message)
        }
    }

    await deleteCustomListInvitation(listId, actorUid)
    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid,
        action: 'member_invitation_accepted',
        targetUid: actorUid,
        metadata: {
            role: invitation.role,
            invitedBy: invitation.invitedBy
        }
    })

    return getCustomList(listId, actor)
}

export async function rejectCustomListInvitation(listId: number, actor: CustomListActor) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(actor)
    const invitation = await getCustomListInvitation(listId, actorUid)

    if (!invitation) {
        throw new NotFoundError('Pending invitation not found')
    }

    await deleteCustomListInvitation(listId, actorUid)
    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid,
        action: 'member_invitation_rejected',
        targetUid: actorUid,
        metadata: {
            role: invitation.role,
            invitedBy: invitation.invitedBy
        }
    })

    return {
        ok: true,
        redirect: buildCustomListInvitationRejectRedirect(list)
    }
}

export async function revokeCustomListInvitation(listId: number, actor: CustomListActor, invitationUid: unknown) {
    const list = await getCustomListRow(listId)
    const uid = sanitizeActorUid(invitationUid, 'member uid')
    const invitation = await getCustomListInvitation(listId, uid)

    if (!invitation) {
        throw new NotFoundError('Pending invitation not found')
    }

    const invitationRole = sanitizeCustomListMemberRole(invitation.role)
    const access = await assertCanManageListMembers(list, actor, {
        targetRole: invitationRole
    })

    await deleteCustomListInvitation(listId, uid)
    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'member_invitation_revoked',
        targetUid: uid,
        metadata: {
            role: invitationRole
        }
    })

    return getCustomList(listId, actor)
}

export async function updateCustomListMemberRole(listId: number, actor: CustomListActor, memberUid: unknown, roleValue: unknown) {
    const list = await getCustomListRow(listId)
    const uid = sanitizeActorUid(memberUid, 'member uid')
    const role = sanitizeCustomListMemberRole(roleValue)

    if (uid === list.owner) {
        throw new ValidationError('The owner role can only be changed through ownership transfer')
    }

    const existingMember = await getCustomListMembership(listId, uid)

    if (!existingMember) {
        throw new NotFoundError('Collaborator not found')
    }

    const access = await assertCanManageListMembers(list, actor, {
        targetRole: role,
        targetMember: existingMember
    })

    if (existingMember.role === role) {
        return getCustomList(listId, actor)
    }

    const updates: CustomListMemberUpdate = {
        role,
        updated_at: new Date().toISOString()
    }

    const { error } = await supabase
        .from('listMembers')
        .update(updates)
        .eq('listId', listId)
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'member_role_updated',
        targetUid: uid,
        metadata: {
            fromRole: existingMember.role,
            toRole: role
        }
    })

    return getCustomList(listId, actor)
}

export async function removeCustomListMember(listId: number, actor: CustomListActor, memberUid: unknown) {
    const list = await getCustomListRow(listId)
    const uid = sanitizeActorUid(memberUid, 'member uid')

    if (uid === list.owner) {
        throw new ValidationError('The owner cannot be removed as a collaborator')
    }

    const existingMember = await getCustomListMembership(listId, uid)

    if (!existingMember) {
        throw new NotFoundError('Collaborator not found')
    }

    const access = await assertCanManageListMembers(list, actor, {
        targetMember: existingMember
    })

    const { error } = await supabase
        .from('listMembers')
        .delete()
        .eq('listId', listId)
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'member_removed',
        targetUid: uid,
        metadata: {
            role: existingMember.role
        }
    })

    return getCustomList(listId, actor)
}

export async function transferCustomListOwnership(listId: number, actor: CustomListActor, targetUidValue: unknown) {
    const list = await getCustomListRow(listId)
    const access = await assertCanTransferListOwnership(list, actor)
    const targetUid = sanitizeActorUid(targetUidValue, 'owner uid')

    if (targetUid === list.owner) {
        throw new ValidationError('This player already owns the list')
    }

    await ensurePlayerExists(targetUid)

    const now = new Date().toISOString()
    const previousOwnerUid = list.owner

    const { error: removeTargetMembershipError } = await supabase
        .from('listMembers')
        .delete()
        .eq('listId', listId)
        .eq('uid', targetUid)

    if (removeTargetMembershipError) {
        throw new Error(removeTargetMembershipError.message)
    }

    const { error: updateOwnerError } = await supabase
        .from('lists')
        .update({
            owner: targetUid,
            updated_at: now
        })
        .eq('id', listId)

    if (updateOwnerError) {
        throw new Error(updateOwnerError.message)
    }

    const previousOwnerMembership: CustomListMemberInsert = {
        listId,
        uid: previousOwnerUid,
        role: 'admin',
        addedBy: previousOwnerUid,
        updated_at: now
    }

    const { error: upsertMembershipError } = await supabase
        .from('listMembers')
        .upsert(previousOwnerMembership, { onConflict: 'listId,uid' })

    if (upsertMembershipError) {
        throw new Error(upsertMembershipError.message)
    }

    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'ownership_transferred',
        targetUid,
        metadata: {
            previousOwnerUid
        }
    })

    return getCustomList(listId, actor)
}

export async function updateCustomListOfficialMetadata(listId: number, payload: {
    isOfficial?: unknown
    slug?: unknown
    weightFormula?: unknown
    recordScoreFormula?: unknown
}) {
    const existing = await getCustomListRow(listId)

    const updates: CustomListUpdate = {
        updated_at: new Date().toISOString()
    }

    if (payload.isOfficial !== undefined) {
        updates.isOfficial = sanitizeOfficial(payload.isOfficial)
    }

    if (payload.slug !== undefined) {
        const slug = sanitizeSlug(payload.slug)

        if (slug) {
            await ensureUniqueListSlug(slug, listId)
        }

        updates.slug = slug
    }

    if (payload.weightFormula !== undefined) {
        updates.weightFormula = sanitizeWeightFormula(payload.weightFormula)
    }

    if (payload.recordScoreFormula !== undefined) {
        updates.recordScoreFormula = sanitizeRecordScoreFormula(payload.recordScoreFormula)
    }

    const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', existing.id)

    if (error) {
        throw new Error(error.message)
    }

    return getCustomList(existing.id)
}

export async function deleteCustomList(listId: number, ownerId: CustomListActor) {
    const existing = await getCustomListRow(listId)
    await assertOwnerEditable(existing, ownerId)

    if (existing.isOfficial) {
        throw new ForbiddenError('Official lists cannot be deleted')
    }

    const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }
}
