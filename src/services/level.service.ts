import supabase from "@src/client/supabase"
import { fetchLevelFromGD as fetchLevelFromGDAPI } from '@src/services/gd-api.service'
import { addChangelog } from '@src/services/changelog.service'
import type { TLevel } from "@src/types"

function convertToIDArray(levels: TLevel[]) {
    let res: number[] = []

    for (const i of levels) {
        res.push(i.id!)
    }

    return res
}

export async function getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const a = await supabase
        .from('levels')
        .select('*')
        .not('dlTop', 'is', null)
        .order(sortBy, { ascending: ascending })
        .range(start, end)
        .eq('isPlatformer', false)

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

export async function getPlatformerListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const a = await supabase
        .from('levels')
        .select('*')
        .not('dlTop', 'is', null)
        .order(sortBy, { ascending: ascending })
        .range(start, end)
        .eq('isPlatformer', true)

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

export async function getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true, uid = '' } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const a = await supabase
        .from('levels')
        .select('*')
        .not('flTop', 'is', null)
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
    return await fetchLevelFromGDAPI(levelId);
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