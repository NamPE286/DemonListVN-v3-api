import {
    assertCanEditListLevels,
    assertLevelTypeMatchesList,
    getRequiredActorUid,
    syncLevelCount
} from './list-access.service'
import {
    AREDL_MIRROR_LIST_ID,
    MIRROR_LEVELS_SELECT_PAGE_SIZE,
    MIRROR_LEVELS_UPSERT_BATCH_SIZE,
    NotFoundError,
    POINTERCRATE_MIRROR_CRAWL_MAX_PAGES,
    POINTERCRATE_MIRROR_CRAWL_MAX_PAGE_LIMIT,
    POINTERCRATE_MIRROR_LIST_ID,
    ValidationError,
    appendCustomListAuditLog,
    fetchAredlLevels,
    fetchLevelFromGD,
    fetchPointercrateListedDemonsPage,
    getCustomListRow,
    requireListId,
    sanitizeCustomListVideoId,
    sanitizeMinProgress,
    supabase
} from './list.common'
import type {
    AredlLevel,
    CustomList,
    CustomListActor,
    CustomListLevelInsert,
    PointercrateListedDemon,
    TablesInsert
} from './list.common'

import { getCustomList } from './list.service'

export type PointercrateMirrorCrawlFailure = {
    levelId: number
    position: number
    name: string
    error: string
}

export type PointercrateMirrorCrawlCounters = {
    processed: number
    inserted: number
    updated: number
    unchanged: number
    failed: number
    gdFetched: number
    gdFailed: number
}

export type MirrorMappedLevel = {
    levelId: number
    name: string
    position: number
    minProgress?: number | null
    videoID?: string | null
    rating?: number
}

export type MirrorMappedSourceResult = {
    processed: number
    sourceLevelIds: number[]
    levels: MirrorMappedLevel[]
    failures: PointercrateMirrorCrawlFailure[]
}

export type MirrorSyncSummary = PointercrateMirrorCrawlCounters & {
    sourceLevelIds: number[]
    failures: PointercrateMirrorCrawlFailure[]
}

export type MirrorSourceInfo = {
    name: 'pointercrate' | 'aredl'
    mirrorListId: number
    fetched: number
    pages?: number
}

export type MirrorStoredLevel = {
    id: number
    isPlatformer: boolean
}

export const MIRROR_LIST_SOURCES = [
    {
        name: 'pointercrate',
        mirrorListId: POINTERCRATE_MIRROR_LIST_ID
    },
    {
        name: 'aredl',
        mirrorListId: AREDL_MIRROR_LIST_ID
    }
] as const satisfies readonly Pick<MirrorSourceInfo, 'name' | 'mirrorListId'>[]

export const CONFIGURED_MIRROR_LIST_IDS = MIRROR_LIST_SOURCES.map((source) => source.mirrorListId)

export function getMirrorSourceByListId(listId: number) {
    return MIRROR_LIST_SOURCES.find((source) => source.mirrorListId === listId) || null
}

export function isMirrorList(list: Pick<CustomList, 'id' | 'isMirror'>) {
    return Boolean(list.isMirror || getMirrorSourceByListId(list.id))
}

export function normalizeCustomListMirrorState<T extends { id: number; isMirror?: boolean | null }>(list: T) {
    return {
        ...list,
        isMirror: Boolean(list.isMirror || getMirrorSourceByListId(list.id))
    }
}

export function normalizeCustomListMirrorStates<T extends { id: number; isMirror?: boolean | null }>(lists: T[]) {
    return lists.map((list) => normalizeCustomListMirrorState(list))
}

export function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback
}

export function logMirrorCrawlStep(sourceName: string, step: string, details: Record<string, unknown> = {}) {
    console.log(`[MirrorCrawl:${sourceName}] ${step}`, details)
}

export function buildMirrorCrawledLevelPayload(levelId: number, gdLevel: Awaited<ReturnType<typeof fetchLevelFromGD>>): TablesInsert<'levels'> {
    return {
        id: levelId,
        name: gdLevel.name,
        creator: gdLevel.author,
        difficulty: gdLevel.difficulty ?? null,
        isPlatformer: gdLevel.length === 5,
        isChallenge: false,
        isNonList: false
    } as TablesInsert<'levels'>
}

