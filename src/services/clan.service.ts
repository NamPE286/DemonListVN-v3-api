import supabase from "@src/client/supabase"
import type { Database } from '@src/types/supabase'

type Clan = Database['public']['Tables']['clans']['Update']

export async function getClans({ start = 0, end = 50, sortBy = 'boostedUntil', ascending = 'false', searchQuery = '' } = {}) {
    let query = supabase
        .from('clans')
        .select('*, players!owner(*, clans!id(*))')

    if (searchQuery.length) {
        query = query.ilike('name', `%${searchQuery}%`)
    }

    query = query
        .order(sortBy, { ascending: ascending == 'true' })
        .range(start, end)

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return data
}