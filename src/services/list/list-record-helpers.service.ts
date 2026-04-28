import type {
    CustomList,
    CustomListRecordFilterSettings
} from './list.common'
import {
    CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE,
    evaluateRecordScoreFormulaExpression,
    evaluateWeightFormulaExpression,
    isCustomListRecordEligibleForFilters,
    supabase
} from './list.common'

export function getEffectiveMinProgress(item: any) {
    return item.minProgress ?? item.level?.minProgress ?? null
}

export function getEffectiveVideoID(item: any) {
    return item.videoID ?? item.level?.videoID ?? null
}

export function getNormalizedListPosition(item: any, index: number, _isSyntheticOfficialList: boolean) {
    if (item.position == null) {
        return index + 1
    }

    return Number(item.position)
}

export async function ensureStoredTopPositions(listId: number) {
    const { data, error } = await supabase
        .from('listLevels')
        .select('id, position, created_at')
        .eq('listId', listId)
        .eq('accepted', true)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    const items = data || []

    if (!items.length) {
        return
    }

    const updates = items
        .map((item, index) => ({
            id: item.id,
            position: index + 1,
            shouldUpdate: Number(item.position) !== index + 1
        }))
        .filter((item) => item.shouldUpdate)

    if (!updates.length) {
        return
    }

    const results = await Promise.all(
        updates.map((item) =>
            supabase
                .from('listLevels')
                .update({ position: item.position })
                .eq('id', item.id)
        )
    )

    for (const result of results) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }
}

export async function ensureStoredRatingPositions(listId: number) {
    const { data, error } = await supabase
        .from('listLevels')
        .select('id, rating, position, created_at')
        .eq('listId', listId)
        .eq('accepted', true)
        .order('rating', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    const items = data || []

    if (!items.length) {
        return
    }

    let pos = 1
    let prevRating: number | null = null

    const updates = items
        .map((item, index) => {
            if (index === 0) {
                pos = 1
            } else if (Number(item.rating) !== prevRating) {
                pos++
            }
            prevRating = Number(item.rating)
            return {
                id: item.id,
                position: pos,
                shouldUpdate: Number(item.position) !== pos
            }
        })
        .filter((item) => item.shouldUpdate)

    if (!updates.length) {
        return
    }

    const results = await Promise.all(
        updates.map((item) =>
            supabase
                .from('listLevels')
                .update({ position: item.position })
                .eq('id', item.id)
        )
    )

    for (const result of results) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }
}

export function getItemIsPlatformer(item: any, fallbackIsPlatformer: boolean) {
    return Boolean(item.level?.isPlatformer ?? fallbackIsPlatformer)
}

export function getRecordAcceptancePriority(record: { acceptedManually?: boolean | null; acceptedAuto?: boolean | null } | null | undefined) {
    if (record?.acceptedManually) {
        return 2
    }

    return record?.acceptedAuto ? 1 : 0
}

export function isBetterRecordForListItem(
    candidate: { progress?: number | null; acceptedManually?: boolean | null; acceptedAuto?: boolean | null } | null | undefined,
    existing: { progress?: number | null; acceptedManually?: boolean | null; acceptedAuto?: boolean | null } | null | undefined,
    item: any,
    isPlatformer: boolean
) {
    if (!candidate) {
        return false
    }

    if (!existing) {
        return true
    }

    const candidateProgress = Number(candidate.progress)
    const existingProgress = Number(existing.progress)

    if (!Number.isFinite(candidateProgress)) {
        return false
    }

    if (!Number.isFinite(existingProgress)) {
        return true
    }

    const candidateAcceptancePriority = getRecordAcceptancePriority(candidate)
    const existingAcceptancePriority = getRecordAcceptancePriority(existing)

    if (candidateAcceptancePriority !== existingAcceptancePriority) {
        return candidateAcceptancePriority > existingAcceptancePriority
    }

    return getItemIsPlatformer(item, isPlatformer)
        ? candidateProgress < existingProgress
        : candidateProgress > existingProgress
}

