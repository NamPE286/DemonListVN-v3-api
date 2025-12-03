import supabase from "@src/client/supabase";
import type { TClanInvitation } from "@src/types";

export async function isInvitationExist(to: string, clan: number) {
    const { data, error } = await supabase
        .from('clanInvitations')
        .select('*')
        .match({ to: to, clan: clan })

    if (error) {
        return false
    }

    return true
}

export async function pullInvitation(to: string, clan: number) {
    const { data, error } = await supabase
        .from('clanInvitations')
        .select('*')
        .match({ to: to, clan: clan })
        .single()

    if (error || !data) {
        throw new Error(error.message)
    }

    return data
}

export async function updateInvitation(invitation: TClanInvitation) {
    const { error } = await supabase
        .from('clanInvitations')
        .upsert(invitation as any)

    if (error) {
        throw new Error(error.message)
    }
}

export async function acceptInvitation(to: string, clan: number) {
    if (!(await isInvitationExist(to, clan))) {
        throw new Error('Invalid invitation')
    }

    const { addClanMember } = await import('@src/services/clan.service')
    await addClanMember(clan, to)

    const { error } = await supabase
        .from('clanInvitations')
        .delete()
        .eq('to', to)
}

export async function rejectInvitation(to: string, clan: number) {
    if (!(await isInvitationExist(to, clan))) {
        throw new Error('Invalid invitation')
    }

    const { error } = await supabase
        .from('clanInvitations')
        .delete()
        .match({ to: to, clan: clan })

    if (error) {
        throw new Error(error.message)
    }
}
