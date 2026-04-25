import supabase from "@src/client/supabase"
import { getGJDailyLevel, getGJLevels21 } from '@src/services/gd-api.service'
import { addChangelog } from '@src/services/changelog.service'
import { refreshDailyLevelProgress, refreshWeeklyLevelProgress, getActiveseason, getSeasonLevelByType, addSeasonLevel, updateSeasonLevel } from '@src/services/battlepass.service'
import type { TLevel } from "@src/types"
import type { TablesInsert } from "@src/types/supabase"
import { buildFullTextSearchParams } from '@src/utils/full-text-search'

export async function fetchLevels(list: string) {
    let query = supabase
        .from('levels')
        .select('*, levelsTags(levelTags(*))')
        .not(list === 'fl' ? 'flTop' : 'dlTop', 'is', null)
        .order('created_at', { ascending: false })
        .range(0, 9)

    if (list === 'cl') {
        query = query.eq('isChallenge', true)
    } else if (list === 'pl') {
        query = query.eq('isPlatformer', true).eq('isChallenge', false)
    } else if (list === 'dl') {
        query = query.eq('isPlatformer', false).eq('isChallenge', false)
    }

    const { data, error } = await query

    if (error) return []

    return data
}

function convertToIDArray(levels: TLevel[]) {
    let res: number[] = []

    for (const i of levels) {
        res.push(i.id!)
    }

    return res
}

export async function getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '', tagIds = '', searchType }: { start?: number, end?: number, sortBy?: string, ascending?: boolean | string, uid?: string, topStart?: number | string | null, topEnd?: number | string | null, ratingMin?: number | string | null, ratingMax?: number | string | null, nameSearch?: string, creatorSearch?: string, tagIds?: string, searchType?: string } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const nameSearchParams = buildFullTextSearchParams(nameSearch, searchType)
    const creatorSearchParams = buildFullTextSearchParams(creatorSearch, searchType)

    // Pre-filter: get level IDs that have matching tags
    let tagFilteredIds: number[] | null = null
    if (tagIds && tagIds.trim() !== '') {
        const ids = tagIds.split(',').map(Number).filter(Boolean)
        if (ids.length > 0) {
            const { data: tagRows, error: tagError } = await (supabase as any)
                .from('levelsTags')
                .select('level_id')
                .in('tag_id', ids)
            if (tagError) throw tagError
            tagFilteredIds = [...new Set((tagRows || []).map((r: any) => r.level_id))] as number[]
            if (tagFilteredIds.length === 0) return []
        }
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levelsTags(tag_id, levelTags(id, name, color))')
        .not('dlTop', 'is', null)
        .eq('isPlatformer', false)
        .eq('isChallenge', false)
        .eq('isNonList', false)

    // Apply filters
    if (topStart !== null && topStart !== '') {
        query = query.gte('dlTop', topStart)
    }
    if (topEnd !== null && topEnd !== '') {
        query = query.lte('dlTop', topEnd)
    }
    if (ratingMin !== null && ratingMin !== '') {
        query = query.gte('rating', ratingMin)
    }
    if (ratingMax !== null && ratingMax !== '') {
        query = query.lte('rating', ratingMax)
    }
    if (nameSearchParams) {
        query = query.textSearch('nameFts', nameSearchParams.query, nameSearchParams.options)
    }
    if (creatorSearchParams) {
        query = query.textSearch('creatorFts', creatorSearchParams.query, creatorSearchParams.options)
    }

    // Filter by tag IDs: only include levels that have at least one matching tag
    if (tagFilteredIds !== null) {
        query = query.in('id', tagFilteredIds)
    }

    const a = await query
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (a.error || !a.data) {
        throw a.error
    }

    for (const i of a.data) {
        (i as any).record = null
    }

    if (!uid) {
        return a.data
    }

    const IDs = convertToIDArray(a.data);

    var b = await supabase
        .from('records')
        .select('levelid, userid, progress, acceptedManually, acceptedAuto')
        .eq('userid', uid)
        .in('levelid', IDs)

    if (b.error || !b.data) {
        throw b.error
    }

    const mp = new Map<number, (typeof b.data)[number] & { isChecked: boolean }>
    const res = []

    for (const i of b.data) {
        mp.set(i.levelid, {
            ...i,
            isChecked: Boolean((i as any).acceptedManually) || Boolean((i as any).acceptedAuto)
        })
    }

    for (const i of a.data) {
        if (!mp.has(i.id)) {
            res.push(i)
            continue
        }

        (i as any).record = mp.get(i.id)
        res.push(i)
    }

    return res
}