export async function upsertMirrorCrawledLevelsBatch(sourceName: string, levelsById: Map<number, { id: number; isPlatformer: boolean }>, payloads: TablesInsert<'levels'>[]) {
    if (!payloads.length) {
        return
    }

    logMirrorCrawlStep(sourceName, 'ensure-levels:upsert-levels-batch:start', {
        batchSize: payloads.length,
        firstLevelId: payloads[0]?.id ?? null,
        lastLevelId: payloads[payloads.length - 1]?.id ?? null
    })

    const { error } = await supabase
        .from('levels')
        .upsert(payloads as any, { onConflict: 'id' })

    if (error) {
        throw new Error(error.message)
    }

    for (const payload of payloads) {
        levelsById.set(Number(payload.id), {
            id: Number(payload.id),
            isPlatformer: Boolean(payload.isPlatformer)
        })
    }

    logMirrorCrawlStep(sourceName, 'ensure-levels:upsert-levels-batch:complete', {
        batchSize: payloads.length,
        resolvedCount: levelsById.size
    })
}

export async function loadMirrorStoredLevels(levelIds: number[], sourceName: string) {
    const uniqueLevelIds = [...new Set(levelIds)]
    const levelsById = new Map<number, MirrorStoredLevel>()

    logMirrorCrawlStep(sourceName, 'levels-table-check:start', {
        sourceLevelCount: levelIds.length,
        uniqueLevelCount: uniqueLevelIds.length,
        firstLevelId: uniqueLevelIds[0] ?? null
    })

    if (!uniqueLevelIds.length) {
        logMirrorCrawlStep(sourceName, 'levels-table-check:skipped', {
            reason: 'no level ids from source api'
        })

        return {
            levelsById,
            missingLevelIds: [] as number[]
        }
    }

    for (let start = 0; ; start += MIRROR_LEVELS_SELECT_PAGE_SIZE) {
        const end = start + MIRROR_LEVELS_SELECT_PAGE_SIZE - 1
        const { data: existingLevels, error } = await supabase
            .from('levels')
            .select('id, isPlatformer')
            .in('id', uniqueLevelIds)
            .order('id', { ascending: true })
            .range(start, end)

        if (error) {
            throw new Error(error.message)
        }

        logMirrorCrawlStep(sourceName, 'levels-table-check:page', {
            start,
            end,
            fetched: existingLevels?.length ?? 0,
            pageSize: MIRROR_LEVELS_SELECT_PAGE_SIZE
        })

        if (!existingLevels?.length) {
            break
        }

        for (const level of existingLevels) {
            levelsById.set(level.id, {
                id: level.id,
                isPlatformer: Boolean(level.isPlatformer)
            })
        }
    }

    const missingLevelIds = uniqueLevelIds.filter((levelId) => !levelsById.has(levelId))

    logMirrorCrawlStep(sourceName, 'levels-table-check:complete', {
        existingCount: levelsById.size,
        missingCount: missingLevelIds.length,
        firstMissingLevelId: missingLevelIds[0] ?? null
    })

    return {
        levelsById,
        missingLevelIds
    }
}

export function createMirrorCrawlFailure(level: Pick<MirrorMappedLevel, 'levelId' | 'position' | 'name'>, error: string): PointercrateMirrorCrawlFailure {
    return {
        levelId: level.levelId,
        position: level.position,
        name: level.name,
        error
    }
}

export function assertPointercrateMirrorListConfig(list: CustomList) {
    if (list.id !== POINTERCRATE_MIRROR_LIST_ID) {
        throw new ValidationError(`Pointercrate crawler is configured for list #${POINTERCRATE_MIRROR_LIST_ID}`)
    }

    if (!isMirrorList(list)) {
        throw new ValidationError('Mirror crawler is only available for mirror lists')
    }

    if (list.isPlatformer) {
        throw new ValidationError('Pointercrate mirror list must be a classic list')
    }

    if (list.mode !== 'top') {
        throw new ValidationError('Pointercrate mirror list must use top mode')
    }
}

