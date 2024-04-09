import supabase from "@src/database/supabase";

export async function getPlayers({ province = '', city = '', sortBy = 'rating', ascending = 'true' } = {}) {
    if (province == '') {
        throw new Error('Provinces is required')
    }

    let query = supabase
        .from('players')
        .select('*')
        .order(sortBy, { ascending: ascending == 'true' })
        .eq('province', province)

    if (city) {
        query = query.eq('city', city)
    }

    const { data, error } = await query

    if (error) {
        throw error
    }

    return data
}