export async function getPlatformerListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '', tagIds = '', searchType }: { start?: number, end?: number, sortBy?: string, ascending?: boolean | string, uid?: string, topStart?: number | string | null, topEnd?: number | string | null, ratingMin?: number | string | null, ratingMax?: number | string | null, nameSearch?: string, creatorSearch?: string, tagIds?: string, searchType?: string } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const nameSearchParams = buildFullTextSearchParams(nameSearch, searchType)
    const creatorSearchParams = buildFullTextSearchParams(creatorSearch, searchType)

    // Pre-filter: get level IDs that have matching tags
    let tagFilteredIds: number[] | null = null
    if (tagIds && tagIds.trim() !== '') {
        const ids = tagIds.split(',').map(Number).filter(Boolean)
        if (ids.length > 0) {
            const { data: tagRows, error: tagError } = await (supabase as any)
                .from('levelsTags')
                .select('level_id')
                .in('tag_id', ids)
            if (tagError) throw tagError
            tagFilteredIds = [...new Set((tagRows || []).map((r: any) => r.level_id))] as number[]
            if (tagFilteredIds.length === 0) return []
        }
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levelsTags(tag_id, levelTags(id, name, color))')
        .not('dlTop', 'is', null)
        .eq('isPlatformer', true)
        .eq('isChallenge', false)
        .eq('isNonList', false)

    // Apply filters
    if (topStart !== null && topStart !== '') {
        query = query.gte('dlTop', topStart)
    }
    if (topEnd !== null && topEnd !== '') {
        query = query.lte('dlTop', topEnd)
    }
    if (ratingMin !== null && ratingMin !== '') {
        query = query.gte('rating', ratingMin)
    }
    if (ratingMax !== null && ratingMax !== '') {
        query = query.lte('rating', ratingMax)
    }
    if (nameSearchParams) {
        query = query.textSearch('nameFts', nameSearchParams.query, nameSearchParams.options)
    }
    if (creatorSearchParams) {
        query = query.textSearch('creatorFts', creatorSearchParams.query, creatorSearchParams.options)
    }

    // Filter by tag IDs: only include levels that have at least one matching tag
    if (tagFilteredIds !== null) {
        query = query.in('id', tagFilteredIds)
    }

    const a = await query
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (a.error || !a.data) {
        throw a.error
    }

    for (const i of a.data) {
        (i as any).record = null
    }

    if (!uid) {
        return a.data
    }

    const IDs = convertToIDArray(a.data);

    var b = await supabase
        .from('records')
        .select('levelid, userid, progress, acceptedManually, acceptedAuto')
        .eq('userid', uid)
        .in('levelid', IDs)

    if (b.error || !b.data) {
        throw b.error
    }

    const mp = new Map<number, (typeof b.data)[number] & { isChecked: boolean }>
    const res = []

    for (const i of b.data) {
        mp.set(i.levelid, {
            ...i,
            isChecked: Boolean((i as any).acceptedManually) || Boolean((i as any).acceptedAuto)
        })
    }

    for (const i of a.data) {
        if (!mp.has(i.id)) {
            res.push(i)
            continue
        }

        (i as any).record = mp.get(i.id)
        res.push(i)
    }

    return res
}

