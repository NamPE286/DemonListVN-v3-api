import supabase from '@database/supabase'
import type { Database } from '@src/lib/types/supabase'
import type { TPlayer } from '@src/lib/types'

class Player {
    #synced = false
    data: TPlayer

    constructor(data: TPlayer) {
        this.data = data
    }

    async pull() {
        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .eq('uid', this.data.uid!)
            .single()

        if (error) {
            throw error
        }

        this.data = data
        this.#synced = true
    }

    async update({ updateClan = false } = {}) {
        const updateData = this.data
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
            delete this.data.clan
        }

        const { error } = await supabase
            .from('players')
            .upsert(this.data as any)

        if (error) {
            throw error
        }

        await this.pull()
    }
}

export default Player