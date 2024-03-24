import supabase from '@src/database/supabase'

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
}

class Player {
    #initialized: boolean = false
    data: Data

    constructor(data: Data) {
        this.data = data
    }

    async init() {
        if (this.#initialized) {
            return
        }

        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('uid', this.data.uid)
            .single()

        if (error) {
            throw error
        }

        this.data = data
        this.#initialized = true
    }

    async update() {
        const { error } = await supabase
            .from('players')
            .upsert(this.data)

        if (error) {
            throw error
        }
    }
}

export default Player