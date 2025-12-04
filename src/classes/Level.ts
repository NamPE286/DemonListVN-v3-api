import supabase from '@src/client/supabase'
import { gdapi } from '@src/client/GDApi'
import { addChangelog } from '@src/services/changelog.service'
import type { TLevel } from '@src/types'

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
            throw new Error(error.message)
        }

        Object.assign(this, data)
    }

    async fetchFromGD() {
        const data = await gdapi.levels.get(this.id!)

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            length: data.stats.length.raw,
            author: data.creator.username,
            difficulty: data.difficulty.level.pretty
        }
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

        await supabase.rpc('update_list')

        if (error) {
            throw new Error(error.message)
        }

        addChangelog(this.id!, data)
    }

    async delete() {
        const { error } = await supabase
            .from('levels')
            .delete()
            .eq('id', this.id!)

        if (error) {
            throw new Error(error.message)
        }
    }
}

export default Level