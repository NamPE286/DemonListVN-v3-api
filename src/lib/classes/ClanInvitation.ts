import supabase from "@src/database/supabase";
import Clan from "@src/lib/classes/Clan";
import type { TClanInvitation } from "@src/lib/types";

interface ClanInvitation extends TClanInvitation { }

class ClanInvitation {
    constructor(data: TClanInvitation) {
        Object.assign(this, data)
    }

    async isExist() {
        const { data, error } = await supabase
            .from('clanInvitations')
            .select('*')
            .match({ to: this.to, clan: this.clan })

        if (error) {
            return false
        }

        return true
    }

    async pull() {
        const { data, error } = await supabase
            .from('clanInvitations')
            .select('*')
            .match({ to: this.to, clan: this.clan })
            .single()

        if (error || !data) {
            throw error
        }

        Object.assign(this, data)
    }

    async update() {
        const { error } = await supabase
            .from('clanInvitations')
            .upsert(this as any)

        if (error) {
            throw error
        }
    }

    async accept() {
        if (!(await this.isExist())) {
            throw new Error('Invalid invitation')
        }

        const clan = new Clan({ id: this.clan })
        await clan.addMember(this.to!)

        const { error } = await supabase
            .from('clanInvitations')
            .delete()
            .eq('to', this.to!)
    }

    async reject() {
        if (!(await this.isExist())) {
            throw new Error('Invalid invitation')
        }

        const { error } = await supabase
            .from('clanInvitations')
            .delete()
            .match({ to: this.to, clan: this.clan })

        if (error) {
            throw error
        }
    }
}

export default ClanInvitation