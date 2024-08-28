import supabase from "@src/database/supabase"

export async function getPlayerSubmissions(uid: string) {
    const { data, error } = await supabase
        .from('records')
        .select('*, levels(*)')
        .eq('userid', uid)
        .eq('isChecked', false)

    if (error) {
        throw error
    }

    return data
}