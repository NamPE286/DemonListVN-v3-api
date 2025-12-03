import supabase from "@src/client/supabase";
import type Player from "@src/classes/Player";

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

export async function linkCard(id: string, player: Player) {
    const card = await getCard(id)

    if (!card.activationDate || new Date(card.activationDate) > new Date()) {
        throw new Error("Card is not activated")
    }

    if(card.owner) {
        throw new Error("Card is already linked")
    }

    const { error } = await supabase
        .from("cards")
        .update({
            owner: player.uid
        })
        .eq('id', id)

    if (error) {
        throw error
    }

    await player.extendSupporter(card.supporterIncluded)
}

export async function updateCardContent(id: string, content: string) {
    const { error } = await supabase
        .from("cards")
        .update({
            content: content
        })
        .eq('id', id)

    if (error) {
        throw error
    }
}