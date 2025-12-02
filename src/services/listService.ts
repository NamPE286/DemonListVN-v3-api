import { getDemonListRecords, getFeaturedListRecords } from '@src/lib/client/record'
import supabase from '@src/database/supabase'
import type { TLevel } from "@src/lib/types"

function convertToIDArray(levels: TLevel[]) {
    let res: number[] = []

    for (const i of levels) {
        res.push(i.id!)
    }

    return res
}

async function getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '' } = {}) {
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

async function getPlatformerListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '' } = {}) {
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

async function getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true, uid = '' } = {}) {
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

export class ListService {
    async getDemonList(query: any) {
        return await getDemonListLevels(query)
    }

    async getPlatformerList(query: any) {
        return await getPlatformerListLevels(query)
    }

    async getFeaturedList(query: any) {
        return await getFeaturedListLevels(query)
    }

    async getDemonListRecords(query: any) {
        return await getDemonListRecords(query)
    }

    async getFeaturedListRecords(query: any) {
        return await getFeaturedListRecords(query)
    }

    async getRandomLevel(list: string, exclude?: string) {
        const maxID = await this.getIDBound(list, false)
        const minID = await this.getIDBound(list, true) - 1000000
        const random = Math.floor(Math.random() * (maxID - minID + 1)) + minID

        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .not(list == 'fl' ? 'flTop' : 'dlTop', 'is', null)
            .eq('isPlatformer', list == 'pl')
            .not('id', 'in', exclude ? exclude : '()')
            .order('id', { ascending: true })
            .gte('id', random)
            .limit(1)
            .single()

        if (error) {
            throw error
        }

        return data
    }

    private async getIDBound(list: string, min: boolean) {
        const { data, error } = await supabase
            .from('levels')
            .select('id')
            .order('id', { ascending: min })
            .not(list == 'fl' ? 'flTop' : 'dlTop', 'is', null)
            .eq('isPlatformer', list == 'pl')
            .limit(1)
            .single()

        if (error) {
            throw error
        }

        return data.id
    }
}

export default new ListService()
