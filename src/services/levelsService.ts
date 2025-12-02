import supabase from "@src/database/supabase"
import type { TLevel } from "@src/lib/types"

export class LevelsService {
    // Moved from lib/client/level.ts
    private convertToIDArray(levels: TLevel[]) {
        let res: number[] = []

        for (const i of levels) {
            res.push(i.id!)
        }

        return res
    }

    async getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '' } = {}) {
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

        const IDs = this.convertToIDArray(a.data);

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

    async getPlatformerListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true, uid = '' } = {}) {
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

        const IDs = this.convertToIDArray(a.data);

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

    async getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true, uid = '' } = {}) {
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

        const IDs = this.convertToIDArray(a.data);

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

    async getNewLevels() {
        const { data, error } = await supabase
            .from("levels")
            .select("*")
            .is("rating", null)
            .is("flTop", null)
            .is("insaneTier", null)
            .is("isNonList", false)

        if (error) {
            throw error
        }

        return data
    }

    async getRandomLevels(limit: number, filterType: string | null) {
        const { data, error } = await supabase.rpc("get_random_levels", {
            row_count: limit,
            filter_type: filterType,
        })

        if (error) {
            throw error
        }

        return data
    }
}

export default new LevelsService()
