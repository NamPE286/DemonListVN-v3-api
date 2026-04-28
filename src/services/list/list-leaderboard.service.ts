import {
    assertCanEditList,
    getCustomListItems,
    resolveCustomListIdentifier,
    syncLevelCount
} from './list-access.service'
import {
    calculateCustomListLeaderboardSnapshot,
    fetchCustomListLeaderboardPlayers,
    persistCustomListLeaderboard,
    persistDisabledCustomListLeaderboard
} from './list-leaderboard-core.service'
import {
    getEffectiveMinProgress,
    getNormalizedListPosition,
    getRecordAcceptancePriority,
    isBetterRecordForListItem,
    isEligibleRecordForListItem
} from './list-record-helpers.service'
import {
    CUSTOM_LIST_ITEM_SORT_VALUES,
    CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE,
    CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE,
    OFFICIAL_LIST_SLUGS,
    getCustomListRow,
    isCustomListRecordEligibleForFilters,
    normalizeRankBadges,
    playerSelect,
    supabase
} from './list.common'
import type {
    CustomListActor,
    CustomListIdentifier,
    CustomListLeaderboardRecordEntry,
    CustomListLeaderboardRecordEntryReference,
    OfficialListSlug,
    PlayerRankedListSummary
} from './list.common'

import {
    getCustomList,
    getCustomListSummary
} from './list.service'

