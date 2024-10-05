import supabase from "@src/database/supabase";
import type { Database } from '@src/lib/types/supabase'

export type Record = Database['public']['Tables']['records']['Update']

export async function getDemonListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .not('dlPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}

export async function getFeaturedListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .not('flPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}

export async function getPlayerRecords(uid: string, { start = '0', end = '50', sortBy = 'pt', ascending = 'false', isChecked = 'true' } = {}) {
    let query = supabase
        .from('records')
        .select('*, levels!inner(*)')
        .eq('userid', uid)
        .eq('isChecked', isChecked == 'true')
    let query1 = supabase
        .from('records')
        .select('*, levels!inner(*)')
        .eq('userid', uid)
        .eq('isChecked', isChecked == 'true')

    if (sortBy == 'pt') {
        query = query
            .order('dlPt', { ascending: ascending == 'true' })
            .order('timestamp', { ascending: false })
            .not('levels.rating', 'is', null)
            .range(parseInt(start), parseInt(end))
        query1 = query1
            .order('flPt', { ascending: ascending == 'true' })
            .order('timestamp', { ascending: false })
            .not('levels.flTop', 'is', null)
            .range(parseInt(start), parseInt(end))

        return {
            dl: (await query).data,
            fl: (await query1).data
        }
    }

    query = query
        .order(sortBy, { ascending: ascending == 'true' })
        .not('levels.rating', 'is', null)
        .range(parseInt(start), parseInt(end))
    query1 = query1
        .order(sortBy, { ascending: ascending == 'true' })
        .not('levels.flTop', 'is', null)
        .range(parseInt(start), parseInt(end))

    return {
        dl: (await query).data,
        fl: (await query1).data
    }
}

export async function getLevelRecords(id: number, { start = 0, end = 50, isChecked = true } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid!inner(*, clans!id(*))')
        .eq('players.isHidden', false)
        .eq('levelid', id)
        .eq('isChecked', isChecked)
        .order('progress', { ascending: false })
        .order('timestamp')
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}