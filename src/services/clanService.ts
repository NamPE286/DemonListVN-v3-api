import supabase from '@src/database/supabase'
import Clan from '@src/lib/classes/Clan'
import ClanInvitation from '@src/lib/classes/ClanInvitation'

class ClanService {
    async isOwner(uid: string, clanID: number): Promise<boolean> {
        const clan = new Clan({ id: clanID })

        await clan.pull()

        return uid == clan.owner
    }

    async createClan(clanData: any, ownerUid: string): Promise<Clan> {
        clanData.owner = ownerUid
        delete clanData.id

        const clan = new Clan(clanData)

        await clan.create()

        return clan
    }

    async getUserInvitations(uid: string) {
        const { data, error } = await supabase
            .from('clanInvitations')
            .select('*, clans(*, players!owner(*, clans!id(*)))')
            .eq('to', uid)

        if (error) {
            throw error
        }

        return data
    }

    async getClan(id: number): Promise<Clan> {
        const clan = new Clan({ id })

        await clan.pull()

        return clan
    }

    async updateClan(id: number, clanData: any): Promise<void> {
        clanData.id = id
        const clan = new Clan(clanData)

        await clan.update()
    }

    async deleteClan(id: number): Promise<void> {
        const { error } = await supabase
            .from('clans')
            .delete()
            .eq('id', id)

        if (error) {
            throw error
        }

        await supabase
            .storage
            .from('clanPhotos')
            .remove([`${id}.jpg`])
    }

    async getClanMembers(id: number, query: any) {
        const clan = new Clan({ id })

        return await clan.fetchMembers(query)
    }

    async getClanRecords(id: number, query: any) {
        const clan = new Clan({ id })

        return await clan.fetchRecords(query)
    }

    async invitePlayer(clanId: number, uid: string): Promise<void> {
        const clan = new Clan({ id: clanId })

        await clan.pull()
        await clan.invite(uid)
    }

    async acceptInvitation(uid: string, clanId: number): Promise<void> {
        const invitation = new ClanInvitation({ to: uid, clan: clanId })

        await invitation.accept()
    }

    async rejectInvitation(uid: string, clanId: number): Promise<void> {
        const invitation = new ClanInvitation({ to: uid, clan: clanId })

        await invitation.reject()
    }

    async leaveClan(uid: string, clanId: number): Promise<void> {
        const clan = new Clan({ id: clanId })

        await clan.pull()

        if (uid == clan.owner) {
            throw new Error('Owner cannot leave clan')
        }

        await clan.removeMember(uid)
    }

    async joinClan(uid: string, clanId: number): Promise<void> {
        const clan = new Clan({ id: clanId })

        await clan.pull()

        if (!clan.isPublic) {
            throw new Error('Clan is not public')
        }

        await clan.addMember(uid)

        const { error } = await supabase
            .from('clanInvitations')
            .delete()
            .eq('to', uid)
    }

    async getInvitation(clanId: number, uid: string): Promise<ClanInvitation> {
        const invitation = new ClanInvitation({ clan: clanId, to: uid })

        await invitation.pull()

        return invitation
    }

    async deleteInvitation(clanId: number, uid: string): Promise<void> {
        const invitation = new ClanInvitation({ clan: clanId, to: uid })

        await invitation.reject()
    }

    async kickMember(clanId: number, uid: string): Promise<void> {
        const clan = new Clan({ id: clanId })

        await clan.pull()
        await clan.removeMember(uid)
    }

    async getClanInvitations(clanId: number) {
        const { data, error } = await supabase
            .from('clanInvitations')
            .select('*, players(*)')
            .eq('clan', clanId)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        return data
    }

    async getClanList(clanId: number, list: string, from: number, to: number) {
        let x = '', isPlat = false

        if (list == 'dl') {
            x = 'rating'; isPlat = false
        } else if (list == 'pl') {
            x = 'rating'; isPlat = true
        } else if (list == 'fl') {
            x = 'flPt'; isPlat = false
        }

        const { data, error } = await supabase
            .from('levels')
            .select('*, records!inner(userid, levelid, isChecked, players!public_records_userid_fkey!inner(uid, clan))')
            .eq("records.players.clan", clanId)
            .eq("records.isChecked", true)
            .eq('isPlatformer', isPlat)
            .not(x, 'is', null)
            .order(x, { ascending: false })
            .range(from, to)

        if (error) {
            throw error
        }

        for (const i of data) {
            // @ts-ignore
            delete i.records
        }

        return data
    }
}

export default new ClanService()