export async function getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '', tagIds = '', searchType }: { start?: number, end?: number, sortBy?: string, ascending?: boolean | string, uid?: string, topStart?: number | string | null, topEnd?: number | string | null, ratingMin?: number | string | null, ratingMax?: number | string | null, nameSearch?: string, creatorSearch?: string, tagIds?: string, searchType?: string } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const nameSearchParams = buildFullTextSearchParams(nameSearch, searchType)
    const creatorSearchParams = buildFullTextSearchParams(creatorSearch, searchType)

    // Pre-filter: get level IDs that have matching tags
    let tagFilteredIds: number[] | null = null
    if (tagIds && tagIds.trim() !== '') {
        const ids = tagIds.split(',').map(Number).filter(Boolean)
        if (ids.length > 0) {
            const { data: tagRows, error: tagError } = await (supabase as any)
                .from('levelsTags')
                .select('level_id')
                .in('tag_id', ids)
            if (tagError) throw tagError
            tagFilteredIds = [...new Set((tagRows || []).map((r: any) => r.level_id))] as number[]
            if (tagFilteredIds.length === 0) return []
        }
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levelsTags(tag_id, levelTags(id, name, color))')
        .not('flTop', 'is', null)
        .eq('isNonList', false)

    // Apply filters
    if (topStart !== null && topStart !== '') {
        query = query.gte('flTop', topStart)
    }
    if (topEnd !== null && topEnd !== '') {
        query = query.lte('flTop', topEnd)
    }
    if (ratingMin !== null && ratingMin !== '') {
        query = query.gte('flPt', ratingMin)
    }
    if (ratingMax !== null && ratingMax !== '') {
        query = query.lte('flPt', ratingMax)
    }
    if (nameSearchParams) {
        query = query.textSearch('nameFts', nameSearchParams.query, nameSearchParams.options)
    }
    if (creatorSearchParams) {
        query = query.textSearch('creatorFts', creatorSearchParams.query, creatorSearchParams.options)
    }

    // Filter by tag IDs: only include levels that have at least one matching tag
    if (tagFilteredIds !== null) {
        query = query.in('id', tagFilteredIds)
    }

    const a = await query
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (a.error || !a.data) {
        throw a.error
    }

    for (const i of a.data) {
        (i as any).record = null
    }

    if (!uid) {
        return a.data
    }

    const IDs = convertToIDArray(a.data);

    var b = await supabase
        .from('records')
        .select('levelid, userid, progress, acceptedManually, acceptedAuto')
        .eq('userid', uid)
        .eq('acceptedManually', true)
        .in('levelid', IDs)

    if (b.error || !b.data) {
        throw b.error
    }

    const mp = new Map<number, (typeof b.data)[number] & { isChecked: boolean }>
    const res = []

    for (const i of b.data) {
        mp.set(i.levelid, {
            ...i,
            isChecked: Boolean((i as any).acceptedManually) || Boolean((i as any).acceptedAuto)
        })
    }

    for (const i of a.data) {
        if (!mp.has(i.id)) {
            res.push(i)
            continue
        }

        (i as any).record = mp.get(i.id)
        res.push(i)
    }

    return res
}

