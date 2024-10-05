import supabase from '@database/supabase'
import Level from '@src/lib/classes/Level'
import type { Database } from '@src/lib/types/supabase'

export type TRecord = Database['public']['Tables']['records']['Update']

async function isLevelExists(id: number) {
    const { data, error } = await supabase
        .from('levels')
        .select('id')
        .eq('id', id)

    if (error || !data.length) {
        return false
    }

    return true
}


class Record {
    #synced = false
    data: TRecord

    constructor(data: TRecord) {
        this.data = data
    }

    async pull() {
        const { data, error } = await supabase
            .from('records')
            .select('*')
            .match({ userid: this.data.userid, levelid: this.data.levelid })
            .single()

        if (error) {
            throw error
        }

        this.data = data
        this.#synced = true
    }

    async submit() {
        if (!(await isLevelExists(this.data.levelid!))) {
            let apiLevel: any
            try {
                apiLevel = await ((await fetch(`https://gdbrowser.com/api/level/${this.data.levelid}`)).json())
            } catch {
                const level = new Level({
                    id: this.data.levelid,
                    name: 'Failed to fetch',
                    creator: 'Unknown'
                })

                await level.update()
                return
            }

            if (apiLevel == -1) {
                throw new Error()
            }

            if (apiLevel.difficulty != 'Extreme Demon' && apiLevel.difficulty != 'Insane Demon') {
                throw new Error('Level is not hard enough')
            }

            const level = new Level({
                id: this.data.levelid,
                name: apiLevel.name,
                creator: apiLevel.author
            })

            await level.update()
        }

        const record = new Record(this.data)

        try {
            await record.pull()

            if (record.data.progress! >= this.data.progress!) {
                throw new Error('Better record is submitted')
            }
        } catch (err) { }

        await this.update()
    }

    async update() {
        const { error } = await supabase
            .from('records')
            .upsert(this.data as any)

        if (error) {
            console.log(error)
            throw error
        }
    }

    async delete() {
        const { error } = await supabase
            .from('records')
            .delete()
            .match({ userid: this.data.userid, levelid: this.data.levelid })

        if (error) {
            throw error
        }
    }
}

export default Record