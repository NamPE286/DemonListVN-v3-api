import supabase from "@src/database/supabase"
import type { Database } from '@src/lib/types/supabase'

type Level = Database['public']['Tables']['levels']['Update']

function convertToIDArray(levels: Level[]) {
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

    if (a.error || !a.data) {
        throw a.error
    }

    for (const i of a.data) {
        (i as any).progress = 0
    }

    if (!uid) {
        return a.data
    }

    const IDs = convertToIDArray(a.data);

    var b = await supabase
        .from('records')
        .select('levelid, userid, progress')
        .eq('userid', uid)
        .in('levelid', IDs)

    if (b.error || !b.data) {
        throw b.error
    }

    const mp = new Map<number, typeof b.data[0]>

    for (const i of b.data) {
        mp.set(i.levelid, i)
    }

    for (const i of a.data) {
        if (!mp.has(i.id)) {
            continue
        }

        (i as any).progress = mp.get(i.id)?.progress
    }

    return a.data
}