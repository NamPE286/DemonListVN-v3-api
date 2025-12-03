import supabase from "@src/client/supabase"
import type { Database } from '@src/types/supabase'

type Clan = Database['public']['Tables']['clans']['Update']

export async function getClans({ start = 0, end = 50, sortBy = 'boostedUntil', ascending = 'false', searchQuery = '' } = {}) {
    let query = supabase
        .from('clans')
        .select('*, players!owner(*, clans!id(*))')

    if (searchQuery.length) {
        query = query.ilike('name', `%${searchQuery}%`)
    }

    query = query
        .order(sortBy, { ascending: ascending == 'true' })
        .range(start, end)

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return data
}
export async function pullClan(id: number) {
    const { data, error } = await supabase
        .from('clans')
        .select('*, players!owner(*, clans!id(*))')
        .eq('id', id)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function createClan(clanData: Clan) {
    if (clanData.memberLimit && clanData.memberLimit < 0) {
        throw new Error('Invalid member limit')
    }

    const { data, error } = await supabase
        .from('clans')
        .insert(clanData as any)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    // Import player service functions
    const { pullPlayer, updatePlayer } = await import('@src/services/player.service')
    const player = await pullPlayer(data.owner)

    const updatedPlayer = { ...player, clan: data.id }
    await updatePlayer(updatedPlayer, { updateClan: true })

    return await pullClan(data.id)
}

export async function updateClan(clanData: Clan) {
    const { pullPlayer } = await import('@src/services/player.service')
    const player = await pullPlayer(clanData.owner!)

    if (player.clan != clanData.id) {
        throw new Error("Cannot give ownership. This player is not this clan's member")
    }

    if (clanData.memberLimit && clanData.memberLimit < 0) {
        throw new Error('Invalid member limit')
    }

    const updateData = structuredClone(clanData)

    if (!isBoostActive(clanData.boostedUntil)) {
        delete updateData.homeContent
    }

    delete updateData.boostedUntil

    const { error } = await supabase
        .from('clans')
        .update(clanData)
        .eq('id', clanData.id!)

    if (error) {
        throw new Error(error.message)
    }

    return await pullClan(clanData.id!)
}

export async function fetchClanMembers(clanId: number, { start = 0, end = 50, sortBy = 'rating', ascending = 'false' } = {}) {
    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .eq('clan', clanId)
        .eq('isHidden', false)
        .order(sortBy, { ascending: ascending == 'true', nullsFirst: false })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function addClanMember(clanId: number, uid: string) {
    const clan = await pullClan(clanId)

    if (clan.memberCount! >= clan.memberLimit! && clan.memberLimit != 0) {
        throw new Error('Member limit exceeded')
    }

    const { pullPlayer, updatePlayer } = await import('@src/services/player.service')
    const player = await pullPlayer(uid)

    if (player.clan) {
        throw new Error('Player is already in a clan')
    }

    const tmp = clan
    //@ts-ignore
    delete tmp.players
    tmp.memberCount!++
    await updateClan(tmp)

    const updatedPlayer = { ...player, clan: clanId }
    await updatePlayer(updatedPlayer, { updateClan: true })

    return await pullClan(clanId)
}

export async function removeClanMember(clanId: number, uid: string) {
    const clan = await pullClan(clanId)
    const { pullPlayer, updatePlayer } = await import('@src/services/player.service')
    const player = await pullPlayer(uid)

    if (player.clan != clanId) {
        throw new Error('Player is not in this clan')
    }

    const tmp = clan
    //@ts-ignore
    delete tmp.players
    tmp.memberCount!--
    await updateClan(tmp)

    const updatedPlayer = { ...player, clan: null }
    await updatePlayer(updatedPlayer, { updateClan: true })

    return await pullClan(clanId)
}

export async function invitePlayerToClan(clanId: number, uid: string) {
    const { pullPlayer } = await import('@src/services/player.service')
    const player = await pullPlayer(uid)

    if (player.clan) {
        throw new Error('Player is already in a clan')
    }

    const { updateInvitation } = await import('@src/services/clanInvitation.service')
    const { sendNotification } = await import('@src/services/notification.service')
    
    const clan = await pullClan(clanId)
    await updateInvitation({ to: player.uid, clan: clanId })
    await sendNotification({ to: uid, content: `You've been invited to ${clan.name} clan!`, redirect: `/clan/${clanId}` })
}

export async function fetchClanRecords(clanId: number, { start = 0, end = 50, sortBy = 'dlPt', ascending = 'false' } = {}) {
    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid!inner(*, clans!id(*)), levels(*)')
        .eq('players.clan', clanId)
        .eq('players.isHidden', false)
        .eq('isChecked', true)
        .not(sortBy, 'is', null)
        .order(sortBy, { ascending: ascending == 'true' })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function extendClanBoost(clanId: number, day: number) {
    const clan = await pullClan(clanId)
    let boostedUntil: string

    if (!clan.boostedUntil || new Date(clan.boostedUntil) < new Date()) {
        const boostedUntilDate = new Date(new Date().getTime() + day * 24 * 60 * 60 * 1000);
        boostedUntil = boostedUntilDate.toISOString();
    } else {
        const boostedUntilDate = new Date(new Date(clan.boostedUntil).getTime() + day * 24 * 60 * 60 * 1000);
        boostedUntil = boostedUntilDate.toISOString();
    }

    const { error } = await supabase
        .from('clans')
        .update({ boostedUntil: boostedUntil })
        .eq('id', clanId)

    if (error) {
        throw new Error(error.message);
    }
}

export function isBoostActive(boostedUntil: string | null | undefined) {
    if (!boostedUntil) {
        return false;
    }

    return new Date(boostedUntil) > new Date();
}
