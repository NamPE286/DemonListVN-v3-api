import supabase from '@database/supabase'
import Level from '@src/lib/classes/Level'
import Player from '@src/lib/classes/Player';
import { approved } from '@src/lib/client/pointercrate';
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
                throw {
                    en: 'Level is not hard enough',
                    vi: 'Level không đủ khó'
                }
            }

            level.name = apiLevel.name
            level.creator = apiLevel.author
            level.isPlatformer = apiLevel.length == 5

            await level.update()
        }

        const record = new Record(this)
        const level = new Level({ id: this.levelid })
        const player = new Player({ uid: this.userid })

        await level.pull()
        await player.pull();

        try {
            await record.pull()
        } catch {
            if (player.pointercrate) {
                const apv = await approved(player.pointercrate, level.name!);
                await this.update(true, apv)
            } else {
                await this.update(true)
            } return
        }

        if (!level.isPlatformer && (record.progress! >= this.progress!)) {
            throw {
                en: 'Better record is submitted',
                vi: "Đã có bản ghi tốt hơn"
            }
        }

        if (level.isPlatformer && (record.progress! <= this.progress!)) {
            throw {
                en: 'Better record is submitted',
                vi: "Đã có bản ghi tốt hơn"
            }
        }

        if (player.pointercrate) {
            const apv = await approved(player.pointercrate, level.name!);
            await this.update(true, apv)
        } else {
            await this.update(true)
        }
    }

    async validate() {
        if (!this.videoLink) {
            throw {
                en: "Missing video's link",
                vi: "Thiếu liên kết video"
            }
        }

        const level = new Level({ id: this.levelid })
        const { id, service } = getVideoId(this.videoLink)

        if (!id || !service) {
            throw {
                en: "Invalid video's link",
                vi: "Liên kết video không hợp lệ"
            }
        }

        if (service != 'youtube') {
            throw {
                en: "Video's link is not YouTube",
                vi: "Liên kết video không phải YouTube"
            }
        }

        const video: any = await (
            (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.GOOGLE_API_KEY}`)).json()
        )

        await level.pull()

        const name = level.name!.toLowerCase()
        const title: string = video.items[0].snippet.title.toLowerCase()
        const desc: string = video.items[0].snippet.description.toLowerCase()

        if (!title.includes(name) && !desc.includes(name)) {
            throw {
                en: "Level's name is not in the title or description of the video",
                vi: "Tên level không có trong tiêu đề hay mô tả của video"
            }
        }

        if (this.progress == 100 && !level.isPlatformer) {
            return;
        }

        if (!level.isPlatformer && !title.includes(this.progress!.toString()) && !desc.includes(this.progress!.toString())) {
            throw {
                en: "Progress is not 100% and is not in the title or description of the video",
                vi: "Tiến độ không phải 100% và không có trong tiêu đề hay mô tả của video"
            }
        }
    }

    async update(validate = false, accepted = false) {
        console.log(validate, accepted)
        if (validate) {
            await this.validate()
        }

        this.isChecked = accepted;

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
            throw {
                en: error.message,
                vi: error.message
            }
        }
    }
}

export default Record