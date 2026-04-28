import {
    assertCanEditList,
    assertCanEditListLevels,
    assertLevelTypeMatchesList,
    assertReadable,
    enrichListsWithStars,
    ensureLevelExists,
    getRequiredActorUid,
    getStarSummary,
    sanitizeSubmissionPosition,
    syncLevelCount,
    touchCustomListActivity
} from './list-access.service'
import {
    ensureStoredRatingPositions,
    ensureStoredTopPositions,
    getEffectiveMinProgress,
    getEffectiveVideoID,
    getNormalizedListPosition,
    isEligibleRecordForListItem
} from './list-record-helpers.service'
import {
    ConflictError,
    NotFoundError,
    ValidationError,
    appendCustomListAuditLog,
    getCustomListRow,
    getOfficialListConfig,
    normalizeRankBadges,
    playerSelect,
    requireLevelId,
    sanitizeBatchCustomListLevelInputs,
    sanitizeCustomListVideoId,
    sanitizeLevelReorderIds,
    sanitizeListLevelCreatedAt,
    sanitizeMinProgress,
    sanitizeRating,
    supabase
} from './list.common'
import type {
    CustomList,
    CustomListAccessContext,
    CustomListActor,
    CustomListIdentifier,
    CustomListLevelInsert,
    CustomListSettingsPayload,
    CustomListStarInsert,
    CustomListWithOwnerData
} from './list.common'

import { normalizeCustomListMirrorStates } from './list-crawler.service'
import {
    buildCustomListSettingsUpdatePlan,
    getCustomList
} from './list.service'

export async function applyCustomListLevelOrder(listId: number, levelIds: number[]) {
    const updates = levelIds.map((levelId, index) =>
        supabase
            .from('listLevels')
            .update({ position: index + 1 })
            .eq('listId', listId)
            .eq('levelId', levelId)
            .eq('accepted', true)
    )

    const results = await Promise.all(updates)

    for (const result of results) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }
}

