import supabase from '@database/supabase'
import type { Database } from '@src/lib/types/supabase'

export type Player = Database['public']['Tables']['players']['Update']

export async function getDemonListLeaderboard({ start = 0, end = 50, sortBy = 'overallRank', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .not('overallRank', 'is', null)
        .eq('isHidden', false)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}

export async function getFeaturedListLeaderboard({ start = 0, end = 50, sortBy = 'flrank', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .not('flrank', 'is', null)
        .eq('isHidden', false)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}