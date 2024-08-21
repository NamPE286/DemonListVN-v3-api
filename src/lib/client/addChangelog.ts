import supabase from "@src/database/supabase";

export async function addChangelog(id: number, oldData: any) {
    let { data } = await supabase
        .from('levels')
        .select('*')
        .eq('id', id)
        .limit(1)
        .single()

    const { error } = await supabase
        .from('changelogs')
        .insert({ levelID: id, old: oldData, new: data })

    if (error) {
        throw error
    }
}