export async function batchSaveCustomListLevels(listId: number, actor: CustomListActor, payload: {
    settings?: unknown
    creates?: unknown
    updates?: unknown
    deletes?: unknown
    auditEntries?: unknown
    reorderLevelIds?: unknown
}) {
    const list = await getCustomListRow(listId)
    const hasSettingsInput = payload.settings !== undefined
    const createInputs = Array.isArray(payload.creates) ? payload.creates : []
    const updateInputs = Array.isArray(payload.updates) ? payload.updates : []
    const deleteInputs = Array.isArray(payload.deletes) ? payload.deletes : []
    const auditEntries = Array.isArray(payload.auditEntries) ? payload.auditEntries : []
    const reorderLevelIds = payload.reorderLevelIds !== undefined
        ? sanitizeLevelReorderIds(payload.reorderLevelIds)
        : []

    const deleteLevelIds = deleteInputs
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)

    const createLevelIds = createInputs
        .map((value) => Number((value as any)?.levelId))
        .filter((value) => Number.isInteger(value) && value > 0)

    const updateLevelIds = updateInputs
        .map((value) => Number((value as any)?.levelId))
        .filter((value) => Number.isInteger(value) && value > 0)

    const hasLevelChanges = Boolean(createLevelIds.length || updateLevelIds.length || deleteLevelIds.length || auditEntries.length || reorderLevelIds.length)

    if (!hasSettingsInput && !hasLevelChanges) {
        return getCustomList(listId, actor)
    }

    let settingsAccess: CustomListAccessContext | null = null
    let levelsAccess: CustomListAccessContext | null = null
    let workingList = list
    let settingsUpdatePlan: Awaited<ReturnType<typeof buildCustomListSettingsUpdatePlan>> | null = null

    if (hasSettingsInput) {
        if (!payload.settings || typeof payload.settings !== 'object' || Array.isArray(payload.settings)) {
            throw new ValidationError('settings must be an object')
        }

        settingsAccess = await assertCanEditList(list, actor)
        settingsUpdatePlan = await buildCustomListSettingsUpdatePlan(listId, workingList, payload.settings as CustomListSettingsPayload)

        if (settingsUpdatePlan.changedEntries.length) {
            workingList = {
                ...workingList,
                ...settingsUpdatePlan.updates
            } as CustomList
        }
    }

    if (hasLevelChanges) {
        levelsAccess = await assertCanEditListLevels(workingList, actor)
    }

    if (!hasLevelChanges && !settingsUpdatePlan?.changedEntries.length) {
        return getCustomList(listId, actor)
    }

    const access = levelsAccess ?? settingsAccess
    const actorUid = access?.actorUid ?? getRequiredActorUid(actor)
    const affectedLevelIds = [...new Set([...createLevelIds, ...updateLevelIds, ...deleteLevelIds])]
    let levelsById = new Map<number, { id: number; isPlatformer: boolean }>()

    if (createLevelIds.length || updateLevelIds.length) {
        const { data: existingLevels, error: existingLevelsError } = await supabase
            .from('levels')
            .select('id, isPlatformer')
            .in('id', affectedLevelIds)

        if (existingLevelsError) {
            throw new Error(existingLevelsError.message)
        }

        levelsById = new Map((existingLevels || []).map((level) => [level.id, level]))
    }

    for (const levelId of [...createLevelIds, ...updateLevelIds]) {
        const level = levelsById.get(levelId) || await ensureLevelExists(levelId)
        assertLevelTypeMatchesList(workingList, level)
    }

    if (settingsUpdatePlan?.changedEntries.length) {
        const { error } = await supabase
            .from('lists')
            .update(settingsUpdatePlan.updates)
            .eq('id', listId)

        if (error) {
            throw new Error(error.message)
        }

        await appendCustomListAuditLog(listId, {
            actorUid: settingsAccess?.actorUid ?? actorUid,
            action: 'list_updated',
            metadata: {
                fields: settingsUpdatePlan.changedEntries.map(([field]) => field),
                changes: settingsUpdatePlan.changes
            }
        })
    }

    if (workingList.mode === 'top') {
        await ensureStoredTopPositions(listId)
    } else {
        await ensureStoredRatingPositions(listId)
    }

    if (deleteLevelIds.length) {
        const { error: deleteError } = await supabase
            .from('listLevels')
            .delete()
            .eq('listId', listId)
            .eq('accepted', true)
            .in('levelId', deleteLevelIds)

        if (deleteError) {
            throw new Error(deleteError.message)
        }
    }

    if (createInputs.length) {
        const existingItemsResult = await supabase
            .from('listLevels')
            .select('levelId')
            .eq('listId', listId)
            .in('levelId', createLevelIds)

        if (existingItemsResult.error) {
            throw new Error(existingItemsResult.error.message)
        }

        const existingLevelIds = new Set((existingItemsResult.data || []).map((item) => item.levelId))
        const createRows: CustomListLevelInsert[] = []

        for (const rawInput of createInputs) {
            const levelId = Number((rawInput as any)?.levelId)

            if (!Number.isInteger(levelId) || levelId <= 0) {
                throw new ValidationError('Invalid level ID in batch create payload')
            }

            if (existingLevelIds.has(levelId)) {
                throw new ConflictError('Level already exists in this list')
            }

            const levelInput = rawInput as {
                createdAt?: unknown
                rating?: unknown
                minProgress?: unknown
                videoID?: unknown
                videoId?: unknown
                position?: unknown
                top?: unknown
            }

            const positionInput = levelInput.position !== undefined ? levelInput.position : levelInput.top
            const videoInput = levelInput.videoID !== undefined ? levelInput.videoID : levelInput.videoId
            const nextRow: CustomListLevelInsert = {
                listId,
                levelId,
                addedBy: actorUid,
                accepted: true,
                rating: Number.isFinite(Number(levelInput.rating)) ? Number(levelInput.rating) : 5,
                minProgress: levelInput.minProgress === undefined ? null : sanitizeMinProgress(levelInput.minProgress, workingList.isPlatformer),
                position: sanitizeSubmissionPosition(positionInput),
                videoID: videoInput === undefined ? null : sanitizeCustomListVideoId(videoInput)
            }

            if (levelInput.createdAt !== undefined) {
                nextRow.created_at = sanitizeListLevelCreatedAt(levelInput.createdAt)
            }

            createRows.push(nextRow)
        }

        const { error: insertError } = await supabase
            .from('listLevels')
            .insert(createRows)

        if (insertError) {
            throw new Error(insertError.message)
        }
    }

    if (updateInputs.length) {
        for (const rawInput of updateInputs) {
            const levelId = Number((rawInput as any)?.levelId)

            if (!Number.isInteger(levelId) || levelId <= 0) {
                throw new ValidationError('Invalid level ID in batch update payload')
            }

            const patch = rawInput as {
                rating?: unknown
                minProgress?: unknown
                videoID?: unknown
                videoId?: unknown
                createdAt?: unknown
                created_at?: unknown
            }

            const updates: Record<string, unknown> = {}

            if (patch.rating !== undefined) {
                updates.rating = sanitizeRating(patch.rating)
            }

            if (patch.minProgress !== undefined) {
                updates.minProgress = sanitizeMinProgress(patch.minProgress, workingList.isPlatformer)
            }

            const nextVideoID = patch.videoID !== undefined ? patch.videoID : patch.videoId

            if (nextVideoID !== undefined) {
                updates.videoID = sanitizeCustomListVideoId(nextVideoID)
            }

            const nextCreatedAt = patch.createdAt !== undefined ? patch.createdAt : patch.created_at

            if (nextCreatedAt !== undefined) {
                updates.created_at = sanitizeListLevelCreatedAt(nextCreatedAt)
            }

            if (!Object.keys(updates).length) {
                continue
            }

            const { data, error } = await supabase
                .from('listLevels')
                .update(updates)
                .eq('listId', listId)
                .eq('levelId', levelId)
                .eq('accepted', true)
                .select('id')
                .maybeSingle()

            if (error) {
                throw new Error(error.message)
            }

            if (!data) {
                throw new NotFoundError('Level is not in this list')
            }
        }
    }

    if (reorderLevelIds.length) {
        if (workingList.mode !== 'top') {
            throw new ValidationError('Reordering is only available in top mode')
        }

        await applyCustomListLevelOrder(listId, reorderLevelIds)
    }

    for (const entry of auditEntries as Array<{ actorUid?: string | null; action?: string; targetUid?: string | null; metadata?: Record<string, unknown> }>) {
        if (!entry?.action) {
            continue
        }

        await appendCustomListAuditLog(listId, {
            actorUid: entry.actorUid ?? actorUid,
            action: entry.action,
            targetUid: entry.targetUid ?? null,
            metadata: entry.metadata || {}
        })
    }

    if (reorderLevelIds.length) {
        await appendCustomListAuditLog(listId, {
            actorUid,
            action: 'levels_reordered',
            metadata: {
                levelIds: reorderLevelIds
            }
        })
    }

    await syncLevelCount(listId)
    await touchCustomListActivity(listId)

    return getCustomList(listId, actor)
}