export function assertAredlMirrorListConfig(list: CustomList) {
    if (list.id !== AREDL_MIRROR_LIST_ID) {
        throw new ValidationError(`AREDL crawler is configured for list #${AREDL_MIRROR_LIST_ID}`)
    }

    if (!isMirrorList(list)) {
        throw new ValidationError('Mirror crawler is only available for mirror lists')
    }

    if (list.isPlatformer) {
        throw new ValidationError('AREDL mirror list must be a classic list')
    }

    if (list.mode !== 'top') {
        throw new ValidationError('AREDL mirror list must use top mode')
    }
}

export function getPointercrateDemonVideoID(demon: PointercrateListedDemon) {
    if (!demon.video) {
        return null
    }

    try {
        return sanitizeCustomListVideoId(demon.video)
    } catch {
        return null
    }
}

export function getAredlLevelVideoID(level: AredlLevel) {
    void level

    return undefined
}

export function getUniquePointercrateDemons(demons: PointercrateListedDemon[]) {
    const seenLevelIds = new Set<number>()
    const uniqueDemons: PointercrateListedDemon[] = []

    for (const demon of demons) {
        if (seenLevelIds.has(demon.level_id)) {
            continue
        }

        seenLevelIds.add(demon.level_id)
        uniqueDemons.push(demon)
    }

    return uniqueDemons
}

export function getUniqueAredlLevels(levels: AredlLevel[]) {
    const seenLevelIds = new Set<number>()
    const uniqueLevels: AredlLevel[] = []

    for (const level of levels) {
        if (seenLevelIds.has(level.level_id)) {
            continue
        }

        seenLevelIds.add(level.level_id)
        uniqueLevels.push(level)
    }

    return uniqueLevels
}

export function buildPointercrateMirrorSourceLevels(demons: PointercrateListedDemon[]): MirrorMappedSourceResult {
    const uniqueDemons = getUniquePointercrateDemons(demons)
    const levels: MirrorMappedLevel[] = []
    const failures: PointercrateMirrorCrawlFailure[] = []

    for (const demon of uniqueDemons) {
        let minProgress: number | null = null

        try {
            minProgress = demon.requirement == null
                ? null
                : sanitizeMinProgress(demon.requirement, false)
        } catch (error) {
            failures.push(
                createMirrorCrawlFailure(
                    {
                        levelId: demon.level_id,
                        position: demon.position,
                        name: demon.name
                    },
                    getErrorMessage(error, 'Invalid Pointercrate minimum progress')
                )
            )
            continue
        }

        levels.push({
            levelId: demon.level_id,
            name: demon.name,
            position: demon.position,
            minProgress,
            videoID: getPointercrateDemonVideoID(demon)
        })
    }

    return {
        processed: uniqueDemons.length,
        sourceLevelIds: uniqueDemons.map((demon) => demon.level_id),
        levels,
        failures
    }
}

export function buildAredlMirrorSourceLevels(levels: AredlLevel[]): MirrorMappedSourceResult {
    const uniqueLevels = getUniqueAredlLevels(levels)

    return {
        processed: uniqueLevels.length,
        sourceLevelIds: uniqueLevels.map((level) => level.level_id),
        levels: uniqueLevels.map((level) => ({
            levelId: level.level_id,
            name: level.name,
            position: level.position,
            videoID: getAredlLevelVideoID(level),
            rating: level.points
        })),
        failures: []
    }
}

