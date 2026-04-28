import {
    enrichItemsWithViewerEligibleRecords,
    getCustomListRecordPoint,
    getCustomListRecordScore,
    getNormalizedListPosition,
    isBetterRecordForListItem,
    isEligibleRecordForListItem,
    roundCustomListSnapshotValue
} from './list-record-helpers.service'
import type {
    CustomListLeaderboardEntry,
    CustomListLeaderboardRecordEntry,
    CustomListLeaderboardRefreshRow,
    CustomListRecordFilterSettings,
    OfficialListSlug
} from './list.common'
import {
    CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE,
    CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE,
    applyCustomListRecordFiltersToQuery,
    getOfficialListConfig,
    isCustomListRecordEligibleForFilters,
    playerSelect,
    supabase
} from './list.common'

export async function getOfficialList(slug: OfficialListSlug, viewerId?: string, itemRange?: {
    start?: number
    end?: number
}) {
    const config = getOfficialListConfig(slug)
    const hasItemRange = itemRange?.start !== undefined && itemRange?.end !== undefined
    const rangeStart = hasItemRange ? (itemRange.start ?? 0) : 0
    const rangeEnd = hasItemRange ? (itemRange.end ?? 4999) : 4999
    const [levels, totalLevels] = hasItemRange
        ? await Promise.all([
            config.loadLevels({ start: rangeStart, end: rangeEnd, uid: viewerId || '' }),
            config.loadLevels({ start: 0, end: 4999, uid: '' }).then((entries) => entries.length)
        ])
        : [await config.loadLevels({ start: 0, end: 4999, uid: viewerId || '' }), undefined]
    const levelCount = totalLevels ?? levels.length

    const list = {
        id: -1,
        slug: config.slug,
        owner: '',
        title: config.title,
        description: config.description,
        backgroundColor: null,
        bannerUrl: null,
        borderColor: null,
        visibility: 'public',
        tags: ['official'],
        levelCount,
        isPlatformer: config.isPlatformer,
        isOfficial: true,
        communityEnabled: false,
        leaderboardEnabled: true,
        levelSubmissionEnabled: false,
        faviconUrl: null,
        logoUrl: null,
        recordFilterPlatform: 'any',
        recordFilterMinRefreshRate: null,
        recordFilterMaxRefreshRate: null,
        recordFilterAcceptanceStatus: 'manual',
        recordFilterManualAcceptanceOnly: true,
        topEnabled: config.mode === 'top',
        itemSort: 'mode_default',
        mode: config.mode,
        rankBadges: [],
        recordScoreFormula: config.recordScoreFormula,
        weightFormula: config.weightFormula,
        lastRefreshedAt: null,
        updated_at: new Date().toISOString(),
        starCount: 0,
        starred: false,
        items: levels.map((level: any, index: number) => ({
            id: -(index + 1),
            created_at: level.created_at || new Date().toISOString(),
            listId: -1,
            levelId: level.id,
            addedBy: '',
            rating: level.rating ?? 1,
            position: level.flTop ?? level.dlTop ?? (rangeStart + index),
            minProgress: level.minProgress ?? null,
            level
        }))
    }

    return {
        ...list,
        items: await enrichItemsWithViewerEligibleRecords(list.items, list, viewerId)
    }
}

export async function getOfficialListSummary(slug: OfficialListSlug) {
    const config = getOfficialListConfig(slug)
    const levels = await config.loadLevels({ start: 0, end: 4999, uid: '' })

    return {
        id: -1,
        slug: config.slug,
        owner: '',
        title: config.title,
        description: config.description,
        backgroundColor: null,
        bannerUrl: null,
        borderColor: null,
        visibility: 'public',
        tags: ['official'],
        levelCount: levels.length,
        isPlatformer: config.isPlatformer,
        isOfficial: true,
        communityEnabled: false,
        leaderboardEnabled: true,
        levelSubmissionEnabled: false,
        faviconUrl: null,
        logoUrl: null,
        recordFilterPlatform: 'any',
        recordFilterMinRefreshRate: null,
        recordFilterMaxRefreshRate: null,
        recordFilterAcceptanceStatus: 'manual',
        recordFilterManualAcceptanceOnly: true,
        topEnabled: config.mode === 'top',
        itemSort: 'mode_default',
        mode: config.mode,
        rankBadges: [],
        recordScoreFormula: config.recordScoreFormula,
        weightFormula: config.weightFormula,
        lastRefreshedAt: null,
        updated_at: new Date().toISOString(),
        starCount: 0,
        starred: false
    }
}

