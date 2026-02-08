import supabase from "@src/client/supabase"
import { getGJDailyLevel, getGJLevels21 } from '@src/services/gd-api.service'
import { addChangelog } from '@src/services/changelog.service'
import { refreshDailyLevelProgress, refreshWeeklyLevelProgress, getActiveseason, getSeasonLevelByType, addSeasonLevel, updateSeasonLevel } from '@src/services/battlepass.service'
import type { TLevel } from "@src/types"
import type { TablesInsert } from "@src/types/supabase"

function convertToIDArray(levels: TLevel[]) {
    let res: number[] = []

    for (const i of levels) {
        res.push(i.id!)
    }

    return res
}

export async function getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '', tagIds = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levels_tags(tag_id, level_tags(id, name, color))')
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
    if (nameSearch && nameSearch.trim() !== '') {
        query = query.ilike('name', `%${nameSearch}%`)
    }
    if (creatorSearch && creatorSearch.trim() !== '') {
        query = query.ilike('creator', `%${creatorSearch}%`)
    }

    // Filter by tag IDs (comma-separated string)
    if (tagIds && tagIds.trim() !== '') {
        const ids = tagIds.split(',').map(Number).filter(Boolean)
        if (ids.length > 0) {
            query = query.in('levels_tags.tag_id' as any, ids)
        }
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
        .select('levelid, userid, progress, isChecked')
        .eq('userid', uid)
        .in('levelid', IDs)

    if (b.error || !b.data) {
        throw b.error
    }

    const mp = new Map<number, typeof b.data[0]>
    const res = []

    for (const i of b.data) {
        mp.set(i.levelid, i)
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

export async function getPlatformerListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '', tagIds = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levels_tags(tag_id, level_tags(id, name, color))')
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
    if (nameSearch && nameSearch.trim() !== '') {
        query = query.ilike('name', `%${nameSearch}%`)
    }
    if (creatorSearch && creatorSearch.trim() !== '') {
        query = query.ilike('creator', `%${creatorSearch}%`)
    }

    // Filter by tag IDs
    if (tagIds && tagIds.trim() !== '') {
        const ids = tagIds.split(',').map(Number).filter(Boolean)
        if (ids.length > 0) {
            query = query.in('levels_tags.tag_id' as any, ids)
        }
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
        .select('levelid, userid, progress, isChecked')
        .eq('userid', uid)
        .in('levelid', IDs)

    if (b.error || !b.data) {
        throw b.error
    }

    const mp = new Map<number, typeof b.data[0]>
    const res = []

    for (const i of b.data) {
        mp.set(i.levelid, i)
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

export async function getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '', tagIds = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levels_tags(tag_id, level_tags(id, name, color))')
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
    if (nameSearch && nameSearch.trim() !== '') {
        query = query.ilike('name', `%${nameSearch}%`)
    }
    if (creatorSearch && creatorSearch.trim() !== '') {
        query = query.ilike('creator', `%${creatorSearch}%`)
    }

    // Filter by tag IDs
    if (tagIds && tagIds.trim() !== '') {
        const ids = tagIds.split(',').map(Number).filter(Boolean)
        if (ids.length > 0) {
            query = query.in('levels_tags.tag_id' as any, ids)
        }
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
        .select('levelid, userid, progress, isChecked')
        .eq('userid', uid)
        .eq('isChecked', true)
        .in('levelid', IDs)

    if (b.error || !b.data) {
        throw b.error
    }

    const mp = new Map<number, typeof b.data[0]>
    const res = []

    for (const i of b.data) {
        mp.set(i.levelid, i)
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

export async function getChallengeListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '', tagIds = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levels_tags(tag_id, level_tags(id, name, color))')
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
    if (nameSearch && nameSearch.trim() !== '') {
        query = query.ilike('name', `%${nameSearch}%`)
    }
    if (creatorSearch && creatorSearch.trim() !== '') {
        query = query.ilike('creator', `%${creatorSearch}%`)
    }

    // Filter by tag IDs
    if (tagIds && tagIds.trim() !== '') {
        const ids = tagIds.split(',').map(Number).filter(Boolean)
        if (ids.length > 0) {
            query = query.in('levels_tags.tag_id' as any, ids)
        }
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
        .select('levelid, userid, progress, isChecked')
        .eq('userid', uid)
        .in('levelid', IDs)

    if (b.error || !b.data) {
        throw b.error
    }

    const mp = new Map<number, typeof b.data[0]>
    const res = []

    for (const i of b.data) {
        mp.set(i.levelid, i)
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

export async function getLevel(levelId: number): Promise<TLevel> {
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

export async function fetchLevelFromGD(levelId: number) {
    // Use our custom GD API service
    return await getGJLevels21(levelId);
}

export async function updateLevel(levelData: TLevel): Promise<void> {
    let { data } = await supabase
        .from('levels')
        .select('*')
        .eq('id', levelData.id!)
        .limit(1)
        .single()

    let { error } = await supabase
        .from('levels')
        .upsert(levelData as any)

    await supabase.rpc('update_list')

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

export async function refreshLevel() {
    const dailyLevel = await getGJDailyLevel(false)
    const weeklyLevel = await getGJDailyLevel(true)
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

    await refreshDailyLevelProgress()
    await refreshWeeklyLevelProgress()

    return { daily: dailyLevel.id, weekly: weeklyLevel.id }
}

// ---- Level Tags ----

/** Get all level tags */
export async function getLevelTags() {
    const { data, error } = await supabase
        .from('level_tags')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

/** Create a new level tag (admin only) */
export async function createLevelTag(tag: { name: string, color?: string }) {
    const { data, error } = await (supabase as any)
        .from('level_tags')
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
    // CASCADE will remove from levels_tags automatically
    const { error } = await (supabase as any)
        .from('level_tags')
        .delete()
        .eq('id', tagId)

    if (error) throw new Error(error.message)
}

/** Set tags on a level (admin only) */
export async function setLevelTags(levelId: number, tagIds: number[]) {
    const db: any = supabase

    // Remove existing tags
    await db
        .from('levels_tags')
        .delete()
        .eq('level_id', levelId)

    // Insert new tags
    if (tagIds.length > 0) {
        const rows = tagIds.map((tag_id: number) => ({ level_id: levelId, tag_id }))
        const { error } = await db
            .from('levels_tags')
            .insert(rows)

        if (error) throw new Error(error.message)
    }

    // Return updated tags
    const { data, error } = await db
        .from('levels_tags')
        .select('tag_id, level_tags(id, name, color)')
        .eq('level_id', levelId)

    if (error) throw new Error(error.message)
    return data || []
}

/** Get tags for a level */
export async function getLevelTagsForLevel(levelId: number) {
    const { data, error } = await (supabase as any)
        .from('levels_tags')
        .select('tag_id, level_tags(id, name, color)')
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