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

export async function getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*)')
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

export async function getPlatformerListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*)')
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

export async function getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*)')
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
        // For featured list, we can still filter by rating even though sorting is by flTop
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

export async function getChallengeListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '', topStart = null, topEnd = null, ratingMin = null, ratingMax = null, nameSearch = '', creatorSearch = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    let query = supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*))')
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
        .select('*')
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
        .select('*')
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