export async function ensureMirrorSourceLevels(levels: MirrorMappedLevel[], sourceName: string, preloadedLevelsById?: Map<number, MirrorStoredLevel>) {
    const levelIds = [...new Set(levels.map((level) => level.levelId))]
    const levelsById = new Map<number, { id: number; isPlatformer: boolean }>(preloadedLevelsById || [])
    const failures = new Map<number, string>()
    const pendingLevelPayloads: TablesInsert<'levels'>[] = []
    let gdFetched = 0
    let gdFailed = 0

    const flushPendingLevelPayloads = async () => {
        if (!pendingLevelPayloads.length) {
            return
        }

        const batch = pendingLevelPayloads.splice(0, pendingLevelPayloads.length)
        await upsertMirrorCrawledLevelsBatch(sourceName, levelsById, batch)
    }

    logMirrorCrawlStep(sourceName, 'ensure-levels:start', {
        sourceLevelCount: levels.length,
        uniqueLevelCount: levelIds.length,
        preloadedCount: levelsById.size,
        firstMappedLevel: levels[0] ?? null
    })

    if (!levelIds.length) {
        logMirrorCrawlStep(sourceName, 'ensure-levels:skipped', {
            reason: 'no levels to ensure'
        })
        return { levelsById, failures, gdFetched, gdFailed }
    }

    const missingLevelIds = levelIds.filter((levelId) => !levelsById.has(levelId))

    logMirrorCrawlStep(sourceName, 'ensure-levels:prepared-missing-levels', {
        existingCount: levelsById.size,
        missingCount: missingLevelIds.length,
        firstMissingLevelId: missingLevelIds[0] ?? null
    })

    for (const levelId of missingLevelIds) {
        try {
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

            pendingLevelPayloads.push(buildMirrorCrawledLevelPayload(levelId, gdLevel))
            gdFetched += 1

            if (pendingLevelPayloads.length >= MIRROR_LEVELS_UPSERT_BATCH_SIZE) {
                await flushPendingLevelPayloads()
            }
        } catch (error) {
            failures.set(levelId, getErrorMessage(error, 'Level not found on the official Geometry Dash server'))
            gdFailed += 1
        }
    }

    await flushPendingLevelPayloads()

    logMirrorCrawlStep(sourceName, 'ensure-levels:complete', {
        resolvedCount: levelsById.size,
        failedCount: failures.size,
        gdFetched,
        gdFailed
    })

    return { levelsById, failures, gdFetched, gdFailed }
}

export function resolveMirrorMappedValue<T>(value: T | null | undefined, existingValue: T | null | undefined, fallback: T | null = null) {
    if (value === undefined) {
        return existingValue ?? fallback
    }

    return value
}

export function buildMirrorListLevelInsert(listId: number, actorUid: string, level: MirrorMappedLevel, existingItem: any, options: {
    defaultRating?: number
} = {}): CustomListLevelInsert {
    const existingRating = Number.isFinite(Number(existingItem?.rating)) ? Number(existingItem.rating) : null
    const rating = level.rating === undefined
        ? existingRating ?? options.defaultRating
        : level.rating

    return {
        listId,
        levelId: level.levelId,
        addedBy: existingItem?.addedBy || actorUid,
        accepted: true,
        position: level.position,
        minProgress: resolveMirrorMappedValue(level.minProgress, existingItem?.minProgress ?? null),
        videoID: resolveMirrorMappedValue(level.videoID, existingItem?.videoID ?? null),
        ...(rating !== undefined && rating !== null ? { rating } : {})
    }
}

export function mirrorListItemChanged(existingItem: any, nextRow: CustomListLevelInsert) {
    return !existingItem.accepted
        || Number(existingItem.position ?? 0) !== Number(nextRow.position ?? 0)
        || (existingItem.minProgress ?? null) !== (nextRow.minProgress ?? null)
        || (existingItem.videoID ?? null) !== (nextRow.videoID ?? null)
        || Number(existingItem.rating ?? 0) !== Number(nextRow.rating ?? 0)
}

