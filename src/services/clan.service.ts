import supabase from "@src/client/supabase"
import type { Database } from '@src/types/supabase'
import Player from '@src/classes/Player'
import { sendNotification } from '@src/services/notification.service'
import { getPlayer, updatePlayer } from '@src/services/player.service'
import type { TClan, TClanInvitation } from '@src/types'

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

export async function getClan(clanId: number): Promise<Clan> {
    const { data, error } = await supabase
        .from('clans')
        .select('*, players!owner(*, clans!id(*))')
        .eq('id', clanId)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function createClan(clanData: TClan): Promise<TClan> {
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

    const player = await getPlayer(data.owner)

    await updatePlayer({ ...player, clan: data.id }, { updateClan: true })
    
    const updatedClanData = await getClan(data.id)
    return updatedClanData as TClan
}

export async function updateClan(clanData: TClan): Promise<TClan> {
    const player = await getPlayer(clanData.owner!)

    if (player.clan != clanData.id) {
        throw new Error("Cannot give ownership. This player is not this clan's member")
    }

    if (clanData.memberLimit && clanData.memberLimit < 0) {
        throw new Error('Invalid member limit')
    }

    const updateData = structuredClone(clanData)

    if (!isBoostActive(clanData)) {
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

    const updatedClanData = await getClan(clanData.id!)
    return updatedClanData as TClan
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

export async function addClanMember(clanId: number, uid: string): Promise<TClan> {
    const clanData = await getClan(clanId)

    if (clanData.memberCount! >= clanData.memberLimit! && clanData.memberLimit != 0) {
        throw new Error('Member limit exceeded')
    }

    const player = await getPlayer(uid)

    if (player.clan) {
        throw new Error('Player is already in a clan')
    }

    const tmp = clanData as any
    delete tmp.players
    tmp.memberCount!++
    
    const { error } = await supabase
        .from('clans')
        .update({ memberCount: tmp.memberCount })
        .eq('id', clanId)

    if (error) {
        throw new Error(error.message)
    }

    await updatePlayer({ ...player, clan: clanId }, { updateClan: true })
    
    const updatedClanData = await getClan(clanId)
    return updatedClanData as TClan
}

export async function removeClanMember(clanId: number, uid: string): Promise<TClan> {
    const clanData = await getClan(clanId)
    
    const player = await getPlayer(uid)

    if (player.clan != clanId) {
        throw new Error('Player is not in this clan')
    }

    const tmp = clanData as any
    delete tmp.players
    tmp.memberCount!--
    
    const { error } = await supabase
        .from('clans')
        .update({ memberCount: tmp.memberCount })
        .eq('id', clanId)

    if (error) {
        throw new Error(error.message)
    }

    await updatePlayer({ ...player, clan: null }, { updateClan: true })
    
    const updatedClanData = await getClan(clanId)
    return updatedClanData as TClan
}

export async function inviteToClan(clanId: number, clanName: string, uid: string): Promise<void> {
    const player = await getPlayer(uid)

    if (player.clan) {
        throw new Error('Player is already in a clan')
    }

    await upsertClanInvitation({ to: player.uid, clan: clanId })
    await sendNotification({ to: uid, content: `You've been invited to ${clanName} clan!`, redirect: `/clan/${clanId}` })
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

export async function extendClanBoost(clanId: number, day: number): Promise<void> {
    const clanData = await getClan(clanId)
    let boostedUntil: string

    if (!clanData.boostedUntil || new Date(clanData.boostedUntil) < new Date()) {
        const newDate = new Date(new Date().getTime() + day * 24 * 60 * 60 * 1000);
        boostedUntil = newDate.toISOString();
    } else {
        const newDate = new Date(new Date(clanData.boostedUntil).getTime() + day * 24 * 60 * 60 * 1000);
        boostedUntil = newDate.toISOString();
    }

    const { error } = await supabase
        .from('clans')
        .update({ boostedUntil })
        .eq('id', clanId)

    if (error) {
        throw new Error(error.message);
    }
}

export function isBoostActive(clanData: { boostedUntil?: string | null }): boolean {
    if (!clanData.boostedUntil) {
        return false;
    }

    return new Date(clanData.boostedUntil) > new Date();
}

// Clan Invitation Functions

export async function clanInvitationExists(to: string, clanId: number): Promise<boolean> {
    const { data, error } = await supabase
        .from('clanInvitations')
        .select('*')
        .match({ to, clan: clanId })

    if (error) {
        return false
    }

    return data.length > 0
}

export async function getClanInvitation(to: string, clanId: number): Promise<TClanInvitation> {
    const { data, error } = await supabase
        .from('clanInvitations')
        .select('*')
        .match({ to, clan: clanId })
        .single()

    if (error || !data) {
        throw new Error(error?.message || 'Invitation not found')
    }

    return data
}

export async function upsertClanInvitation(invitation: TClanInvitation): Promise<void> {
    const { error } = await supabase
        .from('clanInvitations')
        .upsert(invitation as any)

    if (error) {
        throw new Error(error.message)
    }
}

export async function acceptClanInvitation(to: string, clanId: number): Promise<void> {
    if (!(await clanInvitationExists(to, clanId))) {
        throw new Error('Invalid invitation')
    }

    await addClanMember(clanId, to)

    const { error } = await supabase
        .from('clanInvitations')
        .delete()
        .eq('to', to)

    if (error) {
        throw new Error(error.message)
    }
}

export async function rejectClanInvitation(to: string, clanId: number): Promise<void> {
    if (!(await clanInvitationExists(to, clanId))) {
        throw new Error('Invalid invitation')
    }

    const { error } = await supabase
        .from('clanInvitations')
        .delete()
        .match({ to, clan: clanId })

    if (error) {
        throw new Error(error.message)
    }
}