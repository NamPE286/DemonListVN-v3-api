import supabase from "@src/database/supabase"
import type { Database } from '@src/lib/types/supabase'

type Clan = Database['public']['Tables']['clans']['Update']

export async function getClans({ start = 0, end = 50, sortBy = 'name', ascending = 'true', searchQuery = '' } = {}) {
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
        throw error
    }

    return data
}