export async function getRandomCustomListLevel(identifier: CustomListIdentifier, options: {
    excludeLevelIds?: number[]
    viewerId?: CustomListActor
} = {}) {
    const {
        excludeLevelIds = [],
        viewerId
    } = options

    const list = await getCustomList(identifier, viewerId)
    const excludedLevelIds = new Set(excludeLevelIds)
    const candidates = (list.items || [])
        .filter((item: any, index: number) => item.level && !excludedLevelIds.has(item.levelId))
        .map((item: any, index: number) => ({
            ...item.level,
            videoID: getEffectiveVideoID(item),
            rating: item.rating ?? item.level.rating ?? null,
            minProgress: getEffectiveMinProgress(item),
            listPosition: getNormalizedListPosition(item, index, list.id < 0)
        }))

    if (!candidates.length) {
        throw new NotFoundError('No level available for this list')
    }

    const randomIndex = Math.floor(Math.random() * candidates.length)

    return candidates[randomIndex]
}

export async function toggleCustomListStar(listId: number, userId: string) {
    const list = await getCustomListRow(listId)
    await assertReadable(list, userId)

    const { data: existing, error: existingError } = await supabase
        .from('listStars')
        .select('id')
        .eq('listId', listId)
        .eq('uid', userId)
        .maybeSingle()

    if (existingError) {
        throw new Error(existingError.message)
    }

    let starred = false

    if (existing) {
        const { error } = await supabase
            .from('listStars')
            .delete()
            .eq('id', existing.id)

        if (error) {
            throw new Error(error.message)
        }
    } else {
        const starInsert: CustomListStarInsert = {
            listId,
            uid: userId
        }

        const { error } = await supabase
            .from('listStars')
            .insert(starInsert)

        if (error) {
            if (error.code === '23505') {
                throw new ConflictError('List already starred')
            }

            throw new Error(error.message)
        }

        starred = true
    }

    await touchCustomListActivity(listId)

    const { counts } = await getStarSummary([listId], userId)

    return {
        starred,
        starCount: counts.get(listId) || 0
    }
}

