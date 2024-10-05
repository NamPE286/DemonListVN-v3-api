import supabase from '@database/supabase'
import { addChangelog } from '@src/lib/client/changelog'
import type { TLevel } from '@src/lib/types'

interface Level extends TLevel { }

class Level {
    constructor(data: TLevel) {
        Object.assign(this, data)
    }

    async pull() {
        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .eq('id', this.id!)
            .single()

        if (error) {
            throw error
        }

        Object.assign(this, data)
    }

    async update() {
        let { data } = await supabase
            .from('levels')
            .select('*')
            .eq('id', this.id!)
            .limit(1)
            .single()

        let { error } = await supabase
            .from('levels')
            .upsert(this as any)

        await supabase.rpc('updateList')

        if (error) {
            throw error
        }

        addChangelog(this.id!, data)
    }

    async delete() {
        const { error } = await supabase
            .from('levels')
            .delete()
            .eq('id', this.id!)

        if (error) {
            throw error
        }
    }

    getSongPublicURL() {
        if (!this.songID) {
            throw new Error("Not avaliable")
        }

        const { data } = supabase
            .storage
            .from('songs')
            .getPublicUrl(`${this.songID}.mp3`)

        return data.publicUrl
    }

    async deleteSong() {
        if (!this.songID) {
            return
        }

        const { data, error } = await supabase
            .storage
            .from('songs')
            .remove([`${this.songID}.mp3`])

        if (error) {
            throw error
        }

        this.songID = null
        this.update()
    }
}

export default Level