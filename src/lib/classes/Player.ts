import supabase from '@database/supabase'

interface Data {
    uid: string
    id?: number
    name?: string
    email?: string
    avatar?: string
    facebook?: string
    youtube?: string
    discord?: string
    totalFLpt?: number
    totalDLpt?: number
    flrank?: number
    dlrank?: number
    isAdmin?: boolean
    isBanned?: boolean
    isHidden?: boolean
    rating?: number
    dlMaxPt?: number
    flMaxPt?: number
    overallRank?: number
    province?: string
    city?: string
    isTrusted?: boolean
    reviewCooldown?: string
    clan?: number | null
    renameCooldown?: string
}

class Player {
    #synced = false
    data: Data

    constructor(data: Data) {
        this.data = data
    }

    async pull() {
        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .eq('uid', this.data.uid)
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
            .upsert(this.data)

        if (error) {
            throw error
        }

        await this.pull()
    }
}

export default Player