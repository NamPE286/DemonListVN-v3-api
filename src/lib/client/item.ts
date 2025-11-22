import supabase from "@src/database/supabase";

export async function getCase(id: number) {
    const { data, error } = await supabase
        .from('caseItems')
        .select('*')
        .eq('caseId', id)

    if (error) {
        throw error
    }

    return data;
}

export async function getItem(id: number) {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        throw error
    }

    return data;
}