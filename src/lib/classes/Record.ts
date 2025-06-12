import supabase from '@database/supabase'
import Level from '@src/lib/classes/Level'
import type { TRecord } from '@src/lib/types'

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

interface Record extends TRecord { }

class Record {
    constructor(data: TRecord) {
        Object.assign(this, data)
    }

    async pull() {
        const { data, error } = await supabase
            .from('records')
            .select('*')
            .match({ userid: this.userid, levelid: this.levelid })
            .single()

        if (error) {
            throw error
        }

        Object.assign(this, data)
    }

    async submit() {
        if (!(await isLevelExists(this.levelid!))) {
            let apiLevel: any
            try {
                apiLevel = await ((await fetch(`https://gdbrowser.com/api/level/${this.levelid}`)).json())
            } catch {
                const level = new Level({
                    id: this.levelid,
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
                id: this.levelid,
                name: apiLevel.name,
                creator: apiLevel.author,
                isPlatformer: apiLevel.length == "Plat"
            })

            await level.update()
        }

        const record = new Record(this)
        const level = new Level({ id: this.levelid })

        await level.pull()

        try {
            await record.pull()
        } catch {
            await this.update()
            return
        }

        if (!level.isPlatformer && (record.progress! >= this.progress!)) {
            throw new Error('Better record is submitted')
        }

        if (level.isPlatformer && (record.progress! <= this.progress!)) {
            throw new Error('Better record is submitted')
        }

        await this.update()
    }

    async update() {
        const { error } = await supabase
            .from('records')
            .upsert(this as any)

        if (error) {
            console.log(error)
            throw error
        }
    }

    async delete() {
        const { error } = await supabase
            .from('records')
            .delete()
            .match({ userid: this.userid, levelid: this.levelid })

        if (error) {
            throw error
        }
    }
}

export default Record