export async function syncMappedMirrorLevelsToList(list: CustomList, actorUid: string, source: MirrorMappedSourceResult, options: {
    defaultRating?: number
    sourceName: string
    storedLevelsById?: Map<number, MirrorStoredLevel>
}): Promise<MirrorSyncSummary> {
    logMirrorCrawlStep(options.sourceName, 'sync:start', {
        listId: list.id,
        processed: source.processed,
        mappedCount: source.levels.length,
        sourceLevelCount: source.sourceLevelIds.length,
        initialFailureCount: source.failures.length,
        firstMappedLevel: source.levels[0] ?? null
    })

    const {
        levelsById,
        failures: levelFailures,
        gdFetched,
        gdFailed
    } = await ensureMirrorSourceLevels(source.levels, options.sourceName, options.storedLevelsById)
    const failures = [...source.failures]
    const processableLevels: MirrorMappedLevel[] = []

    for (const level of source.levels) {
        const levelFailure = levelFailures.get(level.levelId)

        if (levelFailure) {
            failures.push(createMirrorCrawlFailure(level, levelFailure))
            continue
        }

        const storedLevel = levelsById.get(level.levelId)

        if (!storedLevel) {
            failures.push(createMirrorCrawlFailure(level, 'Level metadata is unavailable'))
            continue
        }

        try {
            assertLevelTypeMatchesList(list, storedLevel)
        } catch (error) {
            failures.push(
                createMirrorCrawlFailure(
                    level,
                    getErrorMessage(error, 'This level cannot be added to this list type')
                )
            )
            continue
        }

        processableLevels.push(level)
    }

    logMirrorCrawlStep(options.sourceName, 'sync:validated-levels', {
        processableCount: processableLevels.length,
        failedCount: failures.length,
        gdFetched,
        gdFailed
    })

    const processableLevelIds = processableLevels.map((level) => level.levelId)
    let existingItemsByLevelId = new Map<number, any>()

    if (processableLevelIds.length) {
        const { data: existingItems, error: existingItemsError } = await supabase
            .from('listLevels')
            .select('id, levelId, addedBy, accepted, position, minProgress, videoID, rating')
            .eq('listId', list.id)
            .in('levelId', processableLevelIds)

        if (existingItemsError) {
            throw new Error(existingItemsError.message)
        }

        existingItemsByLevelId = new Map((existingItems || []).map((item) => [Number(item.levelId), item]))
    }

    logMirrorCrawlStep(options.sourceName, 'sync:loaded-existing-items', {
        existingItemCount: existingItemsByLevelId.size,
        processableCount: processableLevels.length
    })

    const changedRows: CustomListLevelInsert[] = []
    let inserted = 0
    let updated = 0
    let unchanged = 0

    for (const level of processableLevels) {
        const existingItem = existingItemsByLevelId.get(level.levelId)
        const nextRow = buildMirrorListLevelInsert(list.id, actorUid, level, existingItem, options)

        if (!existingItem) {
            inserted += 1
            changedRows.push(nextRow)
            continue
        }

        if (mirrorListItemChanged(existingItem, nextRow)) {
            updated += 1
            changedRows.push(nextRow)
            continue
        }

        unchanged += 1
    }

    logMirrorCrawlStep(options.sourceName, 'sync:diffed-rows', {
        inserted,
        updated,
        unchanged,
        upsertCount: changedRows.length,
        failedCount: failures.length,
        firstChangedRow: changedRows[0] ?? null
    })

    if (changedRows.length) {
        const { error } = await supabase
            .from('listLevels')
            .upsert(changedRows as any, { onConflict: 'listId,levelId' })

        if (error) {
            throw new Error(error.message)
        }

        logMirrorCrawlStep(options.sourceName, 'sync:upserted', {
            upsertCount: changedRows.length
        })
    } else {
        logMirrorCrawlStep(options.sourceName, 'sync:upsert-skipped', {
            reason: 'no changed rows'
        })
    }

    const summary = {
        processed: source.processed,
        inserted,
        updated,
        unchanged,
        failed: failures.length,
        gdFetched,
        gdFailed,
        sourceLevelIds: source.sourceLevelIds,
        failures
    }

    logMirrorCrawlStep(options.sourceName, 'sync:complete', {
        processed: summary.processed,
        inserted: summary.inserted,
        updated: summary.updated,
        unchanged: summary.unchanged,
        failed: summary.failed,
        gdFetched: summary.gdFetched,
        gdFailed: summary.gdFailed
    })

    return summary
}

