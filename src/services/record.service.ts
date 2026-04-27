import supabase from "@src/client/supabase";
import { getLevel, fetchLevelFromGD, retrieveOrCreateLevel } from "@src/services/level.service";
import { getPlayer } from "@src/services/player.service";
import { approved } from "@src/services/pointercrate.service";
import { addInventoryItem } from "@src/services/inventory.service";
import { getRecordPublicListStats } from "@src/services/custom-list.service";
import type { TRecord, TPlayer } from "@src/types";
import getVideoId from "get-video-id";
import logger from "@src/utils/logger";

function normalizeAcceptedManuallyFilter(value: unknown) {
    if (typeof value == 'string') {
        return value == 'true'
    }

    return Boolean(value)
}

function normalizeRangeIndex(value: unknown, fallback: number) {
    const parsed = Number.parseInt(String(value), 10)

    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback
}

function normalizeListIdFilter(value: unknown) {
    const rawValue = Array.isArray(value) ? value[0] : value
    const parsed = Number.parseInt(String(rawValue), 10)

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function applyRecordAcceptanceFilter(query: any, isChecked: boolean) {
    if (isChecked) {
        return query.or('acceptedManually.eq.true,acceptedAuto.eq.true')
    }

    return query
        .eq('acceptedAuto', false)
        .or('acceptedManually.is.null,acceptedManually.eq.false')
}

function withLegacyRecordAcceptance<T extends Record<string, any>>(record: T): T & { isChecked: boolean }
function withLegacyRecordAcceptance<T extends Record<string, any>>(record: T | null | undefined): (T & { isChecked: boolean }) | null
function withLegacyRecordAcceptance<T extends Record<string, any>>(record: T | null | undefined) {
    if (!record) {
        return record ?? null
    }

    return {
        ...record,
        isChecked: Boolean(record.acceptedManually) || Boolean(record.acceptedAuto)
    }
}

function withLegacyRecordAcceptanceList<T extends Record<string, any>>(records: T[] | null | undefined) {
    return (records || []).map((record) => withLegacyRecordAcceptance(record) as T & { isChecked: boolean })
}

async function getAcceptedListLevelIds(listId: number) {
    const { data, error } = await supabase
        .from('listLevels')
        .select('levelId')
        .eq('listId', listId)
        .eq('accepted', true)

    if (error) {
        throw new Error(error.message)
    }

    return [...new Set((data || []).map((entry) => Number(entry.levelId)).filter(Number.isFinite))]
}

async function withRecordPublicLists<T extends Record<string, any>>(records: T[]) {
    const levelIds = [...new Set(
        records
            .map((record) => Number(record.levelid ?? record.levels?.id))
            .filter(Number.isFinite)
    )]

    if (!levelIds.length) {
        return records.map((record) => ({ ...record, lists: [] }))
    }

    const { data, error } = await (supabase as any)
        .from('listLevels')
        .select('listId, levelId, lists!inner(id, slug, title, isOfficial, isVerified, isMirror, visibility)')
        .in('levelId', levelIds)
        .eq('accepted', true)
        .eq('lists.visibility', 'public')

    if (error) {
        throw new Error(error.message)
    }

    const listsByLevelId = new Map<number, any[]>()

    for (const entry of data || []) {
        const levelId = Number(entry.levelId)
        const list = Array.isArray(entry.lists) ? entry.lists[0] : entry.lists

        if (!Number.isFinite(levelId) || !list) {
            continue
        }

        const lists = listsByLevelId.get(levelId) || []

        lists.push(list)
        listsByLevelId.set(levelId, lists)
    }

    return records.map((record) => ({
        ...record,
        lists: listsByLevelId.get(Number(record.levelid ?? record.levels?.id)) || []
    }))
}

export type OverwatchRecordScope = 'official' | 'nonOfficial'

const OVERWATCH_RECORD_PAGE_SIZE = 100

async function getOfficialListLevelIds(levelIds: number[]) {
    const uniqueLevelIds = [...new Set(
        levelIds
            .map((levelId) => Number(levelId))
            .filter((levelId) => Number.isFinite(levelId))
    )]

    if (!uniqueLevelIds.length) {
        return new Set<number>()
    }

    const { data, error } = await (supabase as any)
        .from('listLevels')
        .select('levelId, lists!inner(isOfficial)')
        .in('levelId', uniqueLevelIds)
        .eq('accepted', true)
        .eq('lists.isOfficial', true)

    if (error) {
        throw new Error(error.message)
    }

    return new Set((data || []).map((row: any) => Number(row.levelId)))
}

export async function isOfficialListLevel(levelId: number) {
    const officialLevelIds = await getOfficialListLevelIds([levelId])

    return officialLevelIds.has(levelId)
}

function matchesOverwatchScope(isOfficialListRecord: boolean, scope: OverwatchRecordScope) {
    return scope === 'official' ? isOfficialListRecord : !isOfficialListRecord
}

function buildOverwatchRecordQuery(user: TPlayer) {
    return supabase
        .from('records')
        .select('*, levels!public_records_levelid_fkey!inner(*)')
        .neq('userid', user.uid!)
        .eq('needMod', false)
        .eq('acceptedAuto', false)
        .or('acceptedManually.is.null,acceptedManually.eq.false')
}

async function getAssignedOverwatchRecord(user: TPlayer) {
    const { data, error } = await supabase
        .from('records')
        .select('*, levels!public_records_levelid_fkey!inner(*)')
        .neq('userid', user.uid!)
        .eq('needMod', false)
        .eq('acceptedAuto', false)
        .or('acceptedManually.is.null,acceptedManually.eq.false')
        .eq('reviewer', user.uid!)
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

async function getAvailableOverwatchRecord(user: TPlayer, scope: OverwatchRecordScope) {
    for (let start = 0; ; start += OVERWATCH_RECORD_PAGE_SIZE) {
        const { data, error } = await buildOverwatchRecordQuery(user)
            .is('reviewer', null)
            .order('queueNo', { ascending: true, nullsFirst: false })
            .range(start, start + OVERWATCH_RECORD_PAGE_SIZE - 1)

        if (error) {
            throw new Error(error.message)
        }

        if (!data?.length) {
            break
        }

        const officialLevelIds = await getOfficialListLevelIds(data.map((record) => record.levelid))
        const record = data.find((record) => matchesOverwatchScope(officialLevelIds.has(record.levelid), scope))

        if (record) {
            return record
        }

        if (data.length < OVERWATCH_RECORD_PAGE_SIZE) {
            break
        }
    }

    return null
}

async function isLevelExists(id: number) {
    const { data, error } = await supabase
        .from('levels')
        .select('id')
        .eq('id', id)

    if (error || !data.length) {
        return false
    }

    return true
}

/**
 * Determine whether `candidate` is a strictly better record than `existing`.
 *
 * Ordering (best → worst):
 *   1. Progress: higher is better (for platformer levels, progress is the
 *      completion time in ms so lower is better).
 *   2. Refresh rate: lower is better. A missing refresh rate is treated as
 *      the worst (Infinity).
 *   3. Platform: mobile is better than PC.
 */
type ComparableRecord = Pick<TRecord, 'progress' | 'refreshRate' | 'mobile'>

function isBetterRecord(
    candidate: ComparableRecord,
    existing: ComparableRecord,
    isPlatformer: boolean
) {
    const newProgress = Number(candidate.progress ?? 0)
    const oldProgress = Number(existing.progress ?? 0)

    if (newProgress !== oldProgress) {
        return isPlatformer ? newProgress < oldProgress : newProgress > oldProgress
    }

    const newRefresh = Number.isFinite(Number(candidate.refreshRate))
        ? Number(candidate.refreshRate)
        : Number.POSITIVE_INFINITY
    const oldRefresh = Number.isFinite(Number(existing.refreshRate))
        ? Number(existing.refreshRate)
        : Number.POSITIVE_INFINITY

    if (newRefresh !== oldRefresh) {
        return newRefresh < oldRefresh
    }

    if (Boolean(candidate.mobile) !== Boolean(existing.mobile)) {
        return Boolean(candidate.mobile)
    }

    return false
}

function pickBestRecord<T extends ComparableRecord>(records: T[], isPlatformer: boolean) {
    return records.reduce<T | null>((bestRecord, record) => {
        if (!bestRecord || isBetterRecord(record, bestRecord, isPlatformer)) {
            return record
        }

        return bestRecord
    }, null)
}

async function getOrCreateLevelForRecord(levelid: number) {
    const levelExists = await isLevelExists(levelid)

    if (levelExists) {
        return await getLevel(levelid)
    }

    const apiLevel = await fetchLevelFromGD(levelid)

    await retrieveOrCreateLevel({
        id: levelid,
        name: apiLevel.name,
        creator: apiLevel.author,
        difficulty: apiLevel.difficulty ?? null,
        isPlatformer: apiLevel.length == 5,
        isChallenge: false,
        isNonList: false
    })

    return await getLevel(levelid)
}

export async function getDemonListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    isChecked = normalizeAcceptedManuallyFilter(isChecked)

    const { data, error } = await applyRecordAcceptanceFilter(supabase
        .from('records')
        .select('*')
        .not('dlPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end), isChecked)

    if (error) {
        throw new Error(error.message)
    }

    return withLegacyRecordAcceptanceList(data)
}

export async function getFeaturedListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    isChecked = normalizeAcceptedManuallyFilter(isChecked)

    const { data, error } = await applyRecordAcceptanceFilter(supabase
        .from('records')
        .select('*')
        .not('flPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end), isChecked)

    if (error) {
        throw new Error(error.message)
    }

    return withLegacyRecordAcceptanceList(data)
}

export async function getChallengeListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    isChecked = normalizeAcceptedManuallyFilter(isChecked)

    const { data, error } = await applyRecordAcceptanceFilter(supabase
        .from('records')
        .select('*')
        .not('clPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end), isChecked)

    if (error) {
        throw new Error(error.message)
    }

    return withLegacyRecordAcceptanceList(data)
}

export async function getPlayerRecordRating(uid: string) {
    const { data, error } = await supabase
        .from('records')
        .select('userid, progress, no, levels!public_records_levelid_fkey!inner(id, rating), dlPt')
        .eq('userid', uid)
        .or('acceptedManually.eq.true,acceptedAuto.eq.true')
        .not('dlPt', 'is', null)
        .order('no')

    if (error) {
        throw new Error(error.message)
    }

    const res = []

    for (const i of data) {
        res.push({ progress: i.progress, rating: i.levels?.rating! })
    }

    return res;
}

type PlayerRecordsQuery = {
    start?: string | number
    end?: string | number
    ascending?: string | boolean
    isChecked?: string | boolean
}

export async function getPlayerRecords(uid: string, { start = '0', end, ascending = 'false', isChecked = 'true' }: PlayerRecordsQuery = {}) {
    void isChecked

    const parsedStart = parseInt(String(start), 10)
    const hasEnd = end !== undefined && end !== null && String(end).trim() !== ''
    const parsedEnd = hasEnd ? parseInt(String(end), 10) : NaN
    const startIndex = Number.isFinite(parsedStart) ? Math.max(parsedStart, 0) : 0
    const endIndex = Number.isFinite(parsedEnd) ? Math.max(parsedEnd, startIndex) : null
    const isAscending = ascending == 'true' || ascending === true
    const applyRange = <T>(records: T[]) => endIndex === null
        ? records.slice(startIndex)
        : records.slice(startIndex, endIndex + 1)

    const { data, error } = await supabase
        .from('records')
        .select('*, levels!public_records_levelid_fkey!inner(*)')
        .eq('userid', uid)
        .or('acceptedManually.eq.true,acceptedAuto.eq.true')
        .order('acceptedManually', { ascending: false, nullsFirst: false })
        .order('timestamp', { ascending: isAscending, nullsFirst: false })

    if (error) {
        throw new Error(error.message)
    }

    return applyRange(withLegacyRecordAcceptanceList(data))
}

export async function getLevelRecords(id: number, { start = 0, end = 50, isChecked = true } = {}) {
    isChecked = normalizeAcceptedManuallyFilter(isChecked)

    const level = await getLevel(id)

    const { data, error } = await applyRecordAcceptanceFilter(supabase
        .from('records')
        .select('*, players!userid!inner(*, clans!id(*)), reviewer:players!reviewer(*, clans!id(*))')
        .eq('players.isHidden', false)
        .eq('levelid', id)
        .order('acceptedManually', { ascending: false, nullsFirst: false })
        .order('acceptedAuto', { ascending: false })
        .order('progress', { ascending: level.isPlatformer })
        .order('timestamp')
        .range(start, end), isChecked)

    if (error) {
        throw new Error(error.message)
    }

    return withLegacyRecordAcceptanceList(data)
}

async function withPublicListStats<T extends Record<string, any>>(record: T, includePublicListStats?: boolean) {
    if (!includePublicListStats) {
        return record
    }

    return {
        ...record,
        publicListStats: await getRecordPublicListStats(record)
    }
}

export async function getRecord(uid: string, levelID: number, options: { includePublicListStats?: boolean } = {}) {
    // Multiple rows may exist per (userid, levelid): one accepted and one
    // pending replacement. Prefer the accepted row so existing callers keep
    // seeing the "live" record; fall back to the pending one if that is all
    // that exists.
    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid(*, clans!id(*)), reviewer:players!reviewer(*, clans!id(*)), levels!public_records_levelid_fkey(*)')
        .eq('levelid', levelID)
        .eq('userid', uid)
        .order('acceptedManually', { ascending: false, nullsFirst: false })
        .order('acceptedAuto', { ascending: false })
        .order('timestamp', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error('Record not found')
    }

    // @ts-ignore
    return withPublicListStats(withLegacyRecordAcceptance(data) as any, options.includePublicListStats)
}

export async function getAcceptedRecords(uid: string, levelID: number) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('levelid', levelID)
        .eq('userid', uid)
        .or('acceptedManually.eq.true,acceptedAuto.eq.true')
        .order('acceptedManually', { ascending: false, nullsFirst: false })
        .order('acceptedAuto', { ascending: false })
        .order('timestamp', { ascending: true })

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    return data ?? []
}

/**
 * Return the preferred accepted record for the (uid, levelID) pair, or null if
 * none exists. Manual acceptance is preferred when a manual and auto accepted
 * record coexist.
 */
export async function getAcceptedRecord(uid: string, levelID: number) {
    const records = await getAcceptedRecords(uid, levelID)

    return records[0] ?? null
}

export async function getBestAcceptedRecord(uid: string, levelID: number, isPlatformer: boolean) {
    const records = await getAcceptedRecords(uid, levelID)

    return pickBestRecord(records, isPlatformer)
}

export async function getManuallyAcceptedRecord(uid: string, levelID: number) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('levelid', levelID)
        .eq('userid', uid)
        .eq('acceptedManually', true)
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    return data ?? null
}

export async function getAutoAcceptedRecord(uid: string, levelID: number) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('levelid', levelID)
        .eq('userid', uid)
        .eq('acceptedAuto', true)
        .or('acceptedManually.is.null,acceptedManually.eq.false')
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    return data ?? null
}

async function deleteRecordById(recordId: number) {
    const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', recordId)

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }
}

export async function removeSupersededAcceptedVersions(recordData: Pick<TRecord, 'id' | 'userid' | 'levelid' | 'acceptedManually'>) {
    if (!recordData.acceptedManually || !recordData.id || !recordData.userid || !recordData.levelid) {
        return
    }

    const levelID = Number(recordData.levelid)
    const [previousAccepted, autoAcceptedRecord] = await Promise.all([
        getManuallyAcceptedRecord(recordData.userid, levelID),
        getAutoAcceptedRecord(recordData.userid, levelID)
    ])
    const recordIdsToDelete = new Set<number>()

    if (previousAccepted && previousAccepted.id !== recordData.id) {
        recordIdsToDelete.add(previousAccepted.id)
    }

    if (autoAcceptedRecord && autoAcceptedRecord.id !== recordData.id) {
        recordIdsToDelete.add(autoAcceptedRecord.id)
    }

    for (const recordId of recordIdsToDelete) {
        await deleteRecordById(recordId)
    }
}

/**
 * Return the single pending record for the (uid, levelID) pair, or null if
 * none exists. A pending record has both `acceptedManually` and
 * `acceptedAuto` false. Uniqueness is guaranteed by a partial unique index.
 */
export async function getPendingRecord(uid: string, levelID: number) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('levelid', levelID)
        .eq('userid', uid)
        .eq('acceptedAuto', false)
        .or('acceptedManually.is.null,acceptedManually.eq.false')
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    return data ?? null
}

