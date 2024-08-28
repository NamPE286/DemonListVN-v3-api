import supabase from "@src/database/supabase"

export async function getPlayerSubmissions(uid: string, { start = '0', end = '50' } = {}) {
    const { data, error } = await supabase
        .from('records')
        .select('*, levels(*)')
        .eq('userid', uid)
        .eq('isChecked', false)
        .range(parseInt(start), parseInt(end))

    if (error) {
        throw error
    }

    return data
}