import supabase from '@database/supabase'
import Level from '@src/lib/classes/Level'

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

interface Data {
    levelid: number
    userid: string
    progress?: number
    timestamp?: number
    flPt?: number
    dlPt?: number
    refreshRate?: number
    videoLink?: string
    mobile?: boolean
    isChecked?: boolean
    comment?: string
}

class Record {
    #synced = false
    data: Data

    constructor(data: Data) {
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
        if (!(await isLevelExists(this.data.levelid))) {
            const level = new Level({
                id: this.data.levelid,
                name: 'New Level! Please edit this field',
                creator: 'Unknown'
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
            .upsert(this.data)

        if (error) {
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