export async function upsertDeathCountAutoRecord({
    userid,
    levelid,
    progress,
    mobile = false,
    refreshRate = 60
}: {
    userid: string
    levelid: number
    progress: number
    mobile?: boolean
    refreshRate?: number | null
}) {
    const level = await getOrCreateLevelForRecord(levelid)
    const acceptedRecords = await getAcceptedRecords(userid, levelid)
    const bestAcceptedRecord = pickBestRecord(acceptedRecords, Boolean(level.isPlatformer))
    const normalizedRefreshRate = Number.isFinite(Number(refreshRate)) ? Number(refreshRate) : 60
    const candidate = {
        progress,
        refreshRate: normalizedRefreshRate,
        mobile: Boolean(mobile)
    }

    if (bestAcceptedRecord && !isBetterRecord(candidate, bestAcceptedRecord, Boolean(level.isPlatformer))) {
        return { changed: false, reason: 'not_better' as const }
    }

    const autoAcceptedRecord = acceptedRecords.find((record) => Boolean(record.acceptedAuto) && !Boolean(record.acceptedManually))
    const sourceLabel = 'Submitted via Death Count'
    const recordData: TRecord = {
        userid,
        levelid,
        progress,
        refreshRate: normalizedRefreshRate,
        mobile: Boolean(mobile),
        timestamp: Date.now(),
        videoLink: sourceLabel,
        raw: sourceLabel,
        acceptedManually: false,
        acceptedAuto: true,
        needMod: false,
        queueNo: null,
        reviewer: null,
        reviewerComment: null
    } as any

    if (autoAcceptedRecord) {
        recordData.id = autoAcceptedRecord.id
    }

    const { data, error } = await supabase
        .from('records')
        .upsert(recordData as any)
        .select('*')
        .single()

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    return { changed: true, record: data }
}

