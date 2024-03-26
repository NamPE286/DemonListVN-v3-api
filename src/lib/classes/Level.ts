import supabase from '@database/supabase'

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
    #synced = false
    data: Data

    constructor(data: Data) {
        this.data = data
    }

    async pull() {
        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .eq('id', this.data.id)
            .single()

        if (error) {
            throw error
        }

        this.data = data
        this.#synced = true
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

    getSongPublicURL() {
        if(!this.#synced) {
            throw new Error('Level is not synced with database')
        }

        if(!this.data.songID) {
            throw new Error("Not avaliable")
        }

        const { data } = supabase
            .storage
            .from('songs')
            .getPublicUrl(`${this.data.songID}.mp3`)

        return data.publicUrl
    }
}

export default Level