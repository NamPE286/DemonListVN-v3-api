import supabase from "@src/client/supabase";
import { getLevel, fetchLevelFromGD, updateLevel } from "@src/services/level.service";
import { getPlayer } from "@src/services/player.service";
import { approved } from "@src/services/pointercrate.service";
import type { TRecord, TPlayer } from "@src/types";
import getVideoId from "get-video-id";

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

export async function getDemonListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .not('dlPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getFeaturedListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .not('flPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getPlayerRecordRating(uid: string) {
    const { data, error } = await supabase
        .from('records')
        .select('userid, progress, no, levels!inner(id, rating), dlPt')
        .eq('userid', uid)
        .not('dlPt', 'is', null)
        .order('no')

    if (error) {
        throw new Error(error.message)
    }

    const res = []

    for (const i of data) {
        res.push({ progress: i.progress, rating: i.levels?.rating! })
    }

    return res;
}

export async function getPlayerRecords(uid: string, { start = '0', end = '50', sortBy = 'pt', ascending = 'false', isChecked = 'true' } = {}) {
    let query = supabase
        .from('records')
        .select('*, levels!inner(*)')
        .eq('userid', uid)
        .eq('isChecked', isChecked == 'true')
        .eq('levels.isPlatformer', false)
    let query1 = supabase
        .from('records')
        .select('*, levels!inner(*)')
        .eq('userid', uid)
        .eq('isChecked', isChecked == 'true')
    let query2 = supabase
        .from('records')
        .select('*, levels!inner(*)')
        .eq('userid', uid)
        .eq('isChecked', isChecked == 'true')
        .eq('levels.isPlatformer', true)

    if (sortBy == 'pt') {
        query = query
            .order('dlPt', { ascending: ascending == 'true' })
            .order('timestamp', { ascending: false })
            .not('levels.rating', 'is', null)
            .range(parseInt(start), parseInt(end))
        query1 = query1
            .order('flPt', { ascending: ascending == 'true' })
            .order('timestamp', { ascending: false })
            .not('levels.flTop', 'is', null)
            .range(parseInt(start), parseInt(end))
        query2 = query2
            .order('plPt', { ascending: ascending == 'true' })
            .order('timestamp', { ascending: false })
            .not('levels.rating', 'is', null)
            .range(parseInt(start), parseInt(end))

        return {
            dl: (await query).data,
            fl: (await query1).data,
            pl: (await query2).data
        }
    }

    query = query
        .order(sortBy, { ascending: ascending == 'true' })
        .not('levels.rating', 'is', null)
        .range(parseInt(start), parseInt(end))
    query1 = query1
        .order(sortBy, { ascending: ascending == 'true' })
        .not('levels.flTop', 'is', null)
        .range(parseInt(start), parseInt(end))
    query2 = query2
        .order(sortBy, { ascending: ascending == 'true' })
        .not('levels.plRating', 'is', null)
        .range(parseInt(start), parseInt(end))

    return {
        dl: (await query).data,
        fl: (await query1).data,
        pl: (await query2).data
    }
}

export async function getLevelRecords(id: number, { start = 0, end = 50, isChecked = true } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const level = await getLevel(id)

    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid!inner(*, clans!id(*)), reviewer:players!reviewer(*, clans!id(*))')
        .eq('players.isHidden', false)
        .eq('levelid', id)
        .eq('isChecked', isChecked)
        .order('progress', { ascending: level.isPlatformer })
        .order('timestamp')
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getRecord(uid: string, levelID: number) {
    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid(*, clans!id(*)), reviewer:players!reviewer(*, clans!id(*)), levels(*)')
        .eq('levelid', levelID)
        .eq('userid', uid)
        .limit(1)
        .single()

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    // @ts-ignore
    return data
}


export async function retrieveRecord(user: TPlayer) {
    var { data, error } = await supabase
        .from('records')
        .select('*, levels!inner(*)')
        .neq('userid', user.uid!)
        .eq('needMod', false)
        .eq('isChecked', false)
        .eq('reviewer', user.uid!)
        .limit(1)
        .single()

    if (data) {
        return data
    }

    var { data, error } = await supabase
        .from('records')
        .select('*, levels!inner(*)')
        .lte('levels.rating', user.rating! + 500)
        .neq('userid', user.uid!)
        .eq('needMod', false)
        .eq('isChecked', false)
        .eq("levels.isPlatformer", false)
        .is('reviewer', null)
        .order('queueNo', { ascending: true, nullsFirst: false })
        .limit(1)
        .single()

    let res = data;

    var { data, error } = await supabase
        .from('records')
        .select('*, levels!inner(*)')
        .neq('userid', user.uid!)
        .eq('needMod', false)
        .eq('isChecked', false)
        .eq("levels.isPlatformer", false)
        .is('reviewer', null)
        .order('queueNo', { ascending: true, nullsFirst: false })
        .limit(1)
        .single()

    if (res == null) {
        res = data;
    } else if (data != null && (new Date(res.queueNo!)) > (new Date(data.queueNo!))) {
        res = data;
    }

    if (res == null) {
        throw new Error("No available record")
    }

    const record = await getRecord(res.userid, res.levelid)

    // @ts-ignore
    record.reviewer = res.reviewer = user.uid!
    record.queueNo = null

    const { players, levels, ...updData } = record

    await updateRecord(updData)

    return data
}

export async function getRecords({ start = 0, end = 50, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid!inner(*, clans!id(*)), reviewer:players!reviewer(*), levels(*)')
        .match({ isChecked: isChecked })
        .eq('players.isHidden', false)
        .order('needMod', { ascending: false })
        .order('queueNo', { ascending: true, nullsFirst: false })
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getPlayerSubmissions(uid: string, { start = '0', end = '50', ascending = 'true' } = {}) {
    const { data, error } = await supabase
        .from('records')
        .select('*, levels(*)')
        .eq('userid', uid)
        .eq('isChecked', false)
        .order('timestamp', { ascending: ascending == 'true' })
        .range(parseInt(start), parseInt(end))

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function changeSuggestedRating(uid: string, levelID: number, rating: number) {
    const { data, error } = await supabase
        .from('records')
        .update({ suggestedRating: rating })
        .eq('levelid', levelID)
        .eq('userid', uid)

    if (error) {
        throw new Error(error.message)
    }
}

export async function submitRecord(recordData: TRecord) {
    if (!(await isLevelExists(recordData.levelid!))) {
        let apiLevel = await fetchLevelFromGD(recordData.levelid!)

        if (apiLevel.length != 5 && apiLevel.difficulty != 'Extreme Demon' && apiLevel.difficulty != 'Insane Demon') {
            throw {
                en: 'Level is not hard enough',
                vi: 'Level không đủ khó'
            }
        }

        await updateLevel({
            id: recordData.levelid,
            name: apiLevel.name,
            creator: apiLevel.author,
            isPlatformer: apiLevel.length == 5
        })
    }

    const level = await getLevel(recordData.levelid!)
    const player = await getPlayer(recordData.userid)

    let existingRecord;
    try {
        existingRecord = await getRecord(recordData.userid!, recordData.levelid!)
    } catch {
        // Record doesn't exist, will create new one
        if (player.pointercrate) {
            const apv = await approved(player.pointercrate, level.name!);
            await updateRecord(recordData, true, apv)
        } else {
            await updateRecord(recordData, true)
        }
        return
    }

    if (!level.isPlatformer && (existingRecord.progress! >= recordData.progress!)) {
        throw {
            en: 'Better record is submitted',
            vi: "Đã có bản ghi tốt hơn"
        }
    }

    if (level.isPlatformer && (existingRecord.progress! <= recordData.progress!)) {
        throw {
            en: 'Better record is submitted',
            vi: "Đã có bản ghi tốt hơn"
        }
    }

    if (player.pointercrate) {
        const apv = await approved(player.pointercrate, level.name!);
        await updateRecord(recordData, true, apv)
    } else {
        await updateRecord(recordData, true)
    }
}

export async function validateRecord(recordData: TRecord) {
    if (!recordData.videoLink) {
        throw {
            en: "Missing video's link",
            vi: "Thiếu liên kết video"
        }
    }

    const level = await getLevel(recordData.levelid!)
    const { id, service } = getVideoId(recordData.videoLink)

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

    if (recordData.progress == 100 && !level.isPlatformer) {
        return;
    }

    if (!level.isPlatformer && !title.includes(recordData.progress!.toString()) && !desc.includes(recordData.progress!.toString())) {
        throw {
            en: "Progress is not 100% and is not in the title or description of the video",
            vi: "Tiến độ không phải 100% và không có trong tiêu đề hay mô tả của video"
        }
    }
}

export async function updateRecord(recordData: TRecord, validate = false, accepted: boolean | null = null) {
    if (validate) {
        await validateRecord(recordData)
    }

    if (accepted !== null) {
        recordData.isChecked = accepted;
    }

    const { error } = await supabase
        .from('records')
        .upsert(recordData as any)

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }
}

export async function deleteRecord(userid: string, levelid: number) {
    const { error } = await supabase
        .from('records')
        .delete()
        .match({ userid, levelid })

    if (error) {
        throw {
            en: error.message,
            vi: error.message
        }
    }
}