export async function removeMirrorStaleLevels(listId: number, sourceLevelIds: number[]) {
    const sourceLevelIdSet = new Set(sourceLevelIds)
    const { data: existingItems, error: existingItemsError } = await supabase
        .from('listLevels')
        .select('levelId')
        .eq('listId', listId)
        .eq('accepted', true)

    if (existingItemsError) {
        throw new Error(existingItemsError.message)
    }

    const staleLevelIds = (existingItems || [])
        .map((item) => Number(item.levelId))
        .filter((levelId) => Number.isInteger(levelId) && !sourceLevelIdSet.has(levelId))

    if (!staleLevelIds.length) {
        return 0
    }

    const { error } = await supabase
        .from('listLevels')
        .delete()
        .eq('listId', listId)
        .in('levelId', staleLevelIds)

    if (error) {
        throw new Error(error.message)
    }

    return staleLevelIds.length
}

export async function fetchAllPointercrateListedDemons() {
    const demons: PointercrateListedDemon[] = []
    let after = 0
    let pageCount = 0
    let completed = false

    logMirrorCrawlStep('pointercrate', 'api-fetch:start', {
        pageLimit: POINTERCRATE_MIRROR_CRAWL_MAX_PAGE_LIMIT,
        maxPages: POINTERCRATE_MIRROR_CRAWL_MAX_PAGES
    })

    while (pageCount < POINTERCRATE_MIRROR_CRAWL_MAX_PAGES) {
        logMirrorCrawlStep('pointercrate', 'api-fetch:page:start', {
            page: pageCount + 1,
            after,
            limit: POINTERCRATE_MIRROR_CRAWL_MAX_PAGE_LIMIT
        })

        const page = await fetchPointercrateListedDemonsPage({
            after,
            limit: POINTERCRATE_MIRROR_CRAWL_MAX_PAGE_LIMIT
        })
        pageCount += 1
        demons.push(...page.demons)

        logMirrorCrawlStep('pointercrate', 'api-fetch:page:complete', {
            page: pageCount,
            fetched: page.demons.length,
            totalFetched: demons.length,
            hasMore: page.hasMore,
            nextAfter: page.nextAfter,
            firstItem: page.demons[0] ?? null
        })

        if (!page.hasMore || page.nextAfter == null) {
            completed = true
            break
        }

        after = page.nextAfter
    }

    if (!completed) {
        logMirrorCrawlStep('pointercrate', 'api-fetch:aborted', {
            pages: pageCount,
            fetched: demons.length
        })
        throw new ValidationError('Pointercrate crawl stopped after too many pages')
    }

    logMirrorCrawlStep('pointercrate', 'api-fetch:complete', {
        pages: pageCount,
        fetched: demons.length,
        firstItem: demons[0] ?? null
    })

    return {
        demons,
        pages: pageCount
    }
}

export async function finalizeMirrorListCrawl(list: CustomList, actor: CustomListActor, actorUid: string | null, source: MirrorSourceInfo, summary: MirrorSyncSummary) {
    logMirrorCrawlStep(source.name, 'finalize:start', {
        listId: list.id,
        sourceLevelCount: summary.sourceLevelIds.length,
        failedCount: summary.failed
    })

    const removed = await removeMirrorStaleLevels(list.id, summary.sourceLevelIds)

    await syncLevelCount(list.id)
    await appendCustomListAuditLog(list.id, {
        actorUid,
        action: `${source.name}_mirror_crawled`,
        metadata: {
            source: source.name,
            mirrorListId: source.mirrorListId,
            sourceLevelCount: summary.sourceLevelIds.length,
            processed: summary.processed,
            inserted: summary.inserted,
            updated: summary.updated,
            unchanged: summary.unchanged,
            failed: summary.failed,
            gdFetched: summary.gdFetched,
            gdFailed: summary.gdFailed,
            removed
        }
    })

    logMirrorCrawlStep(source.name, 'finalize:complete', {
        listId: list.id,
        removed,
        processed: summary.processed,
        inserted: summary.inserted,
        updated: summary.updated,
        unchanged: summary.unchanged,
        failed: summary.failed,
        gdFetched: summary.gdFetched,
        gdFailed: summary.gdFailed
    })

    return {
        source: {
            name: source.name,
            mirrorListId: source.mirrorListId,
            ...(source.pages !== undefined ? { pages: source.pages } : {}),
            fetched: source.fetched
        },
        processed: summary.processed,
        inserted: summary.inserted,
        updated: summary.updated,
        unchanged: summary.unchanged,
        failed: summary.failed,
        gdFetched: summary.gdFetched,
        gdFailed: summary.gdFailed,
        removed,
        sourceLevelCount: summary.sourceLevelIds.length,
        failures: summary.failures,
        list: await getCustomList(list.id, actor)
    }
}