export async function getStarredListsByLevel(levelId: number, viewerId?: string) {
    requireLevelId(levelId)

    const { data: listLevels, error: listLevelsError } = await supabase
        .from('listLevels')
        .select('listId, created_at, rating, position, minProgress')
        .eq('levelId', levelId)
        .eq('accepted', true)

    if (listLevelsError) {
        throw new Error(listLevelsError.message)
    }

    const listIds = [...new Set((listLevels || []).map((entry) => entry.listId))]
    const listItemsById = new Map((listLevels || []).map((entry) => [entry.listId, entry]))

    if (!listIds.length) {
        return []
    }

    const { data: lists, error: listsError } = await supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
        .eq('visibility', 'public')
        .in('id', listIds)
        .order('updated_at', { ascending: false })

    if (listsError) {
        throw new Error(listsError.message)
    }

    const enriched = normalizeCustomListMirrorStates(
        await enrichListsWithStars((lists || []) as CustomListWithOwnerData[], viewerId)
    )

    return enriched
        .filter((list) => list.isOfficial || list.starCount > 0)
        .sort((left, right) => {
            if (left.isOfficial !== right.isOfficial) {
                return left.isOfficial ? -1 : 1
            }

            if (right.starCount !== left.starCount) {
                return right.starCount - left.starCount
            }

            return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
        })
        .map((list) => ({
            ...list,
            rankBadges: normalizeRankBadges(list.rankBadges),
            item: listItemsById.get(list.id) || null
        }))
}

export function getOfficialLevelListEntries(level: {
    created_at?: string | null
    rating?: number | null
    flPt?: number | null
    dlTop?: number | null
    flTop?: number | null
    minProgress?: number | null
    isChallenge?: boolean | null
    isPlatformer?: boolean | null
}) {
    const createdAt = level.created_at || new Date().toISOString()
    const updatedAt = createdAt
    const entries: any[] = []
    const recordFilterDefaults = {
        recordFilterPlatform: 'any',
        recordFilterMinRefreshRate: null,
        recordFilterMaxRefreshRate: null,
        recordFilterAcceptanceStatus: 'manual',
        recordFilterManualAcceptanceOnly: true
    }

    if (level.dlTop != null) {
        if (level.isChallenge) {
            const config = getOfficialListConfig('cl')
            entries.push({
                id: -3,
                slug: config.slug,
                owner: '',
                title: config.title,
                description: config.description,
                backgroundColor: null,
                bannerUrl: null,
                borderColor: null,
                visibility: 'public',
                tags: ['official'],
                levelCount: 0,
                isPlatformer: false,
                isOfficial: true,
                communityEnabled: false,
                levelSubmissionEnabled: false,
                faviconUrl: null,
                logoUrl: null,
                topEnabled: false,
                itemSort: 'mode_default',
                mode: config.mode,
                rankBadges: [],
                recordScoreFormula: config.recordScoreFormula,
                weightFormula: config.weightFormula,
                ...recordFilterDefaults,
                lastRefreshedAt: null,
                updated_at: updatedAt,
                starCount: 0,
                starred: false,
                ownerData: null,
                item: {
                    created_at: createdAt,
                    rating: level.rating ?? null,
                    position: level.dlTop,
                    minProgress: level.minProgress ?? null,
                    videoID: null
                }
            })
        } else if (level.isPlatformer) {
            const config = getOfficialListConfig('pl')
            entries.push({
                id: -2,
                slug: config.slug,
                owner: '',
                title: config.title,
                description: config.description,
                backgroundColor: null,
                bannerUrl: null,
                borderColor: null,
                visibility: 'public',
                tags: ['official'],
                levelCount: 0,
                isPlatformer: true,
                isOfficial: true,
                communityEnabled: false,
                levelSubmissionEnabled: false,
                faviconUrl: null,
                logoUrl: null,
                topEnabled: true,
                itemSort: 'mode_default',
                mode: config.mode,
                rankBadges: [],
                recordScoreFormula: config.recordScoreFormula,
                weightFormula: config.weightFormula,
                ...recordFilterDefaults,
                lastRefreshedAt: null,
                updated_at: updatedAt,
                starCount: 0,
                starred: false,
                ownerData: null,
                item: {
                    created_at: createdAt,
                    rating: level.rating ?? null,
                    position: level.dlTop,
                    minProgress: level.minProgress ?? null,
                    videoID: null
                }
            })
        } else {
            const config = getOfficialListConfig('dl')
            entries.push({
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
                levelCount: 0,
                isPlatformer: false,
                isOfficial: true,
                communityEnabled: false,
                levelSubmissionEnabled: false,
                faviconUrl: null,
                logoUrl: null,
                topEnabled: false,
                itemSort: 'mode_default',
                mode: config.mode,
                rankBadges: [],
                recordScoreFormula: config.recordScoreFormula,
                weightFormula: config.weightFormula,
                ...recordFilterDefaults,
                lastRefreshedAt: null,
                updated_at: updatedAt,
                starCount: 0,
                starred: false,
                ownerData: null,
                item: {
                    created_at: createdAt,
                    rating: level.rating ?? null,
                    position: level.dlTop,
                    minProgress: level.minProgress ?? null,
                    videoID: null
                }
            })
        }
    }

    if (level.flTop != null) {
        const config = getOfficialListConfig('fl')
        entries.push({
            id: -4,
            slug: config.slug,
            owner: '',
            title: config.title,
            description: config.description,
            backgroundColor: null,
            bannerUrl: null,
            borderColor: null,
            visibility: 'public',
            tags: ['official'],
            levelCount: 0,
            isPlatformer: Boolean(level.isPlatformer),
            isOfficial: true,
            communityEnabled: false,
            levelSubmissionEnabled: false,
            faviconUrl: null,
            logoUrl: null,
            topEnabled: true,
            itemSort: 'mode_default',
            mode: config.mode,
            rankBadges: [],
            recordScoreFormula: config.recordScoreFormula,
            weightFormula: config.weightFormula,
            ...recordFilterDefaults,
            lastRefreshedAt: null,
            updated_at: updatedAt,
            starCount: 0,
            starred: false,
            ownerData: null,
            item: {
                created_at: createdAt,
                rating: level.flPt ?? null,
                position: level.flTop,
                minProgress: level.minProgress ?? null,
                videoID: null
            }
        })
    }

    return entries
}

