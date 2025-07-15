import supabase from "@src/database/supabase";

export async function getCard(id: string) {
    const { data, error } = await supabase
        .from("cards")
        .select("*, players(*, clans!id(*))")
        .eq('id', id)
        .single()

    if(error) {
        throw error
    }

    return data
}