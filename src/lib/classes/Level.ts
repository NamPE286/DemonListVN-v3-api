import supabase from '@database/supabase'
import { addChangelog } from '@src/lib/client/changelog'
import type { Database } from '@src/lib/types/supabase'

type Data = Database['public']['Tables']['levels']['Update']

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
            .eq('id', this.data.id!)
            .single()

        if (error) {
            throw error
        }

        this.data = data
        this.#synced = true
    }

    async update() {
        let { data } = await supabase
            .from('levels')
            .select('*')
            .eq('id', this.data.id!)
            .limit(1)
            .single()

        let { error } = await supabase
            .from('levels')
            .upsert(this.data as any)

        await supabase.rpc('updateList')

        if (error) {
            throw error
        }

        addChangelog(this.data.id!, data)
    }

    async delete() {
        const { error } = await supabase
            .from('levels')
            .delete()
            .eq('id', this.data.id!)

        if (error) {
            throw error
        }
    }

    getSongPublicURL() {
        if (!this.#synced) {
            throw new Error('Level is not synced with database')
        }

        if (!this.data.songID) {
            throw new Error("Not avaliable")
        }

        const { data } = supabase
            .storage
            .from('songs')
            .getPublicUrl(`${this.data.songID}.mp3`)

        return data.publicUrl
    }

    async deleteSong() {
        if (!this.#synced) {
            throw new Error('Level is not synced with database')
        }

        if (!this.data.songID) {
            return
        }

        const { data, error } = await supabase
            .storage
            .from('songs')
            .remove([`${this.data.songID}.mp3`])

        if (error) {
            throw error
        }

        this.data.songID = null
        this.update()
    }
}

export default Level