export function isEligibleRecordForListItem(
    record: { progress?: number | null } | null | undefined,
    item: any,
    isPlatformer: boolean,
    options?: {
        ignorePlatformerMinProgress?: boolean
    }
) {
    if (!record) {
        return false
    }

    const progress = Number(record.progress)

    if (!Number.isFinite(progress)) {
        return false
    }

    const minProgress = getEffectiveMinProgress(item)
    const itemIsPlatformer = getItemIsPlatformer(item, isPlatformer)

    if (itemIsPlatformer && options?.ignorePlatformerMinProgress) {
        return true
    }

    if (minProgress == null) {
        return true
    }

    return itemIsPlatformer ? progress <= minProgress : progress >= minProgress
}

export function roundCustomListSnapshotValue(value: number, digits: number = 3) {
    const factor = 10 ** digits
    const rounded = Math.round(value * factor) / factor

    return Object.is(rounded, -0) ? 0 : rounded
}

export function getCustomListRecordFormulaBaseScope(
    list: any,
    item: any,
    itemIndex: number,
    levelCount: number,
    record: { progress?: number | null }
) {
    const progress = Math.max(0, Number(record.progress) || 0)
    const minProgress = Number(getEffectiveMinProgress(item) ?? 0)

    return {
        levelCount,
        top: getNormalizedListPosition(item, itemIndex, list.id < 0),
        rating: Number(item.rating ?? item.level?.rating ?? 0),
        time: progress,
        baseTime: minProgress,
        minProgress,
        progress
    }
}

export function getCustomListRecordScore(
    list: any,
    item: any,
    itemIndex: number,
    levelCount: number,
    record: { progress?: number | null }
) {
    const score = evaluateRecordScoreFormulaExpression(
        list.recordScoreFormula || '1',
        getCustomListRecordFormulaBaseScope(list, item, itemIndex, levelCount, record)
    )

    return score
}

export function getCustomListRecordPoint(
    list: any,
    item: any,
    itemIndex: number,
    position: number,
    levelCount: number,
    record: { progress?: number | null },
    score: number
) {
    const recordPoint = evaluateWeightFormulaExpression(list.weightFormula || '1', {
        ...getCustomListRecordFormulaBaseScope(list, item, itemIndex, levelCount, record),
        score,
        position
    })

    return roundCustomListSnapshotValue(recordPoint)
}

export async function enrichItemsWithViewerEligibleRecords(
    items: any[],
    list: Pick<CustomList, 'isPlatformer'> & CustomListRecordFilterSettings,
    viewerId?: string
) {
    if (!viewerId || !items.length) {
        return items
    }

    const levelIds = [...new Set(items.map((item) => item.levelId))]
    const itemsByLevelId = new Map(items.map((item) => [item.levelId, item]))

    if (!levelIds.length) {
        return items
    }

    const recordsByLevelId = new Map<number, any>()

    for (let start = 0; ; start += CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
        const end = start + CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE - 1
        const { data, error } = await supabase
            .from('records')
            .select('levelid, progress, acceptedManually, acceptedAuto, mobile, refreshRate')
            .eq('userid', viewerId)
            .in('levelid', levelIds)
            .range(start, end)

        if (error) {
            throw new Error(error.message)
        }

        if (!data?.length) {
            break
        }

        for (const record of data) {
            const item = itemsByLevelId.get(record.levelid)

            if (!item) {
                continue
            }

            if (!isCustomListRecordEligibleForFilters(record, list)) {
                continue
            }

            const existingRecord = recordsByLevelId.get(record.levelid)

            if (isBetterRecordForListItem(record, existingRecord, item, list.isPlatformer)) {
                recordsByLevelId.set(record.levelid, record)
            }
        }

        if (data.length < CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
            break
        }
    }

    return items.map((item) => {
        const record = recordsByLevelId.get(item.levelId)
        const eligibleRecord = isEligibleRecordForListItem(record, item, list.isPlatformer)
            ? {
                acceptedAuto: Boolean(record?.acceptedAuto),
                acceptedManually: Boolean(record?.acceptedManually),
                isChecked: Boolean(record?.acceptedManually) || Boolean(record?.acceptedAuto),
                progress: Number(record?.progress) || 0
            }
            : null

        if (!item.level) {
            return item
        }

        return {
            ...item,
            level: {
                ...item.level,
                record: eligibleRecord
            }
        }
    })
}
