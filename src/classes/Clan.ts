import supabase from '@src/client/supabase'
import ClanInvitation from '@src/classes/ClanInvitation'
import Player from '@src/classes/Player'
import { sendNotification } from '@src/services/notification.service'
import { getClan } from '@src/services/clan.service'
import type { TClan } from '@src/types'

interface Clan extends TClan { }

class Clan {
    constructor(data: TClan) {
        Object.assign(this, data)
    }

    async create() {
        if (this.memberLimit && this.memberLimit < 0) {
            throw new Error('Invalid member limit')
        }

        const { data, error } = await supabase
            .from('clans')
            .insert(this as any)
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        const player = new Player({ uid: data.owner })
        await player.pull()

        player.clan = data.id
        this.id = data.id

        await player.update({ updateClan: true })
        
        const clanData = await getClan(this.id!)
        Object.assign(this, clanData)
    }

    async update() {
        const player = new Player({ uid: this.owner! })
        await player.pull()

        if (player.clan != this.id) {
            throw new Error("Cannot give ownership. This player is not this clan's member")
        }

        if (this.memberLimit && this.memberLimit < 0) {
            throw new Error('Invalid member limit')
        }

        const updateData = structuredClone(this)

        if (!this.isBoostActive()) {
            delete updateData.homeContent
        }

        delete updateData.boostedUntil

        const { error } = await supabase
            .from('clans')
            .update(this)
            .eq('id', this.id!)

        if (error) {
            throw new Error(error.message)
        }

        const clanData = await getClan(this.id!)
        Object.assign(this, clanData)
    }

    async fetchMembers({ start = 0, end = 50, sortBy = 'rating', ascending = 'false' } = {}) {
        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .eq('clan', this.id!)
            .eq('isHidden', false)
            .order(sortBy, { ascending: ascending == 'true', nullsFirst: false })
            .range(start, end)

        if (error) {
            throw new Error(error.message)
        }

        return data
    }

    async addMember(uid: string) {
        const clanData = await getClan(this.id!)
        Object.assign(this, clanData)

        if (this.memberCount! >= this.memberLimit! && this.memberLimit != 0) {
            throw new Error('Member limit exceeded')
        }

        const player = new Player({ uid: uid })
        await player.pull()

        if (player.clan) {
            throw new Error('Player is already in a clan')
        }


        const tmp = this
        //@ts-ignore
        delete tmp.players
        tmp.memberCount!++
        await tmp.update()

        player.clan = this.id
        await player.update({ updateClan: true })
        
        const updatedClanData = await getClan(this.id!)
        Object.assign(this, updatedClanData)
    }

    async removeMember(uid: string) {
        const clanData = await getClan(this.id!)
        Object.assign(this, clanData)
        
        const player = new Player({ uid: uid })
        await player.pull()

        if (player.clan != this.id) {
            throw new Error('Player is not in this clan')
        }

        const tmp = this
        //@ts-ignore
        delete tmp.players
        tmp.memberCount!--
        await tmp.update()

        player.clan = null
        await player.update({ updateClan: true })
        
        const updatedClanData = await getClan(this.id!)
        Object.assign(this, updatedClanData)
    }

    async invite(uid: string) {
        const player = new Player({ uid: uid })
        await player.pull()

        if (player.clan) {
            throw new Error('Player is already in a clan')
        }

        const invitation = new ClanInvitation({ to: player.uid, clan: this.id! })
        await invitation.update()
        await sendNotification({ to: uid, content: `You've been invited to ${this.name} clan!`, redirect: `/clan/${this.id}` })
    }

    async fetchRecords({ start = 0, end = 50, sortBy = 'dlPt', ascending = 'false' } = {}) {
        const { data, error } = await supabase
            .from('records')
            .select('*, players!userid!inner(*, clans!id(*)), levels(*)')
            .eq('players.clan', this.id!)
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

    async extendBoost(day: number) {
        if (!this.boostedUntil || new Date(this.boostedUntil) < new Date()) {
            const boostedUntil = new Date(new Date().getTime() + day * 24 * 60 * 60 * 1000);
            this.boostedUntil = boostedUntil.toISOString();
        } else {
            const boostedUntil = new Date(new Date(this.boostedUntil).getTime() + day * 24 * 60 * 60 * 1000);
            this.boostedUntil = boostedUntil.toISOString();
        }

        const { error } = await supabase
            .from('clans')
            .update({ boostedUntil: this.boostedUntil })
            .eq('id', this.id!)

        if (error) {
            throw new Error(error.message);
        }
    }

    isBoostActive() {
        if (!this.boostedUntil) {
            return false;
        }

        return new Date(this.boostedUntil) > new Date();
    }
}

export default Clan