import supabase from "@src/client/supabase";
import type { TPlayer } from "@src/types";
import { extendPlayerSupporter } from "@src/services/player.service";

export async function getCard(id: string) {
    const { data, error } = await supabase
        .from("cards")
        .select("*, players(*, clans!id(*))")
        .eq('id', id)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function linkCard(id: string, player: TPlayer) {
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
        throw new Error(error.message)
    }

    await extendPlayerSupporter(player.uid!, card.supporterIncluded)
}

export async function updateCardContent(id: string, content: string) {
    const { error } = await supabase
        .from("cards")
        .update({
            content: content
        })
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
}