export async function fetchCustomListLeaderboardSourceRecords(
    levelIds: number[],
    list: CustomListRecordFilterSettings
) {
    if (!levelIds.length) {
        return [] as any[]
    }

    const rows: any[] = []

    // Supabase caps uncapped select queries at 1000 rows, so page until the filtered result set is exhausted.
    for (let start = 0; ; start += CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
        const end = start + CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE - 1
        const query = applyCustomListRecordFiltersToQuery(
            supabase
                .from('records')
                .select('userid, levelid, progress, timestamp, acceptedManually, acceptedAuto, mobile, refreshRate, players!userid!inner(uid)')
                .eq('players.isHidden', false)
                .in('levelid', levelIds)
                .order('userid', { ascending: true })
                .order('levelid', { ascending: true }),
            list
        )
        const { data, error } = await query.range(start, end)

        if (error) {
            throw new Error(error.message)
        }

        if (!data?.length) {
            break
        }

        rows.push(...data.filter((record: any) => isCustomListRecordEligibleForFilters(record, list)))

        if (data.length < CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
            break
        }
    }

    return rows
}

export async function fetchCustomListLeaderboardPlayers(uids: string[]) {
    const playersByUid = new Map<string, any>()

    for (let start = 0; start < uids.length; start += CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE) {
        const uidBatch = uids.slice(start, start + CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE)

        if (!uidBatch.length) {
            continue
        }

        const { data, error } = await supabase
            .from('players')
            .select(playerSelect)
            .eq('isHidden', false)
            .in('uid', uidBatch)

        if (error) {
            throw new Error(error.message)
        }

        for (const player of data || []) {
            playersByUid.set(player.uid, player)
        }
    }

    return playersByUid
}

export async function calculateCustomListLeaderboardSnapshot(list: any) {
    const items = list.items || []

    if (!items.length) {
        return {
            rankedPlayers: [] as CustomListLeaderboardEntry[],
            rankedRecords: [] as CustomListLeaderboardRecordEntry[]
        }
    }

    const levelIds = [...new Set(items.map((item: any) => Number(item.levelId)))] as number[]
    const itemByLevelId = new Map<number, { item: any; index: number }>(
        items.map((item: any, index: number) => [Number(item.levelId), { item, index }])
    )
    const isTop = list.mode === 'top'

    const data = await fetchCustomListLeaderboardSourceRecords(levelIds, list)

    // Step 1: Collect best record per (uid, levelId)
    const bestRecords = new Map<string, { record: any; itemData: { item: any; index: number } }>()

    for (const record of (data || []) as any[]) {
        const itemData = itemByLevelId.get(record.levelid)

        if (!itemData) {
            continue
        }

        if (!isEligibleRecordForListItem(record, itemData.item, list.isPlatformer, {
            ignorePlatformerMinProgress: list.isPlatformer
        })) {
            continue
        }

        const key = `${record.userid}:${record.levelid}`
        const existing = bestRecords.get(key)

        if (!existing || isBetterRecordForListItem(record, existing.record, itemData.item, list.isPlatformer)) {
            bestRecords.set(key, { record, itemData })
        }
    }

    // Step 2: Group by uid
    const recordsByUid = new Map<string, Array<{ record: any; itemData: { item: any; index: number } }>>()

    for (const entry of bestRecords.values()) {
        const uid = entry.record.userid
        let group = recordsByUid.get(uid)

        if (!group) {
            group = []
            recordsByUid.set(uid, group)
        }

        group.push(entry)
    }

    // Step 3: Calculate record scores, sort each uid's records by score, assign no, then apply final score formula
    const playerScores = new Map<string, {
        player: any
        score: number
        completedCount: number
    }>()
    const rankedRecords: CustomListLeaderboardRecordEntry[] = []

    const playersByUid = await fetchCustomListLeaderboardPlayers([...recordsByUid.keys()])

    for (const [uid, entries] of recordsByUid) {
        const player = playersByUid.get(uid)

        if (!player) {
            continue
        }

        const scoredEntries = entries.map((entry) => ({
            ...entry,
            score: getCustomListRecordScore(
                list,
                entry.itemData.item,
                entry.itemData.index,
                items.length,
                entry.record
            )
        }))

        scoredEntries.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score
            }

            if (isTop) {
                const aPos = getNormalizedListPosition(a.itemData.item, a.itemData.index, list.id < 0)
                const bPos = getNormalizedListPosition(b.itemData.item, b.itemData.index, list.id < 0)
                return aPos - bPos
            }

            const aRating = Number(a.itemData.item.rating ?? a.itemData.item.level?.rating ?? 0)
            const bRating = Number(b.itemData.item.rating ?? b.itemData.item.level?.rating ?? 0)
            return bRating - aRating
        })

        let totalScore = 0

        for (let i = 0; i < scoredEntries.length; i++) {
            const { record, itemData, score } = scoredEntries[i]
            const no = i + 1
            const recordPoint = getCustomListRecordPoint(
                list,
                itemData.item,
                itemData.index,
                no,
                items.length,
                record,
                score
            )

            rankedRecords.push({
                uid,
                levelId: record.levelid,
                point: recordPoint,
                no
            })

            totalScore += recordPoint
        }

        playerScores.set(uid, {
            player,
            score: totalScore,
            completedCount: entries.length
        })
    }

    const rankedPlayers = [...playerScores.values()]
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score
            }

            if (right.completedCount !== left.completedCount) {
                return right.completedCount - left.completedCount
            }

            return String(left.player?.name || '').localeCompare(String(right.player?.name || ''))
        })
        .map((entry, index) => ({
            ...entry.player,
            rank: index + 1,
            score: roundCustomListSnapshotValue(entry.score),
            completedCount: entry.completedCount
        }))

    return {
        rankedPlayers,
        rankedRecords
    }
}

