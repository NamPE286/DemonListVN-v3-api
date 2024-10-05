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
        delete updateData.isAdmin
        delete updateData.isTrusted
        delete updateData.isBanned
        delete updateData.reviewCooldown
        delete updateData.renameCooldown
        delete updateData.rating
        delete updateData.overallRank
        //@ts-ignore
        delete updateData.clans

        if (!updateClan) {
            delete this.clan
        }

        const { error } = await supabase
            .from('players')
            .upsert(this as any)

        if (error) {
            throw error
        }

        await this.pull()
    }
}

export default Player