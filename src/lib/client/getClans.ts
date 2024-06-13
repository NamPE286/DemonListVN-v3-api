import supabase from "@src/database/supabase"

export async function getClans({ start = 0, end = 50, sortBy = 'name', ascending = 'true' } = {}) {
    const { data, error } = await supabase
        .from('clans')
        .select('*, players!owner(*)')
        .order(sortBy, { ascending: ascending == 'true' })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}