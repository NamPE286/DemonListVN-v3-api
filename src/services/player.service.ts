import supabase from '@src/client/supabase'

export async function getPlayers({ province = '', city = '', sortBy = 'rating', ascending = 'true' } = {}) {
    if (province == '') {
        throw new Error('Provinces is required')
    }

    let query = supabase
        .from('players')
        .select('*, clans!id(*)')
        .order(sortBy, { ascending: ascending == 'true', nullsFirst: false })
        .eq('province', province)
        .eq('isHidden', false)

    if (city) {
        query = query.eq('city', city)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return data
}

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
        throw new Error(error.message)
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
        throw new Error(error.message)
    }

    return data
}

export async function getPlatformerListLeaderboard({ start = 0, end = 50, sortBy = 'plrank', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .not('plRating', 'is', null)
        .eq('isHidden', false)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getPlayersBatch(uid: string[]) {
    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .in('uid', uid)

    if (error) {
        throw new Error(error.message)
    }

    return uid.map(id => data.find(player => player.uid === id)).filter(Boolean)
}