export async function crawlPointercrateMirrorList(listId: number, actor: CustomListActor) {
    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, actor)
    assertPointercrateMirrorListConfig(list)

    const actorUid = access.actorUid ?? getRequiredActorUid(actor)

    logMirrorCrawlStep('pointercrate', 'crawl:start', {
        listId: list.id,
        actorUid
    })

    const { demons, pages } = await fetchAllPointercrateListedDemons()
    const pointercrateLevelIds = getUniquePointercrateDemons(demons).map((demon) => demon.level_id)
    const { levelsById: storedPointercrateLevelsById } = await loadMirrorStoredLevels(pointercrateLevelIds, 'pointercrate')
    const mapped = buildPointercrateMirrorSourceLevels(demons)
    logMirrorCrawlStep('pointercrate', 'map:complete', {
        processed: mapped.processed,
        mappedCount: mapped.levels.length,
        failedCount: mapped.failures.length,
        firstItem: mapped.levels[0] ?? null
    })
    const summary = await syncMappedMirrorLevelsToList(list, actorUid, mapped, {
        defaultRating: 5,
        sourceName: 'pointercrate',
        storedLevelsById: storedPointercrateLevelsById
    })

    return finalizeMirrorListCrawl(list, actor, access.actorUid, {
        name: 'pointercrate',
        mirrorListId: POINTERCRATE_MIRROR_LIST_ID,
        fetched: mapped.processed,
        pages
    }, summary)
}

export async function crawlAredlMirrorList(listId: number, actor: CustomListActor) {
    requireListId(listId)

    if (listId !== AREDL_MIRROR_LIST_ID) {
        throw new ValidationError(`AREDL crawler is configured for list #${AREDL_MIRROR_LIST_ID}`)
    }

    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, actor)
    assertAredlMirrorListConfig(list)

    const actorUid = access.actorUid ?? getRequiredActorUid(actor)

    logMirrorCrawlStep('aredl', 'crawl:start', {
        listId: list.id,
        actorUid
    })

    logMirrorCrawlStep('aredl', 'api-fetch:start', {
        listId: list.id
    })
    const levels = await fetchAredlLevels()
    logMirrorCrawlStep('aredl', 'api-fetch:complete', {
        fetched: levels.length,
        firstItem: levels[0] ?? null
    })
    const aredlLevelIds = getUniqueAredlLevels(levels).map((level) => level.level_id)
    const { levelsById: storedAredlLevelsById } = await loadMirrorStoredLevels(aredlLevelIds, 'aredl')
    const mapped = buildAredlMirrorSourceLevels(levels)
    logMirrorCrawlStep('aredl', 'map:complete', {
        processed: mapped.processed,
        mappedCount: mapped.levels.length,
        failedCount: mapped.failures.length,
        firstItem: mapped.levels[0] ?? null
    })
    const summary = await syncMappedMirrorLevelsToList(list, actorUid, mapped, {
        sourceName: 'aredl',
        storedLevelsById: storedAredlLevelsById
    })

    return finalizeMirrorListCrawl(list, actor, access.actorUid, {
        name: 'aredl',
        mirrorListId: AREDL_MIRROR_LIST_ID,
        fetched: mapped.processed
    }, summary)
}

export async function crawlMirrorList(listId: number, actor: CustomListActor) {
    if (listId === AREDL_MIRROR_LIST_ID) {
        return crawlAredlMirrorList(listId, actor)
    }

    const list = await getCustomListRow(listId)
    await assertCanEditListLevels(list, actor)

    if (!isMirrorList(list)) {
        throw new ValidationError('Mirror crawler is only available for mirror lists')
    }

    if (list.id === POINTERCRATE_MIRROR_LIST_ID) {
        return crawlPointercrateMirrorList(listId, actor)
    }

    throw new ValidationError('No crawler is configured for this mirror list')
}