export async function getRecordById(id: number, options: { includePublicListStats?: boolean } = {}) {
    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid(*, clans!id(*)), reviewer:players!reviewer(*, clans!id(*)), levels!public_records_levelid_fkey(*)')
        .eq('id', id)
        .limit(1)
        .single()

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error('Record not found')
    }

    // @ts-ignore
    return withPublicListStats(withLegacyRecordAcceptance(data) as any, options.includePublicListStats)
}


export async function retrieveRecord(user: TPlayer, scope: OverwatchRecordScope = 'official') {
    const assignedRecord = await getAssignedOverwatchRecord(user)

    if (assignedRecord) {
        return assignedRecord
    }

    const res = await getAvailableOverwatchRecord(user, scope)

    if (res == null) {
        throw new Error("No available record")
    }

    const record = await getRecordById(res.id)

    if (!record) {
        throw new Error('Record not found')
    }

    // @ts-ignore
    record.reviewer = res.reviewer = user.uid!
    record.queueNo = null

    const { players, levels, ...updData } = record

    await updateRecord(updData)

    return withLegacyRecordAcceptance(record)
}

export async function getRecords({ start = 0, end = 50, isChecked = false, listId = undefined } = {}) {
    isChecked = normalizeAcceptedManuallyFilter(isChecked)

    const rangeStart = normalizeRangeIndex(start, 0)
    const rangeEnd = Math.max(rangeStart, normalizeRangeIndex(end, 50))
    const selectedListId = normalizeListIdFilter(listId)
    let query = supabase
        .from('records')
        .select('*, players!userid!inner(*, clans!id(*)), reviewer:players!reviewer(*), levels!public_records_levelid_fkey(*)')
        .eq('players.isHidden', false)

    if (selectedListId !== null) {
        const levelIds = await getAcceptedListLevelIds(selectedListId)

        if (!levelIds.length) {
            return []
        }

        query = query.in('levelid', levelIds)
    }

    const { data, error } = await applyRecordAcceptanceFilter(query, isChecked)
        .order('queueNo', { ascending: true, nullsFirst: false })
        .order('timestamp', { ascending: true })
        .range(rangeStart, rangeEnd)

    if (error) {
        throw new Error(error.message)
    }

    return withRecordPublicLists(withLegacyRecordAcceptanceList(data))
}

