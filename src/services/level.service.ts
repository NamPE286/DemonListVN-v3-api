import supabase from "@src/client/supabase"
import { getGJDailyLevel, getGJLevels21 } from '@src/services/gd-api.service'
import { addChangelog } from '@src/services/changelog.service'
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
        .select('*')
        .not('dlTop', 'is', null)
        .eq('isPlatformer', false)

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
        .select('*')
        .not('dlTop', 'is', null)
        .eq('isPlatformer', true)

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
        .select('*')
        .not('flTop', 'is', null)

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

export async function retrieveOrCreateLevel(levelPayload: TablesInsert<'levels'>): Promise<TLevel> {
    const id = levelPayload.id

    const sel = await supabase
        .from('levels')
        .select('*')
        .eq('id', id)
        .limit(1)

    if (sel.error) {
        throw sel.error
    }

    if (!sel.data || (Array.isArray(sel.data) && sel.data.length === 0)) {
        const ins = await supabase
            .from('levels')
            .insert([levelPayload as any])
            .select('*')

        if (ins.error) {
            throw ins.error
        }

        return ins.data![0]
    }

    return sel.data[0]
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

        const levelRow = await retrieveOrCreateLevel({
            id: id,
            name: p.gd.name,
            creator: p.gd.author,
            created_at: new Date().toISOString(),
            isNonList: false,
            isPlatformer: false
        })

        // Ensure name/creator are up-to-date
        const upd = await supabase
            .from('levels')
            .update({ name: p.gd.name, creator: p.gd.author } as any)
            .eq('id', id)

        if (upd.error) {
            throw upd.error
        }

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

    return { daily: dailyLevel.id, weekly: weeklyLevel.id }
}