export async function getChallengeListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '', tagIds = '', searchType }: { start?: number, end?: number, sortBy?: string, ascending?: boolean | string, uid?: string, topStart?: number | string | null, topEnd?: number | string | null, ratingMin?: number | string | null, ratingMax?: number | string | null, nameSearch?: string, creatorSearch?: string, tagIds?: string, searchType?: string } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const nameSearchParams = buildFullTextSearchParams(nameSearch, searchType)
    const creatorSearchParams = buildFullTextSearchParams(creatorSearch, searchType)

    // Pre-filter: get level IDs that have matching tags
    let tagFilteredIds: number[] | null = null
    if (tagIds && tagIds.trim() !== '') {
        const ids = tagIds.split(',').map(Number).filter(Boolean)
        if (ids.length > 0) {
            const { data: tagRows, error: tagError } = await (supabase as any)
                .from('levelsTags')
                .select('level_id')
                .in('tag_id', ids)
            if (tagError) throw tagError
            tagFilteredIds = [...new Set((tagRows || []).map((r: any) => r.level_id))] as number[]
            if (tagFilteredIds.length === 0) return []
        }
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levelsTags(tag_id, levelTags(id, name, color))')
        .not('dlTop', 'is', null)
        .eq('isChallenge', true)
        .eq('isNonList', false)

    // Apply filters
    if (topStart !== null && topStart !== '') {
        query = query.gte('dlTop', topStart)
    }
    if (topEnd !== null && topEnd !== '') {
        query = query.lte('dlTop', topEnd)
    }
    if (ratingMin !== null && ratingMin !== '') {
        query = query.gte('rating', ratingMin)
    }
    if (ratingMax !== null && ratingMax !== '') {
        query = query.lte('rating', ratingMax)
    }
    if (nameSearchParams) {
        query = query.textSearch('nameFts', nameSearchParams.query, nameSearchParams.options)
    }
    if (creatorSearchParams) {
        query = query.textSearch('creatorFts', creatorSearchParams.query, creatorSearchParams.options)
    }

    // Filter by tag IDs: only include levels that have at least one matching tag
    if (tagFilteredIds !== null) {
        query = query.in('id', tagFilteredIds)
    }

    const a = await query
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (a.error || !a.data) {
        throw a.error
    }

    for (const i of a.data) {
        (i as any).record = null
    }

    if (!uid) {
        return a.data
    }

    const IDs = convertToIDArray(a.data);

    var b = await supabase
        .from('records')
        .select('levelid, userid, progress, acceptedManually, acceptedAuto')
        .eq('userid', uid)
        .in('levelid', IDs)

    if (b.error || !b.data) {
        throw b.error
    }

    const mp = new Map<number, (typeof b.data)[number] & { isChecked: boolean }>
    const res = []

    for (const i of b.data) {
        mp.set(i.levelid, {
            ...i,
            isChecked: Boolean((i as any).acceptedManually) || Boolean((i as any).acceptedAuto)
        })
    }

    for (const i of a.data) {
        if (!mp.has(i.id)) {
            res.push(i)
            continue
        }

        (i as any).record = mp.get(i.id)
        res.push(i)
    }

    return res
}

export async function getLevel(levelId: number) {
    const { data, error } = await supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*))')
        .eq('id', levelId)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getLevelMaybe(levelId: number) {
    const { data, error } = await supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*))')
        .eq('id', levelId)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data || null
}

export async function fetchLevelFromGD(levelId: number) {
    // Use our custom GD API service
    return await getGJLevels21(levelId);
}

export async function updateLevel(levelData: Awaited<ReturnType<typeof getLevel>>): Promise<void> {
    let { data } = await supabase
        .from('levels')
        .select('*')
        .eq('id', levelData.id!)
        .limit(1)
        .single()

    const { creatorData, ...upsertData } = levelData

    let { error } = await supabase
        .from('levels')
        .upsert(upsertData as any)

    if (error) {
        throw new Error(error.message)
    }

    addChangelog(levelData.id!, data)
}

export async function deleteLevel(levelId: number): Promise<void> {
    const { error } = await supabase
        .from('levels')
        .delete()
        .eq('id', levelId)

    if (error) {
        throw new Error(error.message)
    }
}

export async function retrieveOrCreateLevel(payload: TablesInsert<'levels'>): Promise<TLevel> {
    const sel = await supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*))')
        .eq('id', payload.id)
        .maybeSingle()

    if (sel.error) {
        throw new Error(sel.error.message)
    }

    if (sel.data) {
        return sel.data
    }

    const ins = await supabase
        .from('levels')
        .insert([payload as any])
        .select('*')
        .maybeSingle()

    if (ins.error) {
        throw new Error(ins.error.message)
    }

    return ins.data!
}