export async function getPlayerSubmissions(uid: string, { start = '0', end = '50', ascending = 'true' } = {}) {
    const { data, error } = await supabase
        .from('records')
        .select('*, levels!public_records_levelid_fkey(*)')
        .eq('userid', uid)
        .eq('acceptedAuto', false)
        .or('acceptedManually.is.null,acceptedManually.eq.false')
        .order('timestamp', { ascending: ascending == 'true' })
        .range(parseInt(start), parseInt(end))

    if (error) {
        throw new Error(error.message)
    }

    return withLegacyRecordAcceptanceList(data)
}

export async function getEstimatedQueue(userID: string, levelID: number, prioritizedBy: number) {
    const prioritizedDate = new Date(prioritizedBy).toISOString()
    const { data, error } = await supabase
        .rpc('get_queue_no', {
            userid: userID,
            levelid: levelID,
            p: prioritizedBy
        })

    if (error) {
        throw new Error(error.message)
    }

    if(data == null) {
        return 1;
    }

    return data + 1
}

export async function changeSuggestedRating(uid: string, levelID: number, rating: number) {
    const { data, error } = await supabase
        .from('records')
        .update({ suggestedRating: rating })
        .eq('levelid', levelID)
        .eq('userid', uid)

    if (error) {
        throw new Error(error.message)
    }
}