export function mergeLevelListSummaries(officialLists: any[], remoteLists: any[]) {
    const remoteByKey = new Map(remoteLists.map((list) => [list.slug || String(list.id), list]))
    const mergedOfficial = officialLists.map((officialList) => {
        const key = officialList.slug || String(officialList.id)
        const remoteList = remoteByKey.get(key)

        if (!remoteList) {
            return officialList
        }

        return {
            ...officialList,
            ...remoteList,
            item: remoteList.item ?? officialList.item
        }
    })

    const seen = new Set(mergedOfficial.map((list) => list.slug || String(list.id)))
    const merged = [...mergedOfficial]

    for (const list of remoteLists) {
        const key = list.slug || String(list.id)

        if (seen.has(key)) {
            continue
        }

        seen.add(key)
        merged.push(list)
    }

    return merged
}

export async function getEligibleListsByLevel(levelId: number, progress?: number | null, viewerId?: string) {
    requireLevelId(levelId)

    const hasCandidateProgress = progress !== undefined && progress !== null
    const candidateProgress = hasCandidateProgress ? Number(progress) : null

    if (candidateProgress !== null && (!Number.isFinite(candidateProgress) || candidateProgress < 0)) {
        throw new ValidationError('Invalid progress')
    }

    const candidateRecord = candidateProgress == null ? null : { progress: candidateProgress }

    const [levelResult, listLevelsResult] = await Promise.all([
        supabase
            .from('levels')
            .select('id, created_at, rating, flPt, dlTop, flTop, minProgress, isChallenge, isPlatformer')
            .eq('id', levelId)
            .maybeSingle(),
        supabase
            .from('listLevels')
            .select('listId, created_at, rating, position, minProgress, videoID')
            .eq('levelId', levelId)
            .eq('accepted', true)
    ])

    if (levelResult.error) {
        throw new Error(levelResult.error.message)
    }

    if (listLevelsResult.error) {
        throw new Error(listLevelsResult.error.message)
    }

    const officialLists = levelResult.data
        ? getOfficialLevelListEntries(levelResult.data)
            .map((list) => ({
                ...list,
                eligible: candidateRecord
                    ? isEligibleRecordForListItem(candidateRecord, list.item, list.isPlatformer)
                    : null
            }))
        : []

    const listLevels = listLevelsResult.data || []
    const listIds = [...new Set(listLevels.map((entry) => entry.listId))]

    if (!listIds.length) {
        return officialLists
    }

    const listItemsById = new Map(listLevels.map((entry) => [entry.listId, entry]))
    const { data: lists, error: listsError } = await supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
        .eq('visibility', 'public')
        .in('id', listIds)
        .order('updated_at', { ascending: false })

    if (listsError) {
        throw new Error(listsError.message)
    }

    const remoteLists = normalizeCustomListMirrorStates(
        await enrichListsWithStars((lists || []) as CustomListWithOwnerData[], viewerId)
    )
        .map((list) => {
            const item = listItemsById.get(list.id) || null

            return {
                ...list,
                rankBadges: normalizeRankBadges((list as any).rankBadges),
                item,
                eligible: item && candidateRecord
                    ? isEligibleRecordForListItem(candidateRecord, item, list.isPlatformer)
                    : null
            }
        })

    return mergeLevelListSummaries(officialLists, remoteLists)
}


