import supabase from '@src/client/supabase'
import { sendDirectMessage } from '@src/services/discord.service'
import type { TInventoryItem, TPlayer } from '@src/types'
import type { Database } from '@src/types/supabase'
import { FRONTEND_URL } from '@src/config/url'

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

export async function getChallengeListLeaderboard({ start = 0, end = 50, sortBy = 'clrank', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .not('clRating', 'is', null)
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

export async function getPlayer(uid?: string, name?: string) {
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

type Strict<T> = {
    [K in keyof T]-?: NonNullable<T[K]>
}

export function getPlayerTitle(player: Strict<TPlayer>, list: string) {
    if (list == 'dl') {
        if (player.overallRank <= 1) {
            return {
                title: 'AGM',
                fullTitle: 'Ascended Grandmaster',
                color: 'white;background: linear-gradient(to right, #ff00cc, #333399);'
            };
        }
        if (player.overallRank <= 5) {
            return {
                title: 'LGM',
                fullTitle: 'Legendary Grandmaster',
                color: 'darkred'
            };
        }
        if (player.overallRank <= 15) {
            return {
                title: 'GM',
                fullTitle: 'Grandmaster',
                color: 'red'
            };
        }
        if (player.rating >= 3500) {
            return {
                title: 'M',
                fullTitle: 'Master',
                color: 'hsla(321, 100%, 50%, 1)'
            };
        }
        if (player.rating >= 2500) {
            return {
                title: 'CM',
                fullTitle: 'Candidate Master',
                color: 'purple'
            };
        }
        if (player.rating >= 2000) {
            return {
                title: 'EX',
                fullTitle: 'Expert',
                color: 'blue'
            };
        }
        if (player.rating >= 1500) {
            return {
                title: 'SP',
                fullTitle: 'Specialist',
                color: 'darkcyan'
            };
        }
        if (player.rating >= 1000) {
            return {
                title: 'A',
                fullTitle: 'A',
                color: 'green'
            };
        }
        if (player.rating >= 500) {
            return {
                title: 'B',
                fullTitle: 'B',
                color: '#413cde'
            };
        }
        if (player.rating > 0) {
            return {
                title: 'C',
                fullTitle: 'C',
                color: 'gray'
            };
        }
        return null;
    }

    if (list == 'cl') {
        if (player.clrank <= 5) {
            return {
                title: 'V',
                fullTitle: 'Challenger V',
                color: 'darkred'
            };
        }
        if (player.clrank <= 15) {
            return {
                title: 'IV',
                fullTitle: 'Challenger IV',
                color: 'red'
            };
        }
        if (player.clRating >= 2500) {
            return {
                title: 'III',
                fullTitle: 'Challenger III',
                color: 'hsla(321, 100%, 50%, 1)'
            };
        }
        if (player.clRating >= 2000) {
            return {
                title: 'II',
                fullTitle: 'Challenger II',
                color: 'purple'
            };
        }
        if (player.clRating >= 1500) {
            return {
                title: 'I',
                fullTitle: 'Challenger I',
                color: 'blue'
            };
        }
        if (player.clRating >= 1000) {
            return {
                title: 'S',
                fullTitle: 'S',
                color: 'gold'
            };
        }
        if (player.clRating >= 600) {
            return {
                title: 'A',
                fullTitle: 'A',
                color: '#413cde'
            };
        }
        if (player.clRating >= 300) {
            return {
                title: 'B',
                fullTitle: 'B',
                color: 'gray'
            };
        }
        if (player.clRating > 0) {
            return {
                title: 'C',
                fullTitle: 'C',
                color: 'gray'
            };
        }
        return null;
    }

    if (list == 'elo') {
        if (player.matchCount < 5) {
            return {
                fullTitle: `Need ${5 - player.matchCount} more contest to be ranked`
            };
        }

        if (player.elo >= 2400) {
            return {
                fullTitle: 'Global Elite',
                title: 'GE',
                color: 'darkred'
            };
        }

        if (player.elo >= 2200) {
            return {
                fullTitle: 'Elite',
                title: 'E',
                color: 'red'
            };
        }

        if (player.elo >= 2000) {
            return {
                fullTitle: 'Eternal',
                title: 'ET',
                color: 'hsla(321, 100%, 50%, 1)'
            };
        }

        if (player.elo >= 1800) {
            return {
                fullTitle: 'Mythic',
                title: 'M',
                color: 'purple'
            };
        }

        if (player.elo >= 1600) {
            return {
                fullTitle: 'Diamond',
                title: 'DM',
                color: 'darkcyan'
            };
        }

        if (player.elo >= 1400) {
            return {
                fullTitle: 'Gold',
                title: 'GD',
                color: '#bda700'
            };
        }

        if (player.elo >= 1200) {
            return {
                fullTitle: 'Silver',
                title: 'SV',
                color: 'gray'
            };
        }

        if (player.elo >= 1000) {
            return {
                fullTitle: 'Iron',
                title: 'I',
                color: 'gray'
            };
        }

        return {
            fullTitle: 'Plastic',
            title: 'P',
            color: 'gray'
        };
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
    await sendDirectMessage(uid, `Tài khoản Discord của bạn đã được liên kết với tài khoản DLVN [${player.name}](${FRONTEND_URL}/player/${uid}).`, true)
}

export async function getPlayerInventoryItems(uid: string, filters?: { itemType?: string; itemId?: number }): Promise<TInventoryItem[]> {
    type InventoryRow = Database['public']['Tables']['inventory']['Row']
    type ItemRow = Database['public']['Tables']['items']['Row']

    let query = supabase
        .from('inventory')
        .select('*, items!inner(*)')
        .eq('userID', uid)
        .eq('consumed', false)
        .or(`expireAt.is.null,expireAt.gt.${new Date().toISOString()}`)

    if (filters?.itemType) {
        query = query.eq('items.type', filters.itemType)
    }

    if (filters?.itemId) {
        query = query.eq('itemId', filters.itemId)
    }

    const { data, error } = await query
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
            expireAt: row.expireAt,
            inventoryQuantity: row.quantity
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

export async function getTopBuyers(interval: number, limit: number, offset: number) {
    const { data, error } = await supabase
        .rpc('get_top_buyers', {
            interval_ms: interval,
            limit_count: limit,
            offset_count: offset
        })

    if (error) {
        throw new Error(error.message)
    }

    const uids = []

    for (const i of data) {
        uids.push(i.uid)
    }

    const players = getPlayersBatch(uids)
    const playerMap = new Map((await players).map(p => [p!.uid, p]));
    const res = data.map(i => ({
        player: playerMap.get(i.uid),
        totalAmount: i.totalAmount
    }));

    return res;
}