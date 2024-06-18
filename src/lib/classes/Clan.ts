import supabase from '@database/supabase'
import ClanInvitation from '@src/lib/classes/ClanInvitation'
import Player from '@src/lib/classes/Player'
import Record from '@src/lib/classes/Record'
import { sendNotification } from '@src/lib/client'
import type { Database } from '@src/lib/types/supabase'

type Data = Database['public']['Tables']['clans']['Update']

class Clan {
    #synced = false
    data: Data

    constructor(data: any) {
        this.data = data
    }

    async pull() {
        var { data, error } = await supabase
            .from('clans')
            .select('*, players!owner(*, clans!id(*))')
            .eq('id', this.data.id!)
            .single()

        if (error) {
            throw error
        }

        // @ts-ignore
        this.data = data
        this.#synced = true
    }

    async create() {
        if (this.data.memberLimit && this.data.memberLimit < 0) {
            throw new Error('Invalid member limit')
        }

        const { data, error } = await supabase
            .from('clans')
            .insert(this.data as any)
            .select()
            .single()

        if (error) {
            throw error
        }

        const player = new Player({ uid: data.owner })
        await player.pull()

        player.data.clan = data.id
        this.data.id = data.id

        await player.update({ updateClan: true })
        await this.pull()
    }

    async update() {
        const player = new Player({ uid: this.data.owner! })
        await player.pull()

        if (player.data.clan != this.data.id) {
            throw new Error('Cannot give ownership. This player is not this clan\' member')
        }

        if (this.data.memberLimit && this.data.memberLimit < 0) {
            throw new Error('Invalid member limit')
        }

        const { error } = await supabase
            .from('clans')
            .update(this.data)
            .eq('id', this.data.id!)

        if (error) {
            throw error
        }

        await this.pull()
    }

    async fetchMembers({ start = 0, end = 50, sortBy = 'rating', ascending = 'false' } = {}) {
        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .eq('clan', this.data.id!)
            .eq('isHidden', false)
            .order(sortBy, { ascending: ascending == 'true', nullsFirst: false })
            .range(start, end)

        if (error) {
            throw error
        }

        return data
    }

    async addMember(uid: string) {
        await this.pull()

        if (this.data.memberCount! >= this.data.memberLimit! && this.data.memberLimit != 0) {
            throw new Error('Member limit exceeded')
        }

        const player = new Player({ uid: uid })
        await player.pull()

        if (player.data.clan) {
            throw new Error('Player is already in a clan')
        }


        const tmp = this
        //@ts-ignore
        delete tmp.data.players
        tmp.data.memberCount!++
        await tmp.update()

        player.data.clan = this.data.id
        await player.update({ updateClan: true })
        await this.pull()
    }

    async removeMember(uid: string) {
        await this.pull()
        const player = new Player({ uid: uid })
        await player.pull()

        if (player.data.clan != this.data.id) {
            throw new Error('Player is not in this clan')
        }

        const tmp = this
        //@ts-ignore
        delete tmp.data.players
        tmp.data.memberCount!--
        await tmp.update()

        player.data.clan = null
        await player.update({ updateClan: true })
        await this.pull()
    }

    async invite(uid: string) {
        const player = new Player({ uid: uid })
        await player.pull()

        if (player.data.clan) {
            throw new Error('Player is already in a clan')
        }

        const invitation = new ClanInvitation({ to: player.data.uid, clan: this.data.id! })
        await invitation.update()
        await sendNotification({ to: uid, content: `You've been invited to ${this.data.name} clan!`, redirect: `/clan/${this.data.id}` })
    }

    async fetchRecords({ start = 0, end = 50, sortBy = 'dlPt', ascending = 'false' } = {}) {
        const { data, error } = await supabase
            .from('records')
            .select('*, players!userid!inner(*, clans!id(*)), levels(*)')
            .eq('players.clan', this.data.id!)
            .eq('players.isHidden', false)
            .eq('isChecked', true)
            .not(sortBy, 'is', null)
            .order(sortBy, { ascending: ascending == 'true' })
            .range(start, end)

        if (error) {
            throw error
        }

        return data
    }
}

export default Clan