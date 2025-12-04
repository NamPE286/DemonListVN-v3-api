import supabase from '@src/client/supabase'
import { sendDirectMessage } from '@src/services/discord.service'
import type { TInventoryItem, TPlayer } from '@src/types'
import type { Database } from '@src/types/supabase'
import { FRONTEND_URL } from '@src/config/constants'

export async function getPlayers({ province = '', city = '', sortBy = 'rating', ascending = 'true' } = {}) {
    if (province == '') {
        throw new Error('Provinces is required')
    }

    let query = supabase
        .from('players')
        .select('*, clans!id(*)')
        .order(sortBy, { ascending: ascending == 'true', nullsFirst: false })
        .eq('province', province)
        .eq('isHidden', false)

    if (city) {
        query = query.eq('city', city)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getDemonListLeaderboard({ start = 0, end = 50, sortBy = 'overallRank', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .not('overallRank', 'is', null)
        .eq('isHidden', false)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getFeaturedListLeaderboard({ start = 0, end = 50, sortBy = 'flrank', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .not('flrank', 'is', null)
        .eq('isHidden', false)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getPlatformerListLeaderboard({ start = 0, end = 50, sortBy = 'plrank', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .not('plRating', 'is', null)
        .eq('isHidden', false)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getPlayersBatch(uid: string[]) {
    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .in('uid', uid)

    if (error) {
        throw new Error(error.message)
    }

    return uid.map(id => data.find(player => player.uid === id)).filter(Boolean)
}

export async function getPlayer(uid?: string, name?: string): Promise<TPlayer> {
    if (uid) {
        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .eq('uid', uid)
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return data
    } else if (name) {
        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .eq('name', name)
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return data
    }

    throw new Error('Either uid or name must be provided')
}

export async function updatePlayer(playerData: TPlayer, { updateClan = false } = {}): Promise<TPlayer> {
    const updateData = { ...playerData }

    if (!/^[A-Za-z0-9]+$/.test(updateData.name!)) {
        throw new Error("Invalid name format")
    }

    if ((updateData.isTrusted && !updateData.isAdmin) || updateData.nameLocked) {
        delete updateData.name
    }

    delete updateData.isAdmin
    delete updateData.isTrusted
    delete updateData.isBanned
    delete updateData.reviewCooldown
    delete updateData.renameCooldown
    delete updateData.rating
    delete updateData.overallRank
    delete updateData.supporterUntil
    //@ts-ignore
    delete updateData.clans
    delete updateData.discord
    delete updateData.nameLocked
    delete updateData.pointercrate

    if (!updateClan) {
        delete updateData.clan
    }

    const { error } = await supabase
        .from('players')
        .upsert(updateData as any)

    if (error) {
        const { error: updateError } = await supabase
            .from("players")
            .update(updateData as any)
            .eq("uid", playerData.uid!)

        if (updateError) {
            throw new Error(updateError.message)
        }
    }

    return await getPlayer(playerData.uid)
}

export async function extendPlayerSupporter(uid: string, month: number, day: number = 0): Promise<void> {
    const player = await getPlayer(uid)
    const DAY_MS = 24 * 60 * 60 * 1000;
    let supporterUntil: string

    if (!player.supporterUntil || new Date(player.supporterUntil) < new Date()) {
        const newDate = new Date(new Date().getTime() + month * 30 * DAY_MS + day * DAY_MS);
        supporterUntil = newDate.toISOString();
    } else {
        const newDate = new Date(new Date(player.supporterUntil).getTime() + month * 30 * DAY_MS + day * DAY_MS);
        supporterUntil = newDate.toISOString();
    }

    const { error } = await supabase
        .from('players')
        .update({ supporterUntil })
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message);
    }
}

export function isPlayerSupporterActive(playerData: { supporterUntil?: string | null }): boolean {
    if (!playerData.supporterUntil) {
        return false;
    }

    return new Date(playerData.supporterUntil) > new Date();
}

export function getPlayerTitle(playerData: TPlayer, list: string) {
    if (list == "dl") {
        if (playerData.rating! >= 6000) {
            return {
                title: "AGM",
                fullTitle: "Ascended Grandmaster",
                color:
                    "white;background: linear-gradient(to right, #ff00cc, #333399);",
            };
        }
        if (playerData.rating! >= 5000) {
            return {
                title: "LGM",
                fullTitle: "Legendary Grandmaster",
                color: "darkred",
            };
        }
        if (playerData.rating! >= 4000) {
            return {
                title: "GM",
                fullTitle: "Grandmaster",
                color: "red",
            };
        }
        if (playerData.rating! >= 3000) {
            return {
                title: "M",
                fullTitle: "Master",
                color: "hsla(321, 100%, 50%, 1)",
            };
        }
        if (playerData.rating! >= 2500) {
            return {
                title: "CM",
                fullTitle: "Candidate Master",
                color: "purple",
            };
        }
        if (playerData.rating! >= 2000) {
            return {
                title: "EX",
                fullTitle: "Expert",
                color: "blue",
            };
        }
        if (playerData.rating! >= 1500) {
            return {
                title: "SP",
                fullTitle: "Specialist",
                color: "darkcyan",
            };
        }
        if (playerData.rating! >= 1000) {
            return {
                title: "A",
                fullTitle: "A",
                color: "green",
            };
        }
        if (playerData.rating! >= 500) {
            return {
                title: "B",
                fullTitle: "B",
                color: "#413cde",
            };
        }
        if (playerData.rating! > 0) {
            return {
                title: "C",
                fullTitle: "C",
                color: "gray",
            };
        }
        return null;
    }
}

export async function updatePlayerDiscord(uid: string, discordId: string): Promise<void> {
    const { error } = await supabase
        .from("players")
        .update({ discord: discordId, DiscordDMChannelID: null })
        .eq("uid", uid)

    if (error) {
        throw new Error(error.message);
    }

    const player = await getPlayer(uid)
    await sendDirectMessage(uid, `Your Discord account is linked to [${player.name}](${FRONTEND_URL}/player/${uid}) DLVN account.`, true)
}

export async function getPlayerInventoryItems(uid: string): Promise<TInventoryItem[]> {
    type InventoryRow = Database['public']['Tables']['inventory']['Row']
    type ItemRow = Database['public']['Tables']['items']['Row']

    const { data, error } = await supabase
        .from('inventory')
        .select('*, items!inner(*)')
        .eq('userID', uid)
        .eq('consumed', false)
        .or(`expireAt.is.null,expireAt.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        return [] as TInventoryItem[]
    }

    const mapped: TInventoryItem[] = (data as (InventoryRow & { items?: ItemRow })[]).map(row => {
        const items = row.items

        const base = {
            userID: row.userID,
            itemId: row.itemId,
            content: row.content,
            created_at: row.created_at,
            inventoryId: row.id,
            useRedirect: row.redirectTo,
            expireAt: row.expireAt
        }

        const itemFields = items ? {
            name: items.name,
            type: items.type,
            redirect: items.redirect,
            productId: items.productId,
            description: items.description,
            rarity: items.rarity,
            useRedirect: base.useRedirect,
            expireAt: base.expireAt
        } : {
            name: '' as string,
            type: '' as string,
            redirect: null as string | null,
            productId: null as number | null,
            description: null as string | null,
            useRedirect: null,
            expireAt: null
        }

        return Object.assign({}, base, itemFields) as TInventoryItem
    })

    return mapped
}