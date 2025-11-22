import supabase from "@src/database/supabase";

export async function getInventoryItem(id: number) {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        throw error
    }

    return data;
}