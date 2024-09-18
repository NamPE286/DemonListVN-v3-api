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
        (i as any).progress = 0
    }

    if (!uid) {
        const res = []

        for (const i of a.data) {
            res.push({ data: i })
        }
        return res
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
            continue
        }

        (i as any).progress = mp.get(i.id)?.progress
        res.push({ data: i })
    }

    return a.data
}