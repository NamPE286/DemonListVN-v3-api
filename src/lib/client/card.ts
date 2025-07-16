import supabase from "@src/database/supabase";

export async function getCard(id: string) {
    const { data, error } = await supabase
        .from("cards")
        .select("*, players(*, clans!id(*))")
        .eq('id', id)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function linkCard(id: string, userID: string) {
    const card = await getCard(id)

    if (!card.activationDate || new Date(card.activationDate) > new Date()) {
        throw new Error("Card is not activated")
    }

    const { error } = await supabase
        .from("cards")
        .update({
            id: id,
            owner: userID
        })
        .eq('id', id)

    if (error) {
        throw error
    }
}