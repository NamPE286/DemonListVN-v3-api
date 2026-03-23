import supabase from "@src/client/supabase";
import { extendPlayerSupporter } from '@src/services/player.service';
import type { getPlayer } from '@src/services/player.service';

type Player = Awaited<ReturnType<typeof getPlayer>>;

export async function createRecordCard(
    orderID: number,
    playerUID: string,
    levelID: number,
    template: number,
    material: string
) {
    const { data, error } = await supabase
        .from("record_cards" as any)
        .insert({
            owner: playerUID,
            orderID,
            levelID,
            template,
            material
        })
        .select('id')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return (data as any).id as string
}

export async function getRecordCard(id: string) {
    const { data: card, error } = await supabase
        .from("record_cards" as any)
        .select("*, players!owner(uid, name, rating, overallRank, clan, isAvatarGif, supporterUntil, clans!id(tag, tagBgColor, tagTextColor, boostedUntil))")
        .eq('id', id)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    const { data: record, error: recErr } = await supabase
        .from('records')
        .select('*, levels!public_records_levelid_fkey(*)')
        .eq('levelid', (card as any).levelID)
        .eq('userid', (card as any).owner.uid)
        .single()

    if (recErr) {
        throw new Error(recErr.message)
    }

    return { ...card, record }
}

export async function getAllRecordCards() {
    const { data, error } = await supabase
        .from("record_cards" as any)
        .select("*, players!owner(uid, name)")
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    const levelIDs = [...new Set((data as any[]).map((c: any) => c.levelID).filter(Boolean))] as number[]

    let levels: any[] = []
    if (levelIDs.length > 0) {
        const { data: levelsData } = await supabase
            .from('levels')
            .select('id, name, videoID')
            .in('id', levelIDs)
        levels = levelsData || []
    }

    return (data as any[]).map((card: any) => ({
        ...card,
        level: levels.find((l: any) => l.id === card.levelID) || null
    }))
}

export async function updateRecordCardImg(id: string, playerUID: string, imgURL: string) {
    const { data: card, error: fetchError } = await supabase
        .from("record_cards" as any)
        .select("owner")
        .eq('id', id)
        .single()

    if (fetchError || (card as any).owner !== playerUID) {
        throw new Error("Unauthorized")
    }

    const { error } = await supabase
        .from("record_cards" as any)
        .update({ img: imgURL })
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
}

export async function markRecordCardPrinted(id: string) {
    const { error } = await supabase
        .from("record_cards" as any)
        .update({ printed: true })
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
}

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
        throw new Error(error.message)
    }

    await extendPlayerSupporter(player.uid!, card.supporterIncluded)
}

export async function activateCard(id: string) {
    const { error } = await supabase
        .from("cards")
        .update({
            activationDate: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
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