export async function submitRecord(recordData: TRecord) {
    const logs: string[] = [];

    try {
        logs.push(`Starting with recordData: ${JSON.stringify(recordData, null, 2)}`);

        const levelExists = await isLevelExists(recordData.levelid!);
        logs.push(`Level exists check: ${levelExists}`);

        if (!levelExists) {
            logs.push(`Fetching level from GD, levelID: ${recordData.levelid}`);
            let apiLevel = await fetchLevelFromGD(recordData.levelid!)
            logs.push(`Fetched GD level: ${JSON.stringify(apiLevel, null, 2)}`);

            if (apiLevel.length != 5 && apiLevel.difficulty != 'Extreme Demon' && apiLevel.difficulty != 'Insane Demon') {
                logs.push(`Level not hard enough. Length: ${apiLevel.length}, Difficulty: ${apiLevel.difficulty}`);
                throw {
                    en: 'Level is not hard enough',
                    vi: 'Level không đủ khó'
                }
            }

            logs.push('Creating level in database from GD payload');
            await retrieveOrCreateLevel({
                id: recordData.levelid!,
                name: apiLevel.name,
                creator: apiLevel.author,
                difficulty: apiLevel.difficulty ?? null,
                isPlatformer: apiLevel.length == 5,
                isChallenge: false,
                isNonList: false
            })
            logs.push('Level created successfully');
        }

        // Check if the submitted level is a variant of another level
        logs.push(`Checking if level ${recordData.levelid} is a variant`);
        const submittedLevel = await getLevel(recordData.levelid!);
        if (submittedLevel && (submittedLevel as any).main_level_id) {
            const mainLevelId = (submittedLevel as any).main_level_id;
            logs.push(`Level ${recordData.levelid} is a variant of main level ${mainLevelId}`);
            // Save variant_id for reference and redirect record to main level
            ;(recordData as any).variant_id = recordData.levelid;
            recordData.levelid = mainLevelId;
            logs.push(`Record redirected to main level ${mainLevelId}, variant_id saved as ${(recordData as any).variant_id}`);
        }

        logs.push(`Getting level data for levelID: ${recordData.levelid}`);
        const level = await getLevel(recordData.levelid!)
        logs.push(`Level data: ${JSON.stringify(level, null, 2)}`);

        logs.push(`Getting player data for userID: ${recordData.userid}`);
        const player = await getPlayer(recordData.userid)
        logs.push(`Player data: ${JSON.stringify(player, null, 2)}`);

        // Look up accepted rows and any in-flight pending replacement
        // independently. Auto-accepted rows should be preserved, but they do
        // not block a new submission the way a manually accepted record does.
        const acceptedRecords = await getAcceptedRecords(recordData.userid!, recordData.levelid!)
        const manuallyAcceptedRecord = acceptedRecords.find((record) => Boolean(record.acceptedManually)) ?? null
        const pendingRecord = await getPendingRecord(recordData.userid!, recordData.levelid!)
        logs.push(`Accepted records: ${JSON.stringify(acceptedRecords)}`)
        logs.push(`Manually accepted record: ${JSON.stringify(manuallyAcceptedRecord)}`)
        logs.push(`Pending record: ${JSON.stringify(pendingRecord)}`)

        const betterRecordError = {
            en: 'Better record is submitted',
            vi: 'Đã có bản ghi tốt hơn'
        }

        // A manually accepted record still blocks a worse submission. Auto-
        // accepted rows remain submit-overridable, but any accepted row means
        // the new submission should stay pending until a reviewer resolves it.
        if (manuallyAcceptedRecord && !isBetterRecord(recordData, manuallyAcceptedRecord as any, level.isPlatformer!)) {
            logs.push('Manually accepted record exists and new submission is not better')
            throw betterRecordError
        }

        if (acceptedRecords.length > 0) {
            if (manuallyAcceptedRecord) {
                logs.push('Accepted record exists and manual record gate passed')
            } else {
                logs.push('Only auto-accepted record exists; allowing pending submission alongside it')
            }

            if (!manuallyAcceptedRecord && pendingRecord) {
                logs.push('Accepted auto-only record exists alongside a pending replacement')
            }

            if (!manuallyAcceptedRecord && !pendingRecord) {
                logs.push('Creating a new pending submission while preserving the auto-accepted record')
            }

            if (!manuallyAcceptedRecord && pendingRecord && !isBetterRecord(recordData, pendingRecord as any, level.isPlatformer!)) {
                logs.push('Pending replacement exists and new submission is not better than it')
                throw betterRecordError
            }

            // If a previous pending replacement exists, allow it to be
            // refined only if the new submission is strictly better than it.
            if (manuallyAcceptedRecord && pendingRecord && !isBetterRecord(recordData, pendingRecord as any, level.isPlatformer!)) {
                logs.push('Pending replacement exists and new submission is not better than it')
                throw betterRecordError
            }

            const nextData: TRecord = {
                ...recordData,
                acceptedManually: false,
                acceptedAuto: false,
                // Reuse the pending row id if we are replacing an in-flight
                // pending submission; otherwise insert a brand-new row
                // alongside the accepted one.
                id: pendingRecord ? (pendingRecord as any).id : undefined
            } as any

            // Skip Pointercrate auto-acceptance here: replacing an accepted
            // record always requires human review.
            const updateLogs = await updateRecord(nextData, true, false)
            logs.push(...updateLogs)
            logs.push('Pending replacement stored; accepted record versions preserved')
            return { logs }
        }

        // No accepted record. If a pending one exists, ensure the new
        // submission is strictly better before replacing it, mirroring the
        // "no downgrade" rule.
        if (pendingRecord) {
            if (!isBetterRecord(recordData, pendingRecord as any, level.isPlatformer!)) {
                logs.push('Pending record exists and new submission is not better')
                throw betterRecordError
            }

            const nextData: TRecord = {
                ...recordData,
                id: (pendingRecord as any).id
            } as any

            return await submitNewOrReplacePending(nextData, level, player, logs)
        }

        // No existing record at all: fresh submission.
        return await submitNewOrReplacePending(recordData, level, player, logs)
    } catch (error) {
        logs.push(`Error occurred: ${JSON.stringify(error)}`);
        throw {
            ...(typeof error === 'object' && error !== null ? error : {}),
            logs
        }
    }
}

