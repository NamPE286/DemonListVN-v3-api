import supabase from '@database/supabase'
import Level from '@src/lib/classes/Level'
import type { TRecord } from '@src/lib/types'
import getVideoId from 'get-video-id';

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
            const level = new Level({
                id: this.levelid,
            })
            let apiLevel = await level.fetchFromGD()

            if (apiLevel.length != 5 && apiLevel.difficulty != 'Extreme Demon' && apiLevel.difficulty != 'Insane Demon') {
                throw new Error('Level is not hard enough')
            }

            level.name = apiLevel.name
            level.creator = apiLevel.author
            level.isPlatformer = apiLevel.length == 5

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
        const { id, service } = getVideoId(this.videoLink)

        if (!id || !service) {
            throw new Error("Invalid video's link")
        }

        if (service != 'youtube') {
            throw new Error("Video's link is not YouTube")
        }

        const video: any = await (
            (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.GOOGLE_API_KEY}`)).json()
        )

        await level.pull()

        const name = level.name!.toLowerCase()
        const title: string = video.items[0].snippet.title.toLowerCase()
        const desc: string = video.items[0].snippet.description.toLowerCase()

        if (!title.includes(name) && !desc.includes(name)) {
            throw new Error("Level's name is not in the title or description of the video")
        }

        if (this.progress == 100 && !level.isPlatformer) {
            return;
        }

        if (!level.isPlatformer && !title.includes(this.progress!.toString()) && !desc.includes(this.progress!.toString())) {
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