export async function addLevelToCustomList(listId: number, ownerId: CustomListActor, levelId: number, options: {
    createdAt?: unknown
} = {}) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(ownerId)
    const access = await assertCanEditListLevels(list, ownerId)

    const level = await ensureLevelExists(levelId)
    assertLevelTypeMatchesList(list, level)

    const itemInsert: CustomListLevelInsert = {
        listId,
        levelId,
        addedBy: actorUid,
        minProgress: null,
        accepted: true
    }

    if (list.mode === 'top') {
        await ensureStoredTopPositions(listId)

        const { count, error: countError } = await supabase
            .from('listLevels')
            .select('id', { count: 'exact', head: true })
            .eq('listId', listId)

        if (countError) {
            throw new Error(countError.message)
        }

        itemInsert.position = (count ?? 0) + 1
    }

    if (options.createdAt !== undefined) {
        itemInsert.created_at = sanitizeListLevelCreatedAt(options.createdAt)
    }

    const { error } = await supabase
        .from('listLevels')
        .insert(itemInsert)

    if (error) {
        if (error.code === '23505') {
            throw new ConflictError('Level already exists in this list')
        }

        throw new Error(error.message)
    }

    await syncLevelCount(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'level_added',
        metadata: {
            levelId
        }
    })

    return getCustomList(listId, ownerId)
}

export async function batchAddExistingLevelsToCustomList(listId: number, ownerId: CustomListActor, levelInputsInput: unknown) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(ownerId)
    const access = await assertCanEditListLevels(list, ownerId)
    const levelInputs = sanitizeBatchCustomListLevelInputs(levelInputsInput)

    if (!levelInputs.length) {
        return {
            added: 0,
            missingLevelIds: [] as number[],
            list: await getCustomList(listId, ownerId)
        }
    }

    const levelIds = levelInputs.map((levelInput) => levelInput.levelId)
    const { data: levels, error: levelsError } = await supabase
        .from('levels')
        .select('id, isPlatformer')
        .in('id', levelIds)

    if (levelsError) {
        throw new Error(levelsError.message)
    }

    const levelsById = new Map((levels || []).map((level) => [level.id, level]))
    const missingLevelIds = levelIds.filter((levelId) => !levelsById.has(levelId))

    for (const levelInput of levelInputs) {
        const level = levelsById.get(levelInput.levelId)

        if (!level) {
            continue
        }

        assertLevelTypeMatchesList(list, level)
    }

    const availableLevelIds = levelIds.filter((levelId) => levelsById.has(levelId))

    if (!availableLevelIds.length) {
        return {
            added: 0,
            missingLevelIds,
            list: await getCustomList(listId, ownerId)
        }
    }

    const { data: existingItems, error: existingItemsError } = await supabase
        .from('listLevels')
        .select('levelId')
        .eq('listId', listId)
        .in('levelId', availableLevelIds)

    if (existingItemsError) {
        throw new Error(existingItemsError.message)
    }

    const existingLevelIds = new Set((existingItems || []).map((item) => item.levelId))
    const insertInputs = levelInputs.filter((levelInput) => (
        levelsById.has(levelInput.levelId)
        && !existingLevelIds.has(levelInput.levelId)
    ))

    if (!insertInputs.length) {
        return {
            added: 0,
            missingLevelIds,
            list: await getCustomList(listId, ownerId)
        }
    }

    let nextPosition = 0

    if (list.mode === 'top') {
        await ensureStoredTopPositions(listId)

        const { count, error: countError } = await supabase
            .from('listLevels')
            .select('id', { count: 'exact', head: true })
            .eq('listId', listId)

        if (countError) {
            throw new Error(countError.message)
        }

        nextPosition = (count ?? 0) + 1
    }

    const itemInserts: CustomListLevelInsert[] = insertInputs.map((levelInput, index) => {
        const itemInsert: CustomListLevelInsert = {
            listId,
            levelId: levelInput.levelId,
            addedBy: actorUid,
            minProgress: null,
            accepted: true
        }

        if (list.mode === 'top') {
            itemInsert.position = nextPosition + index
        }

        if (levelInput.createdAt) {
            itemInsert.created_at = levelInput.createdAt
        }

        return itemInsert
    })

    const { error: insertError } = await supabase
        .from('listLevels')
        .insert(itemInserts)

    if (insertError) {
        if (insertError.code === '23505') {
            throw new ConflictError('One or more levels already exist in this list')
        }

        throw new Error(insertError.message)
    }

    await syncLevelCount(listId)

    for (const levelInput of insertInputs) {
        await appendCustomListAuditLog(listId, {
            actorUid: access.actorUid,
            action: 'level_added',
            metadata: {
                levelId: levelInput.levelId
            }
        })
    }

    return {
        added: insertInputs.length,
        missingLevelIds,
        list: await getCustomList(listId, ownerId)
    }
}