export async function getPlayerRankedLists(uid: string): Promise<PlayerRankedListSummary[]> {
    const { data: entryRows, error: entriesError } = await (supabase as any)
        .from('listLeaderboardEntries')
        .select('listId, rank, score, completedCount')
        .eq('uid', uid)

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    const entries = (entryRows || []) as Array<{
        listId: number
        rank: number
        score: number
        completedCount: number
    }>

    if (!entries.length) {
        return []
    }

    const listIds = [...new Set(entries.map((entry) => entry.listId))]
    const [{ data: lists, error: listsError }, { data: refreshRows, error: refreshError }] = await Promise.all([
        (supabase as any)
            .from('lists')
            .select('id, slug, title, isOfficial, isVerified, mode, isPlatformer, rankBadges, visibility, leaderboardEnabled')
            .in('id', listIds)
            .eq('visibility', 'public')
            .eq('leaderboardEnabled', true)
            .or('isOfficial.eq.true,isVerified.eq.true'),
        (supabase as any)
            .from('listLeaderboardRefreshes')
            .select('listId, lastRefreshedAt')
            .in('listId', listIds)
    ])

    if (listsError) {
        throw new Error(listsError.message)
    }

    if (refreshError) {
        throw new Error(refreshError.message)
    }

    const refreshByListId = new Map<number, string | null>()

    for (const refreshRow of refreshRows || []) {
        refreshByListId.set(refreshRow.listId, refreshRow.lastRefreshedAt ?? null)
    }

    const officialListOrder = new Map(OFFICIAL_LIST_SLUGS.map((slug, index) => [slug, index]))
    const listsById = new Map<number, any>()

    for (const list of lists || []) {
        listsById.set(list.id, list)
    }

    return entries
        .map((entry) => {
            const list = listsById.get(entry.listId)

            if (!list) {
                return null
            }

            return {
                id: list.id,
                slug: list.slug,
                identifier: list.slug || String(list.id),
                title: list.title,
                isOfficial: Boolean(list.isOfficial),
                isVerified: Boolean(list.isVerified),
                mode: list.mode,
                isPlatformer: Boolean(list.isPlatformer),
                rank: entry.rank,
                score: entry.score,
                completedCount: entry.completedCount,
                lastRefreshedAt: refreshByListId.get(list.id) ?? null,
                rankBadges: normalizeRankBadges(list.rankBadges)
            } satisfies PlayerRankedListSummary
        })
        .filter((entry): entry is PlayerRankedListSummary => Boolean(entry))
        .sort((left, right) => {
            if (left.isOfficial !== right.isOfficial) {
                return left.isOfficial ? -1 : 1
            }

            if (left.isOfficial && right.isOfficial) {
                const leftOrder = left.slug ? (officialListOrder.get(left.slug as OfficialListSlug) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
                const rightOrder = right.slug ? (officialListOrder.get(right.slug as OfficialListSlug) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER

                if (leftOrder !== rightOrder) {
                    return leftOrder - rightOrder
                }
            }

            return left.title.localeCompare(right.title, 'en', { sensitivity: 'base' })
        })
}


export async function getCustomListLeaderboard(identifier: CustomListIdentifier, options: {
    start?: number
    end?: number
    viewerId?: CustomListActor
} = {}) {
    const {
        start = 0,
        end = 49,
        viewerId
    } = options

    const list = await getCustomListSummary(identifier, viewerId)

    if (list.id <= 0) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: null
        }
    }

    if ((list as any).leaderboardEnabled === false) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: (list as any).lastRefreshedAt ?? null
        }
    }

    const totalPlayers = Number((list as any).leaderboardTotalPlayers ?? 0)
    const lastRefreshedAt = (list as any).lastRefreshedAt ?? null

    if (!lastRefreshedAt) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: null
        }
    }

    const { data: entryRows, error: entriesError } = await (supabase as any)
        .from('listLeaderboardEntries')
        .select('uid, rank, score, completedCount')
        .eq('listId', list.id)
        .order('rank', { ascending: true })
        .range(start, end)

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    const entries = (entryRows || []) as Array<{
        uid: string
        rank: number
        score: number
        completedCount: number
    }>
    const uids = [...new Set(entries.map((entry) => entry.uid))]
    const playersByUid = new Map<string, any>()

    if (uids.length) {
        const { data: players, error: playersError } = await supabase
            .from('players')
            .select(`${playerSelect}`)
            .in('uid', uids)

        if (playersError) {
            throw new Error(playersError.message)
        }

        for (const player of players || []) {
            playersByUid.set(player.uid, player)
        }
    }

    const persistedLeaderboard = entries
        .map((entry) => {
            const player = playersByUid.get(entry.uid)

            if (!player) {
                return null
            }

            return {
                ...player,
                rank: entry.rank,
                score: entry.score,
                completedCount: entry.completedCount
            }
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

    return {
        list,
        data: persistedLeaderboard,
        total: totalPlayers,
        lastRefreshedAt
    }
}

export async function getCustomListRecordPoints(identifier: CustomListIdentifier, options: {
    start?: number
    end?: number
    viewerId?: CustomListActor
    uid?: string
    ignoreRecordSettings?: boolean
} = {}) {
    const {
        start = 0,
        end = 49,
        viewerId,
        uid,
        ignoreRecordSettings = false
    } = options

    const list = await getCustomListSummary(identifier, viewerId)

    if (ignoreRecordSettings && uid && list.id > 0) {
        return getCustomListAcceptedPlayerRecords(list, { start, end, uid })
    }

    if (list.id <= 0 || (list as any).leaderboardEnabled === false) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: (list as any).lastRefreshedAt ?? null
        }
    }

    const lastRefreshedAt = (list as any).lastRefreshedAt ?? null

    if (!lastRefreshedAt) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: null
        }
    }

    let entriesQuery = (supabase as any)
        .from('listLeaderboardRecordEntries')
        .select('uid, levelId, point, no')
        .eq('listId', list.id)
        .order('no', { ascending: true })

    if (uid) {
        entriesQuery = entriesQuery.eq('uid', uid)
    }

    const [entriesResult, playerEntryResult] = await Promise.all([
        entriesQuery.range(start, end),
        uid
            ? (supabase as any)
                .from('listLeaderboardEntries')
                .select('completedCount')
                .eq('listId', list.id)
                .eq('uid', uid)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null })
    ])

    const { data: entryRows, error: entriesError } = entriesResult

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    if (playerEntryResult.error) {
        throw new Error(playerEntryResult.error.message)
    }

    const entries = (entryRows || []) as CustomListLeaderboardRecordEntry[]
    const uids = [...new Set(entries.map((entry) => entry.uid))]
    const levelIds = [...new Set(entries.map((entry) => entry.levelId))]
    const playersByUid = new Map<string, any>()
    const levelsById = new Map<number, any>()
    const itemByLevelId = new Map<number, { item: any; index: number }>()
    const recordsByKey = new Map<string, {
        id: number | null
        progress: number
        timestamp: number | null
        mobile: boolean
        refreshRate: number | null
        acceptedManually: boolean
        acceptedAuto: boolean
    }>()

    const [playersResult, levelsResult, itemsResult] = await Promise.all([
        uids.length
            ? supabase
                .from('players')
                .select(`${playerSelect}`)
                .in('uid', uids)
            : Promise.resolve({ data: [], error: null }),
        levelIds.length
            ? supabase
                .from('levels')
                .select('id, name, creator, difficulty, isPlatformer, rating, minProgress, videoID')
                .in('id', levelIds)
            : Promise.resolve({ data: [], error: null }),
        levelIds.length
            ? supabase
                .from('listLevels')
                .select('id, levelId, rating, position, minProgress, videoID')
                .eq('listId', list.id)
                .eq('accepted', true)
                .in('levelId', levelIds)
            : Promise.resolve({ data: [], error: null })
    ])

    if (playersResult.error) {
        throw new Error(playersResult.error.message)
    }

    if (levelsResult.error) {
        throw new Error(levelsResult.error.message)
    }

    if (itemsResult.error) {
        throw new Error(itemsResult.error.message)
    }

    for (const player of playersResult.data || []) {
        playersByUid.set(player.uid, player)
    }

    for (const level of levelsResult.data || []) {
        levelsById.set(level.id, level)
    }

    for (const item of itemsResult.data || []) {
        itemByLevelId.set(item.levelId, {
            item: {
                ...item,
                level: levelsById.get(item.levelId) || null
            },
            index: 0
        })
    }

    if (entries.length) {
        const recordFilters = entries
            .map((entry) => `and(userid.eq.${entry.uid},levelid.eq.${entry.levelId},or(acceptedManually.eq.true,acceptedAuto.eq.true))`)
            .join(',')

        const { data: recordRows, error: recordsError } = await supabase
            .from('records')
            .select('id, userid, levelid, progress, timestamp, mobile, refreshRate, acceptedManually, acceptedAuto')
            .or(recordFilters)

        if (recordsError) {
            throw new Error(recordsError.message)
        }

        for (const record of recordRows || []) {
            if (!isCustomListRecordEligibleForFilters(record, list)) {
                continue
            }

            const itemData = itemByLevelId.get(record.levelid)
            const key = `${record.userid}:${record.levelid}`
            const recordSnapshot = {
                id: Number.isFinite(Number(record.id)) ? Number(record.id) : null,
                progress: Number(record.progress) || 0,
                timestamp: Number.isFinite(Number(record.timestamp)) ? Number(record.timestamp) : null,
                mobile: Boolean(record.mobile),
                refreshRate: Number.isFinite(Number(record.refreshRate)) ? Number(record.refreshRate) : null,
                acceptedManually: Boolean(record.acceptedManually),
                acceptedAuto: Boolean(record.acceptedAuto)
            }
            const existingSnapshot = recordsByKey.get(key)

            if (!itemData || isBetterRecordForListItem(recordSnapshot, existingSnapshot, itemData.item, list.isPlatformer)) {
                recordsByKey.set(key, recordSnapshot)
            }
        }
    }

    const totalRecords = uid
        ? Number(playerEntryResult.data?.completedCount ?? 0)
        : Number((list as any).leaderboardTotalRecords ?? 0)

    return {
        list,
        data: entries.map((entry) => {
            const recordSnapshot = recordsByKey.get(`${entry.uid}:${entry.levelId}`) || {
                id: null,
                progress: 0,
                timestamp: null,
                mobile: false,
                refreshRate: null,
                acceptedManually: false,
                acceptedAuto: false
            }
            const itemData = itemByLevelId.get(entry.levelId)

            return {
                ...entry,
                ...recordSnapshot,
                player: playersByUid.get(entry.uid) || null,
                level: levelsById.get(entry.levelId) || null,
                formulaScope: {
                    position: entry.no,
                    levelCount: Number(list.levelCount ?? 0),
                    top: itemData
                        ? getNormalizedListPosition(itemData.item, itemData.index, list.id < 0)
                        : 0,
                    rating: itemData
                        ? Number(itemData.item.rating ?? itemData.item.level?.rating ?? 0)
                        : 0,
                    minProgress: itemData
                        ? Number(getEffectiveMinProgress(itemData.item) ?? 0)
                        : 0,
                    progress: recordSnapshot.progress
                }
            }
        }),
        total: totalRecords,
        lastRefreshedAt
    }
}

