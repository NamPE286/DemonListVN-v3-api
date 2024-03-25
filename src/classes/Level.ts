import supabase from '@src/database/supabase'

interface Data {
    id: number
    name?: string
    creator?: string
    videoID?: string
    minProgress?: string
    flTop?: number
    dlTop?: number
    flPt?: number
    dlPt?: number
    rating?: number
    songID?: number
}

class Level {
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
            .from('levels')
            .select('*')
            .eq('id', this.data.id)
            .single()

        if (error) {
            throw error
        }

        this.data = data
        this.#initialized = true
    }

    async update() {
        const { error } = await supabase
            .from('levels')
            .upsert(this.data)

        if (error) {
            throw error
        }
    }

    async delete() {
        const { error } = await supabase
            .from('levels')
            .delete()
            .eq('id', this.data.id)

        if (error) {
            throw error
        }
    }
}

export default Level