export async function removeLevelFromCustomList(listId: number, ownerId: CustomListActor, levelId: number) {
    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, ownerId)

    const { data, error } = await supabase
        .from('listLevels')
        .delete()
        .eq('listId', listId)
        .eq('levelId', levelId)
        .eq('accepted', true)
        .select('id')
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new NotFoundError('Level is not in this list')
    }

    if (list.mode === 'top') {
        await ensureStoredTopPositions(listId)
    }

    await syncLevelCount(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'level_removed',
        metadata: {
            levelId
        }
    })

    return getCustomList(listId, ownerId)
}

export async function updateListLevel(listId: number, ownerId: CustomListActor, levelId: number, patch: {
    rating?: unknown
    minProgress?: unknown
    videoID?: unknown
    videoId?: unknown
    createdAt?: unknown
    created_at?: unknown
}) {
    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, ownerId)

    const updates: Record<string, unknown> = {}

    if (patch.rating !== undefined) {
        updates.rating = sanitizeRating(patch.rating)
    }

    if (patch.minProgress !== undefined) {
        updates.minProgress = sanitizeMinProgress(patch.minProgress, list.isPlatformer)
    }

    const nextVideoID = patch.videoID !== undefined ? patch.videoID : patch.videoId

    if (nextVideoID !== undefined) {
        updates.videoID = sanitizeCustomListVideoId(nextVideoID)
    }

    const nextCreatedAt = patch.createdAt !== undefined ? patch.createdAt : patch.created_at

    if (nextCreatedAt !== undefined) {
        updates.created_at = sanitizeListLevelCreatedAt(nextCreatedAt)
    }

    if (!Object.keys(updates).length) {
        return getCustomList(listId, ownerId)
    }

    const { data, error } = await supabase
        .from('listLevels')
        .update(updates)
        .eq('listId', listId)
        .eq('levelId', levelId)
        .eq('accepted', true)
        .select('id')
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new NotFoundError('Level is not in this list')
    }

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'level_updated',
        metadata: {
            levelId,
            fields: Object.keys(updates)
        }
    })

    return getCustomList(listId, ownerId)
}

export async function reorderListLevels(listId: number, ownerId: CustomListActor, levelIds: unknown) {
    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, ownerId)

    if (list.mode !== 'top') {
        throw new ValidationError('Reordering is only available in top mode')
    }

    const sanitizedLevelIds = sanitizeLevelReorderIds(levelIds)

    await applyCustomListLevelOrder(listId, sanitizedLevelIds)

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'levels_reordered',
        metadata: {
            levelIds: sanitizedLevelIds
        }
    })

    return getCustomList(listId, ownerId)
}