export async function getRecordPublicListStats(record: {
    id?: number | null
    userid?: string | null
    levelid?: number | null
    progress?: number | null
    acceptedManually?: boolean | null
    acceptedAuto?: boolean | null
    mobile?: boolean | null
    refreshRate?: number | null
    levels?: {
        id?: number | null
        rating?: number | null
        minProgress?: number | null
        isPlatformer?: boolean | null
    } | null
}) {
    const recordId = Number(record.id)
    const uid = typeof record.userid === 'string' ? record.userid : ''
    const levelId = Number(record.levelid)

    if (!Number.isFinite(recordId) || !uid || !Number.isFinite(levelId)) {
        return []
    }

    if (!record.acceptedManually && !record.acceptedAuto) {
        return []
    }

    const { data: entryRows, error: entriesError } = await (supabase as any)
        .from('listLeaderboardRecordEntries')
        .select('listId, uid, levelId, point, no')
        .eq('uid', uid)
        .eq('levelId', levelId)

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    const entries = entryRows || []
    const listIds = [...new Set(entries.map((entry: any) => Number(entry.listId)).filter(Number.isFinite))]

    if (!listIds.length) {
        return []
    }

    const [listsResult, itemsResult, recordsResult] = await Promise.all([
        (supabase as any)
            .from('lists')
            .select('id, slug, title, mode, isPlatformer, isOfficial, isVerified, topEnabled, visibility, leaderboardEnabled, recordFilterPlatform, recordFilterMinRefreshRate, recordFilterMaxRefreshRate, recordFilterAcceptanceStatus, recordFilterManualAcceptanceOnly')
            .eq('visibility', 'public')
            .in('id', listIds),
        (supabase as any)
            .from('listLevels')
            .select('listId, levelId, rating, position, minProgress, videoID')
            .eq('levelId', levelId)
            .eq('accepted', true)
            .in('listId', listIds),
        (supabase as any)
            .from('records')
            .select('id, userid, levelid, progress, timestamp, mobile, refreshRate, acceptedManually, acceptedAuto')
            .eq('userid', uid)
            .eq('levelid', levelId)
            .or('acceptedManually.eq.true,acceptedAuto.eq.true')
    ])

    if (listsResult.error) {
        throw new Error(listsResult.error.message)
    }

    if (itemsResult.error) {
        throw new Error(itemsResult.error.message)
    }

    if (recordsResult.error) {
        throw new Error(recordsResult.error.message)
    }

    const listsById = new Map<number, any>((listsResult.data || [])
        .filter((list: any) => list.leaderboardEnabled !== false)
        .map((list: any) => [Number(list.id), list]))
    const itemsByListId = new Map<number, any>((itemsResult.data || []).map((item: any) => [Number(item.listId), item]))
    const acceptedRecords = recordsResult.data || []
    const level = {
        id: levelId,
        rating: record.levels?.rating ?? null,
        minProgress: record.levels?.minProgress ?? null,
        isPlatformer: record.levels?.isPlatformer ?? null
    }
    const stats: any[] = []

    for (const entry of entries) {
        const list = listsById.get(Number(entry.listId))
        const itemRow = itemsByListId.get(Number(entry.listId))

        if (!list || !itemRow) {
            continue
        }

        const item = {
            ...itemRow,
            level
        }
        let bestRecord: any = null

        for (const candidate of acceptedRecords) {
            if (!isCustomListRecordEligibleForFilters(candidate, list)) {
                continue
            }

            if (!isEligibleRecordForListItem(candidate, item, Boolean(list.isPlatformer), {
                ignorePlatformerMinProgress: Boolean(list.isPlatformer)
            })) {
                continue
            }

            if (isBetterRecordForListItem(candidate, bestRecord, item, Boolean(list.isPlatformer))) {
                bestRecord = candidate
            }
        }

        if (!bestRecord || Number(bestRecord.id) !== recordId) {
            continue
        }

        stats.push({
            list: {
                id: Number(list.id),
                slug: list.slug ?? null,
                title: list.title,
                mode: list.mode,
                isPlatformer: Boolean(list.isPlatformer),
                isOfficial: Boolean(list.isOfficial),
                isVerified: Boolean(list.isVerified),
                topEnabled: Boolean(list.topEnabled)
            },
            point: Number(entry.point) || 0,
            no: Number(entry.no) || 0,
            item: {
                position: item.position ?? null,
                rating: item.rating ?? record.levels?.rating ?? null,
                minProgress: getEffectiveMinProgress(item)
            }
        })
    }

    return stats.sort((left, right) => {
        const officialDiff = Number(right.list.isOfficial) - Number(left.list.isOfficial)
        const verifiedDiff = Number(right.list.isVerified) - Number(left.list.isVerified)

        return officialDiff || verifiedDiff || left.list.title.localeCompare(right.list.title)
    })
}

