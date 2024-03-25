import supabase from '@src/database/supabase'

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

class Level {
    data: Data

    constructor(data: Data) {
        this.data = data
    }

    async init() {
        const { data, error } = await supabase
            .from('records')
            .select('*')
            .match({uid: this.data.userid, levelid: this.data.levelid})
            .single()

        if (error) {
            throw error
        }

        this.data = data
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
            .match({uid: this.data.userid, levelid: this.data.levelid})

        if (error) {
            throw error
        }
    }
}

export default Level