// Helper that performs the original "insert/replace pending then optionally
// Pointercrate-auto-accept" flow. Used when there is no currently-accepted
// record to protect.
async function submitNewOrReplacePending(recordData: TRecord, level: any, player: TPlayer, logs: string[]) {
    logs.push(`Player pointercrate: ${player.pointercrate}`)

    // Baseline: a fresh submission is pending — both acceptance flags false.
    const baseData: TRecord = {
        ...recordData,
        acceptedManually: false,
        acceptedAuto: false
    } as any

    if (player.pointercrate) {
        logs.push(`Checking Pointercrate approval for: ${player.pointercrate}, ${level.name}`)

        try {
            const apv = await approved(player.pointercrate, level.name!)
            logs.push(`Pointercrate approval result: ${apv}`)
            // Pointercrate verification is an automatic accept.
            const autoAcceptedData: TRecord = { ...baseData, acceptedAuto: Boolean(apv) } as any
            const updateLogs = await updateRecord(autoAcceptedData, true)
            logs.push(...updateLogs)
            logs.push(`Record updated with Pointercrate approval: ${apv}`)
        } catch (err) {
            logs.push(`Failed to fetch from Pointercrate: ${JSON.stringify(err)}`)
            logs.push('Updating record without Pointercrate check')
            const updateLogs = await updateRecord(baseData, true)
            logs.push(...updateLogs)
            logs.push('Record updated')
        }
    } else {
        logs.push('Updating record without Pointercrate check')
        const updateLogs = await updateRecord(baseData, true)
        logs.push(...updateLogs)
        logs.push('Record updated')
    }

    return { logs }
}