export async function getAcceptedRecordsForListLevels(uid: string, levelIds: number[]) {
    const records: any[] = []

    for (let levelStart = 0; levelStart < levelIds.length; levelStart += CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE) {
        const levelBatch = levelIds.slice(levelStart, levelStart + CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE)

        if (!levelBatch.length) {
            continue
        }

        for (let recordStart = 0; ; recordStart += CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
            const recordEnd = recordStart + CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE - 1
            const { data, error } = await supabase
                .from('records')
                .select('id, userid, levelid, progress, timestamp, mobile, refreshRate, acceptedManually, acceptedAuto')
                .eq('userid', uid)
                .in('levelid', levelBatch)
                .or('acceptedManually.eq.true,acceptedAuto.eq.true')
                .order('acceptedManually', { ascending: false, nullsFirst: false })
                .order('acceptedAuto', { ascending: false })
                .order('timestamp', { ascending: false, nullsFirst: false })
                .range(recordStart, recordEnd)

            if (error) {
                throw new Error(error.message)
            }

            if (!data?.length) {
                break
            }

            records.push(...data)

            if (data.length < CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
                break
            }
        }
    }

    return records
}

export async function getCustomListLeaderboardRecordEntryReferences(listId: number, uid: string) {
    const entriesByKey = new Map<string, CustomListLeaderboardRecordEntryReference>()

    if (listId <= 0) {
        return entriesByKey
    }

    const { data, error } = await (supabase as any)
        .from('listLeaderboardRecordEntries')
        .select('uid, levelId, point, no')
        .eq('listId', listId)
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }

    for (const entry of data || []) {
        entriesByKey.set(`${entry.uid}:${entry.levelId}`, {
            point: Number(entry.point) || 0,
            no: Number(entry.no) || 0
        })
    }

    return entriesByKey
}

