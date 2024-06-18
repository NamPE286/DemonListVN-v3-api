import supabase from "@src/database/supabase";
import Clan from "@src/lib/classes/Clan";
import type { Database } from '@src/lib/types/supabase'

type Data = Database['public']['Tables']['clanInvitations']['Update']

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

    async pull() {
        const { data, error } = await supabase
            .from('clanInvitations')
            .select('*')
            .match({ to: this.data.to, clan: this.data.clan })
            .single()

        if (error || !data) {
            throw error
        }

        this.data = data
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

        const clan = new Clan({ id: this.data.clan })
        await clan.addMember(this.data.to!)

        const { error } = await supabase
            .from('clanInvitations')
            .delete()
            .eq('to', this.data.to)
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