import supabase from "@src/database/supabase"

export async function getClans({ start = 0, end = 50, sortBy = 'name', ascending = 'true', searchQuery = '' } = {}) {
    console.log(searchQuery)
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