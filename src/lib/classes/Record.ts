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

function getYouTubeVideoID(url: string) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
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
            await this.update(true)
            return
        }

        if (!level.isPlatformer && (record.progress! >= this.progress!)) {
            throw new Error('Better record is submitted')
        }

        if (level.isPlatformer && (record.progress! <= this.progress!)) {
            throw new Error('Better record is submitted')
        }

        await this.update(true)
    }

    async validate() {
        if (!this.videoLink) {
            throw new Error("Missing videoLink")
        }

        const level = new Level({ id: this.levelid })
        const id = getYouTubeVideoID(this.videoLink)
        const video: any = await (
            (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.GOOGLE_API_KEY}`)).json()
        )

        await level.pull()

        const title = video.items[0].snippet.title
        const desc = video.items[0].snippet.description

        if (!title.includes(level.name) && !desc.includes(level.name)) {
            throw new Error("Level's name is not in the title or description of the video")
        }

        if(this.progress == 100 && !level.isPlatformer) {
            return;
        }

        if (!title.includes(this.progress!.toString()) && !desc.includes(this.progress!.toString())) {
            throw new Error("Progress is not 100% and is not in the title or description of the video");
        }
    }

    async update(validate = false) {
        if (validate) {
            await this.validate()
        }

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