export async function validateRecord(recordData: TRecord) {
    const logs: string[] = [];
    const logMsg = `Starting validation for record: levelId=${recordData.levelid}, userId=${recordData.userid}, progress=${recordData.progress}`;
    logs.push(logMsg);

    if (!recordData.videoLink) {
        const logMsg = `Validation failed: Missing video link for levelId=${recordData.levelid}`;
        logs.push(logMsg);
        throw {
            en: "Missing video's link",
            vi: "Thiếu liên kết video"
        }
    }

    const level = await getLevel(recordData.levelid!)
    const { id, service } = getVideoId(recordData.videoLink)

    if (!id || !service) {
        const logMsg = `Validation failed: Invalid video link - ${recordData.videoLink}`;
        logs.push(logMsg);
        throw {
            en: "Invalid video's link",
            vi: "Liên kết video không hợp lệ"
        }
    }

    if (service != 'youtube') {
        const logMsg = `Validation failed: Video service is ${service}, not YouTube - ${recordData.videoLink}`;
        logs.push(logMsg);
        throw {
            en: "Video's link is not YouTube",
            vi: "Liên kết video không phải YouTube"
        }
    }

    const validatedMsg = `Video validated: id=${id}, service=${service}`;
    logs.push(validatedMsg);

    const video: any = await (
        (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.GOOGLE_API_KEY}`)).json()
    )

    const name = level.name!.toLowerCase()
    const title: string = video.items[0].snippet.title.toLowerCase()
    const desc: string = video.items[0].snippet.description.toLowerCase()

    if (!title.includes(name) && !desc.includes(name)) {
        const logMsg = `Validation failed: Level name "${level.name}" not found in video title or description`;
        logs.push(logMsg);
        throw {
            en: "Level's name is not in the title or description of the video",
            vi: "Tên level không có trong tiêu đề hay mô tả của video"
        }
    }

    if (recordData.progress == 100 && !level.isPlatformer) {
        const logMsg = `Validation successful: 100% progress on non-platformer level ${level.name}`;
        logs.push(logMsg);
        return logs;
    }

    if (!level.isPlatformer && !title.includes(recordData.progress!.toString()) && !desc.includes(recordData.progress!.toString())) {
        const logMsg = `Validation failed: Progress ${recordData.progress}% not found in video title or description`;
        logs.push(logMsg);
        throw {
            en: "Progress is not 100% and is not in the title or description of the video",
            vi: "Tiến độ không phải 100% và không có trong tiêu đề hay mô tả của video"
        }
    }

    const successMsg = `Validation successful for record: levelId=${recordData.levelid}, progress=${recordData.progress}%`;
    logs.push(successMsg);
    return logs;
}

export async function updateRecord(recordData: TRecord, validate = false, accepted: boolean | null = null) {
    const logs: string[] = [];

    const nextRecordData = { ...(recordData as Record<string, unknown>) } as TRecord & {
        isChecked?: boolean | null
    }

    if (validate) {
        const validationLogs = await validateRecord(nextRecordData);
        logs.push(...validationLogs);
    }

    if (nextRecordData.acceptedManually === undefined && nextRecordData.isChecked !== undefined) {
        nextRecordData.acceptedManually = nextRecordData.isChecked;
    }

    if (accepted !== null) {
        nextRecordData.acceptedManually = accepted;
    }

    delete nextRecordData.isChecked;

    await removeSupersededAcceptedVersions(nextRecordData)

    const { error } = await supabase
        .from('records')
        .upsert(nextRecordData as any)

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    return logs;
}

export async function deleteRecord(userid: string, levelid: number, recordId?: number) {
    // When a record id is provided, delete exactly that row. Otherwise prefer
    // deleting the pending replacement (if one exists) so the accepted record
    // is preserved — this matches the "reject" semantics where the old
    // accepted record should remain after a bad submission is removed.
    let targetId = recordId ?? null

    if (!targetId) {
        const pending = await getPendingRecord(userid, levelid)
        targetId = pending ? (pending as any).id : null
    }

    if (!targetId) {
        const accepted = await getAcceptedRecord(userid, levelid)
        targetId = accepted ? (accepted as any).id : null
    }

    if (!targetId) {
        throw {
            en: 'Record not found',
            vi: 'Không tìm thấy bản ghi'
        }
    }

    const { data: row, error: fetchError } = await supabase
        .from('records')
        .select('prioritizedBy')
        .eq('id', targetId)
        .limit(1)
        .maybeSingle()

    if (fetchError) {
        throw {
            en: fetchError.message,
            vi: fetchError.message
        }
    }

    const prioritizedBy = row?.prioritizedBy ?? 0

    if (prioritizedBy && prioritizedBy > 0) {
        const days = Math.floor(prioritizedBy / (1000 * 60 * 60 * 24))

        if (days > 0) {
            await addInventoryItem({
                userID: userid,
                itemId: 15,
                quantity: days
            })
        }
    }

    const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', targetId)

    if (error) {
        throw {
            en: error.message,
            vi: error.message
        }
    }
}

export async function prioritizeRecord(userID: string, levelID: number, ms: number) {
    const record = await getRecord(userID, levelID)
    const { error } = await supabase
        .from('records')
        .update({
            prioritizedBy: record.prioritizedBy + ms
        })
        .match({ userid: userID, levelid: levelID })

    if (error) {
        throw new Error(error.message);
    }
}