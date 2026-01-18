import supabase from "@src/client/supabase";
import { getLevel, fetchLevelFromGD, updateLevel } from "@src/services/level.service";
import { getPlayer } from "@src/services/player.service";
import { approved } from "@src/services/pointercrate.service";
import type { TRecord, TPlayer } from "@src/types";
import getVideoId from "get-video-id";
import logger from "@src/utils/logger";

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

export async function getEstimatedQueue(userID: string, levelID: number, prioritizedBy: number) {
    const prioritizedDate = new Date(prioritizedBy).toISOString()
    const { data, error } = await supabase
        .rpc('get_queue_no', {
            userid: userID,
            levelid: levelID,
            p: prioritizedBy
        })

    if (error) {
        throw new Error(error.message)
    }

    if(data == null) {
        return 1;
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
    const logs: string[] = [];

    try {
        logs.push(`Starting with recordData: ${JSON.stringify(recordData, null, 2)}`);

        const levelExists = await isLevelExists(recordData.levelid!);
        logs.push(`Level exists check: ${levelExists}`);

        if (!levelExists) {
            logs.push(`Fetching level from GD, levelID: ${recordData.levelid}`);
            let apiLevel = await fetchLevelFromGD(recordData.levelid!)
            logs.push(`Fetched GD level: ${JSON.stringify(apiLevel, null, 2)}`);

            if (apiLevel.length != 5 && apiLevel.difficulty != 'Extreme Demon' && apiLevel.difficulty != 'Insane Demon') {
                logs.push(`Level not hard enough. Length: ${apiLevel.length}, Difficulty: ${apiLevel.difficulty}`);
                throw {
                    en: 'Level is not hard enough',
                    vi: 'Level không đủ khó'
                }
            }

            logs.push('Updating level in database');
            await updateLevel({
                id: recordData.levelid,
                name: apiLevel.name,
                creator: apiLevel.author,
                isPlatformer: apiLevel.length == 5
            })
            logs.push('Level updated successfully');
        }

        logs.push(`Getting level data for levelID: ${recordData.levelid}`);
        const level = await getLevel(recordData.levelid!)
        logs.push(`Level data: ${JSON.stringify(level, null, 2)}`);

        logs.push(`Getting player data for userID: ${recordData.userid}`);
        const player = await getPlayer(recordData.userid)
        logs.push(`Player data: ${JSON.stringify(player, null, 2)}`);

        let existingRecord;

        try {
            logs.push('Checking for existing record');
            existingRecord = await getRecord(recordData.userid!, recordData.levelid!)
            logs.push(`Existing record found: ${JSON.stringify(existingRecord, null, 2)}`);
        } catch (e) {
            logs.push(`No existing record found, error: ${JSON.stringify(e)}`);
            logs.push(`Player pointercrate: ${player.pointercrate}`);

            if (player.pointercrate) {
                logs.push(`Checking Pointercrate approval for: ${player.pointercrate}, ${level.name}`);

                try {
                    const apv = await approved(player.pointercrate, level.name!);
                    logs.push(`Pointercrate approval result: ${apv}`);
                    const updateLogs = await updateRecord(recordData, true, apv);
                    logs.push(...updateLogs);
                    logs.push(`Record updated with Pointercrate approval: ${apv}`);
                } catch (err) {
                    logs.push(`Failed to fetch from Pointercrate: ${JSON.stringify(err)}`);
                    logs.push('Updating record without Pointercrate check');
                    const updateLogs = await updateRecord(recordData, true, false);
                    logs.push(...updateLogs);
                    logs.push('Record updated');
                }
            } else {
                logs.push('Updating record without Pointercrate check');
                const updateLogs = await updateRecord(recordData, true, false);
                logs.push(...updateLogs);
                logs.push('Record updated');
            }
            logs.push('Completed - new record created');
            return { logs }
        }

        logs.push(`Comparing progress. Level isPlatformer: ${level.isPlatformer}`);
        logs.push(`Existing progress: ${existingRecord.progress}, New progress: ${recordData.progress}`);

        if (!level.isPlatformer && (existingRecord.progress! >= recordData.progress!)) {
            logs.push('Non-platformer: existing record is better or equal');
            throw {
                en: 'Better record is submitted',
                vi: "Đã có bản ghi tốt hơn"
            }
        }

        if (level.isPlatformer && (existingRecord.progress! <= recordData.progress!)) {
            logs.push('Platformer: existing record is better or equal');
            throw {
                en: 'Better record is submitted',
                vi: "Đã có bản ghi tốt hơn"
            }
        }

        logs.push('New record is better, updating');
        logs.push(`Player pointercrate: ${player.pointercrate}`);

        if (player.pointercrate) {
            logs.push(`Checking Pointercrate approval for: ${player.pointercrate}, ${level.name}`);

            try {
                const apv = await approved(player.pointercrate, level.name!);
                logs.push(`Pointercrate approval result: ${apv}`);
                const updateLogs = await updateRecord(recordData, true, apv);
                logs.push(...updateLogs);
                logs.push(`Record updated with Pointercrate approval: ${apv}`);
            } catch (err) {
                logs.push(`Failed to fetch from Pointercrate: ${JSON.stringify(err)}`);
                logs.push('Updating record without Pointercrate check');
                const updateLogs = await updateRecord(recordData, true, false);
                logs.push(...updateLogs);
                logs.push('Record updated');
            }
        } else {
            logs.push('Updating record without Pointercrate check');
            const updateLogs = await updateRecord(recordData, true, false);
            logs.push(...updateLogs);
            logs.push('Record updated');
        }
        logs.push('Completed - record updated');

        return { logs }
    } catch (error) {
        logs.push(`Error occurred: ${JSON.stringify(error)}`);
        throw {
            ...(typeof error === 'object' && error !== null ? error : {}),
            logs
        }
    }
}

export async function validateRecord(recordData: TRecord) {
    const logs: string[] = [];
    const logMsg = `Starting validation for record: levelId=${recordData.levelid}, userId=${recordData.userid}, progress=${recordData.progress}`;
    logs.push(logMsg);

    if (!recordData.videoLink) {
        const logMsg = `Validation failed: Missing video link for levelId=${recordData.levelid}`;
        logs.push(logMsg);
        throw {
            en: "Missing video's link",
            vi: "Thiếu liên kết video"
        }
    }

    const level = await getLevel(recordData.levelid!)
    const { id, service } = getVideoId(recordData.videoLink)

    if (!id || !service) {
        const logMsg = `Validation failed: Invalid video link - ${recordData.videoLink}`;
        logs.push(logMsg);
        throw {
            en: "Invalid video's link",
            vi: "Liên kết video không hợp lệ"
        }
    }

    if (service != 'youtube') {
        const logMsg = `Validation failed: Video service is ${service}, not YouTube - ${recordData.videoLink}`;
        logs.push(logMsg);
        throw {
            en: "Video's link is not YouTube",
            vi: "Liên kết video không phải YouTube"
        }
    }

    const validatedMsg = `Video validated: id=${id}, service=${service}`;
    logs.push(validatedMsg);

    const video: any = await (
        (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.GOOGLE_API_KEY}`)).json()
    )

    const name = level.name!.toLowerCase()
    const title: string = video.items[0].snippet.title.toLowerCase()
    const desc: string = video.items[0].snippet.description.toLowerCase()

    if (!title.includes(name) && !desc.includes(name)) {
        const logMsg = `Validation failed: Level name "${level.name}" not found in video title or description`;
        logs.push(logMsg);
        throw {
            en: "Level's name is not in the title or description of the video",
            vi: "Tên level không có trong tiêu đề hay mô tả của video"
        }
    }

    if (recordData.progress == 100 && !level.isPlatformer) {
        const logMsg = `Validation successful: 100% progress on non-platformer level ${level.name}`;
        logs.push(logMsg);
        return logs;
    }

    if (!level.isPlatformer && !title.includes(recordData.progress!.toString()) && !desc.includes(recordData.progress!.toString())) {
        const logMsg = `Validation failed: Progress ${recordData.progress}% not found in video title or description`;
        logs.push(logMsg);
        throw {
            en: "Progress is not 100% and is not in the title or description of the video",
            vi: "Tiến độ không phải 100% và không có trong tiêu đề hay mô tả của video"
        }
    }

    const successMsg = `Validation successful for record: levelId=${recordData.levelid}, progress=${recordData.progress}%`;
    logs.push(successMsg);
    return logs;
}

export async function updateRecord(recordData: TRecord, validate = false, accepted: boolean | null = null) {
    const logs: string[] = [];

    if (validate) {
        const validationLogs = await validateRecord(recordData);
        logs.push(...validationLogs);
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

    return logs;
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

export async function prioritizeRecord(userID: string, levelID: number, ms: number) {
    const record = await getRecord(userID, levelID)
    const { error } = await supabase
        .from('records')
        .update({
            prioritizedBy: record.prioritizedBy + ms
        })
        .match({ userid: userID, levelid: levelID })

    if (error) {
        throw new Error(error.message);
    }
}