export async function persistCustomListLeaderboard(
    listId: number,
    rankedPlayers: CustomListLeaderboardEntry[],
    rankedRecords: CustomListLeaderboardRecordEntry[]
) {
    const lastRefreshedAt = new Date().toISOString()

    const { data: refreshRow, error: refreshError } = await (supabase as any)
        .from('listLeaderboardRefreshes')
        .upsert({
            listId,
            totalPlayers: rankedPlayers.length,
            totalRecords: rankedRecords.length,
            lastRefreshedAt
        }, {
            onConflict: 'listId'
        })
        .select('id, listId, totalPlayers, totalRecords, lastRefreshedAt')
        .single()

    if (refreshError || !refreshRow) {
        throw new Error(refreshError?.message || 'Failed to persist leaderboard refresh')
    }

    const [{ error: deleteLeaderboardError }, { error: deleteRecordsError }] = await Promise.all([
        (supabase as any)
            .from('listLeaderboardEntries')
            .delete()
            .eq('listId', listId),
        (supabase as any)
            .from('listLeaderboardRecordEntries')
            .delete()
            .eq('listId', listId)
    ])

    if (deleteLeaderboardError) {
        throw new Error(deleteLeaderboardError.message)
    }

    if (deleteRecordsError) {
        throw new Error(deleteRecordsError.message)
    }

    const writes: PromiseLike<{ error: { message: string } | null }>[] = []

    if (rankedPlayers.length) {
        writes.push(
            (supabase as any)
                .from('listLeaderboardEntries')
                .insert(rankedPlayers.map((entry) => ({
                    listId,
                    uid: entry.uid,
                    rank: entry.rank,
                    score: entry.score,
                    completedCount: entry.completedCount
                })))
        )
    }

    if (rankedRecords.length) {
        writes.push(
            (supabase as any)
                .from('listLeaderboardRecordEntries')
                .insert(rankedRecords.map((entry) => ({
                    listId,
                    uid: entry.uid,
                    levelId: entry.levelId,
                    point: entry.point,
                    no: entry.no
                })))
        )
    }

    if (writes.length) {
        const results = await Promise.all(writes)

        for (const result of results) {
            if (result.error) {
                throw new Error(result.error.message)
            }
        }
    }

    return refreshRow as CustomListLeaderboardRefreshRow
}

export async function deleteCustomListLeaderboardArtifacts(listId: number) {
    const results = await Promise.all([
        (supabase as any)
            .from('playerCardStatLines')
            .delete()
            .eq('listId', listId),
        (supabase as any)
            .from('listLeaderboardEntries')
            .delete()
            .eq('listId', listId),
        (supabase as any)
            .from('listLeaderboardRecordEntries')
            .delete()
            .eq('listId', listId)
    ])

    for (const result of results) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }
}

export async function persistDisabledCustomListLeaderboard(listId: number) {
    await deleteCustomListLeaderboardArtifacts(listId)

    const lastRefreshedAt = new Date().toISOString()
    const { data, error } = await (supabase as any)
        .from('listLeaderboardRefreshes')
        .upsert({
            listId,
            totalPlayers: 0,
            totalRecords: 0,
            lastRefreshedAt
        }, {
            onConflict: 'listId'
        })
        .select('id, listId, totalPlayers, totalRecords, lastRefreshedAt')
        .single()

    if (error || !data) {
        throw new Error(error?.message || 'Failed to persist leaderboard refresh')
    }

    return data as CustomListLeaderboardRefreshRow
}

