import supabase from "@src/database/supabase";
import Player from "@src/lib/classes/Player";

interface Data {
    id?: number
    created_at?: string
    to: string
    clan: number
}

class ClanInvitation {
    data: Data

    constructor(data: Data) {
        this.data = data
    }

    async isExist() {
        const { data, error } = await supabase
            .from('clanInvitations')
            .select('*')
            .match({ to: this.data.to, clan: this.data.clan })

        if (error) {
            return false
        }

        return true
    }

    async update() {
        const { error } = await supabase
            .from('clanInvitations')
            .upsert(this.data)

        if (error) {
            throw error
        }
    }

    async accept() {
        if (!(await this.isExist())) {
            throw new Error('Invalid invitation')
        }

        const player = new Player({ uid: this.data.to! })
        await player.pull()
        
        player.data.clan = this.data.clan

        await player.update({updateClan: true})

        const { error } = await supabase
            .from('clanInvitations')
            .delete()
            .eq('to', this.data.to)

        if (error) {
            throw error
        }
    }

    async reject() {
        if (!(await this.isExist())) {
            throw new Error('Invalid invitation')
        }
        
        const { error } = await supabase
            .from('clanInvitations')
            .delete()
            .match({ to: this.data.to, clan: this.data.clan })

        if (error) {
            throw error
        }
    }
}

export default ClanInvitation