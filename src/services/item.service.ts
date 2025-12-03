import supabase from "@src/client/supabase";

export async function getCase(id: number) {
    const { data, error } = await supabase
        .from('caseItems')
        .select('*, items!caseItems_itemId_fkey(*)')
        .eq('caseId', id)

    if (error) {
        throw new Error(error.message)
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
        throw new Error(error.message)
    }

    return data;
}