export async function getCustomListAcceptedPlayerRecords(
    list: Awaited<ReturnType<typeof getCustomListSummary>>,
    options: {
        start: number
        end: number
        uid: string
    }
) {
    const effectiveItemSort = CUSTOM_LIST_ITEM_SORT_VALUES.has((list as any).itemSort)
        ? (list as any).itemSort as 'mode_default' | 'created_at'
        : 'mode_default'
    const items = await getCustomListItems(list.id, list.mode, undefined, effectiveItemSort)
    const itemByLevelId = new Map(items.map((item: any, index: number) => [item.levelId, { item, index }]))
    const levelIds = [...itemByLevelId.keys()]

    if (!levelIds.length) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: (list as any).lastRefreshedAt ?? null
        }
    }

    const [records, playersByUid, leaderboardRecordEntriesByKey] = await Promise.all([
        getAcceptedRecordsForListLevels(options.uid, levelIds),
        fetchCustomListLeaderboardPlayers([options.uid]),
        getCustomListLeaderboardRecordEntryReferences(list.id, options.uid)
    ])
    const player = playersByUid.get(options.uid) || null
    const isTop = list.mode === 'top'
    const entries = records
        .map((record) => {
            const itemData = itemByLevelId.get(record.levelid)

            return itemData ? { record, itemData } : null
        })
        .filter((entry): entry is { record: any; itemData: { item: any; index: number } } => Boolean(entry))
        .sort((left, right) => {
            if (isTop) {
                const leftPosition = getNormalizedListPosition(left.itemData.item, left.itemData.index, list.id < 0)
                const rightPosition = getNormalizedListPosition(right.itemData.item, right.itemData.index, list.id < 0)

                if (leftPosition !== rightPosition) {
                    return leftPosition - rightPosition
                }
            } else {
                const leftRating = Number(left.itemData.item.rating ?? left.itemData.item.level?.rating ?? 0)
                const rightRating = Number(right.itemData.item.rating ?? right.itemData.item.level?.rating ?? 0)

                if (leftRating !== rightRating) {
                    return rightRating - leftRating
                }
            }

            const acceptanceDiff = getRecordAcceptancePriority(right.record) - getRecordAcceptancePriority(left.record)

            if (acceptanceDiff !== 0) {
                return acceptanceDiff
            }

            return Number(right.record.timestamp ?? 0) - Number(left.record.timestamp ?? 0)
        })
        .map(({ record, itemData }) => {
            const leaderboardRecordEntry = leaderboardRecordEntriesByKey.get(`${record.userid}:${record.levelid}`)
            const no = leaderboardRecordEntry?.no ?? null
            const point = leaderboardRecordEntry?.point ?? null
            const progress = Number(record.progress) || 0

            return {
                uid: record.userid,
                levelId: record.levelid,
                point,
                no,
                id: Number.isFinite(Number(record.id)) ? Number(record.id) : null,
                progress,
                timestamp: Number.isFinite(Number(record.timestamp)) ? Number(record.timestamp) : null,
                mobile: Boolean(record.mobile),
                refreshRate: Number.isFinite(Number(record.refreshRate)) ? Number(record.refreshRate) : null,
                acceptedManually: Boolean(record.acceptedManually),
                acceptedAuto: Boolean(record.acceptedAuto),
                player,
                level: itemData.item.level || null,
                formulaScope: {
                    position: no ?? 0,
                    levelCount: items.length,
                    top: getNormalizedListPosition(itemData.item, itemData.index, list.id < 0),
                    rating: Number(itemData.item.rating ?? itemData.item.level?.rating ?? 0),
                    minProgress: Number(getEffectiveMinProgress(itemData.item) ?? 0),
                    progress
                }
            }
        })

    return {
        list,
        data: entries.slice(options.start, options.end + 1),
        total: entries.length,
        lastRefreshedAt: (list as any).lastRefreshedAt ?? null
    }
}

