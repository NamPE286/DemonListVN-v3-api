import supabase from '@database/supabase'
import ClanInvitation from '@src/lib/classes/ClanInvitation'
import Player from '@src/lib/classes/Player'
import Record from '@src/lib/classes/Record'

interface Data {
    id: number
    created_at?: string
    name?: string
    tag?: string
    owner?: string
}

class Clan {
    #synced = false
    data: Data

    constructor(data: Data) {
        this.data = data
    }

    async pull() {
        const { data, error } = await supabase
            .from('clans')
            .select('*')
            .eq('id', this.data.id)
            .single()

        if (error) {
            throw error
        }

        this.data = data
        this.#synced = true
    }

    async update() {
        const { error } = await supabase
            .from('clans')
            .upsert(this.data)

        if (error) {
            throw error
        }

        await this.pull()
    }

    async addMember(uid: string) {
        const player = new Player({ uid: uid })
        await player.pull()

        if (player.data.clan) {
            throw new Error('Player is already in a clan')
        }

        player.data.clan = this.data.id
        await player.update()
    }

    async removeMember(uid: string) {
        const player = new Player({ uid: uid })
        await player.pull()

        if (player.data.clan != this.data.id) {
            throw new Error('Player is not in this clan')
        }

        player.data.clan = NaN
        await player.update()
    }

    async invite(uid: string) {
        const player = new Player({ uid: uid })
        await player.pull()

        if (player.data.clan) {
            throw new Error('Player is already in a clan')
        }

        const invitation = new ClanInvitation({ to: player.data.uid, clan: this.data.id })
        await invitation.update()
    }

    async fetchRecords() {
        const { data, error } = await supabase
            .from('records')
            .select('*, players!userid!inner(*)')
            .eq('players.clan', this.data.id)

        if (error) {
            throw error
        }

        return data
    }
}

export default Clan