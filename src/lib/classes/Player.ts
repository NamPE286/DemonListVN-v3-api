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
            .select('*')
            .eq('uid', this.data.uid)
            .single()

        if (error) {
            throw error
        }

        this.data = data
        this.#synced = true
    }

    async update({updateClan = false} = {}) {
        delete this.data.isAdmin
        delete this.data.isTrusted
        delete this.data.reviewCooldown
        delete this.data.renameCooldown
        delete this.data.rating
        delete this.data.overallRank

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