function buildCrawledLevelPayload(gdLevel: Awaited<ReturnType<typeof fetchLevelFromGD>>): TablesInsert<'levels'> {
    return {
        id: gdLevel.id,
        name: gdLevel.name,
        creator: gdLevel.author,
        difficulty: gdLevel.difficulty ?? null,
        isPlatformer: gdLevel.length === 5,
        isChallenge: false,
        isNonList: false
    } as TablesInsert<'levels'>
}

async function upsertCrawledLevel(payload: TablesInsert<'levels'>) {
    const { error } = await supabase
        .from('levels')
        .upsert(payload as any)

    if (error) {
        throw new Error(error.message)
    }

    return await getLevel(payload.id!)
}

export async function crawlLevel(levelId: number, options: {
    forced?: boolean
} = {}) {
    const forced = Boolean(options.forced)

    if (!forced) {
        const existingLevel = await getLevelMaybe(levelId)

        if (existingLevel) {
            return {
                level: existingLevel,
                status: 'skipped' as const
            }
        }
    }

    const gdLevel = await fetchLevelFromGD(levelId)
    const level = forced
        ? await upsertCrawledLevel(buildCrawledLevelPayload(gdLevel))
        : await retrieveOrCreateLevel(buildCrawledLevelPayload(gdLevel))

    return {
        level,
        status: 'crawled' as const
    }
}

export async function crawlLevels(levelIds: number[], options: {
    forced?: boolean
} = {}) {
    const results: Array<{
        id: number
        status: 'skipped' | 'crawled' | 'not_found'
        level?: TLevel
        error?: string
    }> = []

    for (const levelId of levelIds) {
        try {
            const result = await crawlLevel(levelId, options)
            results.push({
                id: levelId,
                status: result.status,
                level: result.level
            })
        } catch (error) {
            results.push({
                id: levelId,
                status: 'not_found',
                error: error instanceof Error ? error.message : 'Failed to crawl level'
            })
        }
    }

    return results
}

export async function refreshLevel() {
    const dailyLevel = await getGJDailyLevel(false)
    const weeklyLevel = await getGJDailyLevel(true)
    const currentStates = await supabase
        .from('levelGDStates')
        .select('levelId, isDaily, isWeekly')
        .or('isDaily.eq.true,isWeekly.eq.true')

    if (currentStates.error) {
        throw currentStates.error
    }

    const currentDailyId = (currentStates.data || []).find((state: any) => state.isDaily)?.levelId ?? null
    const currentWeeklyId = (currentStates.data || []).find((state: any) => state.isWeekly)?.levelId ?? null

    const isDailyChanged = currentDailyId !== dailyLevel.id
    const isWeeklyChanged = currentWeeklyId !== weeklyLevel.id

    const pairs = [
        { gd: dailyLevel, isDaily: true, isWeekly: false },
        { gd: weeklyLevel, isDaily: false, isWeekly: true }
    ]

    await supabase
        .from('levelGDStates')
        .update({ isDaily: false, isWeekly: false })
        .gte('levelId', 0)

    for (const p of pairs) {
        const id = p.gd.id

        await retrieveOrCreateLevel({
            id: id,
            name: p.gd.name,
            creator: p.gd.author,
            created_at: new Date().toISOString(),
            isNonList: false,
            isPlatformer: false,
            difficulty: p.gd.difficulty
        })

        const state = {
            levelId: id,
            isDaily: p.isDaily,
            isWeekly: p.isWeekly
        }

        const { error: stateErr } = await supabase
            .from('levelGDStates')
            .upsert(state as any)

        if (stateErr) {
            throw stateErr
        }
    }

    const season = await getActiveseason()

    if (season) {
        for (const p of pairs) {
            const type = p.isDaily ? 'daily' : 'weekly'

            const existing = (await getSeasonLevelByType(season.id, type))[0]

            if (existing) {
                await updateSeasonLevel(existing.id, { levelID: p.gd.id })
            } else {
                await addSeasonLevel({
                    seasonId: season.id,
                    levelID: p.gd.id,
                    type,
                    created_at: new Date().toISOString(),
                    xp: p.isDaily ? 25 : 100,
                    minProgress: 100,
                    minProgressXp: 0
                })
            }
        }
    }

    if (isDailyChanged) {
        await refreshDailyLevelProgress()
    }

    if (isWeeklyChanged) {
        await refreshWeeklyLevelProgress()
    }

    return { daily: dailyLevel.id, weekly: weeklyLevel.id }
}

