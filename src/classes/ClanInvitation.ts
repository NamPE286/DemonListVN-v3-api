import supabase from "@src/client/supabase";
import { addClanMember } from "@src/services/clan.service";
import type { TClanInvitation } from "@src/types";

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
            throw new Error(error.message)
        }

        Object.assign(this, data)
    }

    async update() {
        const { error } = await supabase
            .from('clanInvitations')
            .upsert(this as any)

        if (error) {
            throw new Error(error.message)
        }
    }

    async accept() {
        if (!(await this.isExist())) {
            throw new Error('Invalid invitation')
        }

        await addClanMember(this.clan!, this.to!)

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
            throw new Error(error.message)
        }
    }
}

export default ClanInvitation