export async function refreshCustomListLeaderboard(identifier: CustomListIdentifier, actor: CustomListActor) {
    const resolved = await resolveCustomListIdentifier(identifier)
    const list = await getCustomListRow(resolved.id)
    await assertCanEditList(list, actor)
    const levelCount = await syncLevelCount(list.id)

    if ((list as any).leaderboardEnabled === false) {
        const refreshRow = await persistDisabledCustomListLeaderboard(list.id)

        return {
            listId: list.id,
            total: refreshRow.totalPlayers,
            totalRecords: refreshRow.totalRecords,
            levelCount,
            lastRefreshedAt: refreshRow.lastRefreshedAt
        }
    }

    const effectiveItemSort = CUSTOM_LIST_ITEM_SORT_VALUES.has(list.itemSort) ? list.itemSort as 'mode_default' | 'created_at' : 'mode_default'
    const hydratedList = {
        ...list,
        levelCount,
        itemSort: effectiveItemSort,
        items: await getCustomListItems(list.id, list.mode, undefined, effectiveItemSort)
    } as Awaited<ReturnType<typeof getCustomList>>
    const { rankedPlayers, rankedRecords } = await calculateCustomListLeaderboardSnapshot(hydratedList)
    const refreshRow = await persistCustomListLeaderboard(list.id, rankedPlayers, rankedRecords)

    return {
        listId: list.id,
        total: refreshRow.totalPlayers,
        totalRecords: refreshRow.totalRecords,
        levelCount,
        lastRefreshedAt: refreshRow.lastRefreshedAt
    }
}
