import supabase from '@src/client/supabase'
import Player from '@src/classes/Player';
import { approved } from '@src/services/pointercrate.service';
import { getLevel, fetchLevelFromGD, updateLevel } from '@src/services/level.service'
import { getPlayer } from '@src/services/player.service'
import type { TRecord } from '@src/types'
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
            throw new Error(error.message)
        }

        Object.assign(this, data)
    }

    async submit() {
        if (!(await isLevelExists(this.levelid!))) {
            let apiLevel = await fetchLevelFromGD(this.levelid!)

            if (apiLevel.length != 5 && apiLevel.difficulty != 'Extreme Demon' && apiLevel.difficulty != 'Insane Demon') {
                throw {
                    en: 'Level is not hard enough',
                    vi: 'Level không đủ khó'
                }
            }

            await updateLevel({
                id: this.levelid,
                name: apiLevel.name,
                creator: apiLevel.author,
                isPlatformer: apiLevel.length == 5
            })
        }

        const record = new Record(this)
        const level = await getLevel(this.levelid!)
        const player = await getPlayer(this.userid)

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

        const level = await getLevel(this.levelid!)
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

    async update(validate = false, accepted: boolean | null = null) {
        if (validate) {
            await this.validate()
        }

        if (accepted !== null) {
            this.isChecked = accepted;
        }

        const { error } = await supabase
            .from('records')
            .upsert(this as any)

        if (error) {
            console.error(error)
            throw new Error(error.message)
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