// ---- Level Tags ----

/** Get all level tags */
export async function getLevelTags() {
    const { data, error } = await supabase
        .from('levelTags')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

/** Create a new level tag (admin only) */
export async function createLevelTag(tag: { name: string, color?: string }) {
    const { data, error } = await (supabase as any)
        .from('levelTags')
        .insert(tag)
        .select('*')
        .single()

    if (error) {
        if (error.code === '23505') throw new Error('Tag already exists')
        throw new Error(error.message)
    }
    return data
}

/** Delete a level tag and all its associations (admin only) */
export async function deleteLevelTag(tagId: number) {
    // CASCADE will remove from levelsTags automatically
    const { error } = await (supabase as any)
        .from('levelTags')
        .delete()
        .eq('id', tagId)

    if (error) throw new Error(error.message)
}

/** Update a level tag's name and/or color (admin only) */
export async function updateLevelTag(tagId: number, updates: { name?: string, color?: string }) {
    const { data, error } = await (supabase as any)
        .from('levelTags')
        .update(updates)
        .eq('id', tagId)
        .select('*')
        .single()

    if (error) {
        if (error.code === '23505') throw new Error('Tag already exists')
        throw new Error(error.message)
    }
    return data
}

/** Set tags on a level (admin only) */
export async function setLevelTags(levelId: number, tagIds: number[]) {
    const db: any = supabase

    // Remove existing tags
    await db
        .from('levelsTags')
        .delete()
        .eq('level_id', levelId)

    // Insert new tags
    if (tagIds.length > 0) {
        const rows = tagIds.map((tag_id: number) => ({ level_id: levelId, tag_id }))
        const { error } = await db
            .from('levelsTags')
            .insert(rows)

        if (error) throw new Error(error.message)
    }

    // Return updated tags
    const { data, error } = await db
        .from('levelsTags')
        .select('tag_id, levelTags(id, name, color)')
        .eq('level_id', levelId)

    if (error) throw new Error(error.message)
    return data || []
}

/** Get tags for a level */
export async function getLevelTagsForLevel(levelId: number) {
    const { data, error } = await (supabase as any)
        .from('levelsTags')
        .select('tag_id, levelTags(id, name, color)')
        .eq('level_id', levelId)

    if (error) throw new Error(error.message)
    return data || []
}

// ---- Level Variants ----

/** Add a variant (low detail version) to a level */
export async function addLevelVariant(mainLevelId: number, variantLevelId: number) {
    // Verify main level exists
    const mainLevel = await getLevel(mainLevelId)
    if (!mainLevel) throw new Error('Main level not found')

    // Set the main_level_id on the variant level
    const { data, error } = await supabase
        .from('levels')
        .update({ main_level_id: mainLevelId } as any)
        .eq('id', variantLevelId)
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

/** Remove a variant association from a level */
export async function removeLevelVariant(variantLevelId: number) {
    const { data, error } = await supabase
        .from('levels')
        .update({ main_level_id: null } as any)
        .eq('id', variantLevelId)
        .select('*')
        .single()

    if (error) throw new Error(error.message)
    return data
}

/** Get all variants for a main level */
export async function getLevelVariants(mainLevelId: number) {
    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('main_level_id' as any, mainLevelId)

    if (error) throw new Error(error.message)
    return data || []
}