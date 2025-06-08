import supabase from '@database/supabase'
import type { TPlayer } from '@src/lib/types'

interface Player extends TPlayer { }

class Player {
    constructor(data: TPlayer) {
        Object.assign(this, data)
    }

    async pull() {
        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .eq('uid', this.uid!)
            .single()

        if (error) {
            throw error
        }

        Object.assign(this, data)
    }

    async update({ updateClan = false } = {}) {
        const updateData = this

        if (updateData.isTrusted && !updateData.isAdmin) {
            delete updateData.name
        }

        delete updateData.isAdmin
        delete updateData.isTrusted
        delete updateData.isBanned
        delete updateData.reviewCooldown
        delete updateData.renameCooldown
        delete updateData.rating
        delete updateData.overallRank
        delete updateData.supporterUntil
        //@ts-ignore
        delete updateData.clans
        delete updateData.discord

        if (!updateClan) {
            delete this.clan
        }

        const { error } = await supabase
            .from('players')
            .upsert(this as any)

        if (error) {
            const { error } = await supabase
                .from("players")
                .update(this as any)
                .eq("uid", this.uid!)

            if (error) {
                throw error
            }
        }

        await this.pull()
    }

    async extendSupporter(month: number) {
        if (!this.supporterUntil || new Date(this.supporterUntil) < new Date()) {
            const supporterUntil = new Date(new Date().getTime() + month * 30 * 24 * 60 * 60 * 1000);
            this.supporterUntil = supporterUntil.toISOString();
        } else {
            const supporterUntil = new Date(new Date(this.supporterUntil).getTime() + month * 30 * 24 * 60 * 60 * 1000);
            this.supporterUntil = supporterUntil.toISOString();
        }

        const { error } = await supabase
            .from('players')
            .update({ supporterUntil: this.supporterUntil })
            .eq('uid', this.uid!)

        if (error) {
            throw error;
        }
    }

    async updateDiscord(id: number) {
        // TODO
    }
}

export default Player