import supabase from "@src/database/supabase";
import RecordClass from "@src/lib/classes/Record";
import Player from "@src/lib/classes/Player";

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
        throw error
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
        throw error
    }

    return data
}

export async function getPlayerRecords(uid: string, { start = '0', end = '50', sortBy = 'pt', ascending = 'false', isChecked = 'true' } = {}) {
    let query = supabase
        .from('records')
        .select('*, levels!inner(*)')
        .eq('userid', uid)
        .eq('isChecked', isChecked == 'true')
    let query1 = supabase
        .from('records')
        .select('*, levels!inner(*)')
        .eq('userid', uid)
        .eq('isChecked', isChecked == 'true')

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

        return {
            dl: (await query).data,
            fl: (await query1).data
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

    return {
        dl: (await query).data,
        fl: (await query1).data
    }
}

export async function getLevelRecords(id: number, { start = 0, end = 50, isChecked = true } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid!inner(*, clans!id(*)), reviewer:players!reviewer(*, clans!id(*))')
        .eq('players.isHidden', false)
        .eq('levelid', id)
        .eq('isChecked', isChecked)
        .order('progress', { ascending: false })
        .order('timestamp')
        .range(start, end)

    if (error) {
        throw error
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
        console.log(error)
        throw error
    }

    // @ts-ignore
    return data
}


export async function retrieveRecord(user: Player) {
    var { data, error } = await supabase
        .from('records')
        .select('*, levels!inner(*)')
        .neq('userid', user.uid)
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
        .neq('userid', user.uid)
        .eq('needMod', false)
        .eq('isChecked', false)
        .is('reviewer', null)
        .order('queueNo', { ascending: true, nullsFirst: false })

        .limit(1)
        .single()

    let res = data;

    var { data, error } = await supabase
        .from('records')
        .select('*, levels!inner(*)')
        .not('levels.flPt', 'is', null)
        .neq('userid', user.uid)
        .eq('needMod', false)
        .eq('isChecked', false)
        .is('reviewer', null)
        .order('queueNo', { ascending: true, nullsFirst: false })

        .limit(1)
        .single()

    if(res == null) {
        res = data;
    } else if(data != null && (new Date(res.queueNo!)) > (new Date(data.queueNo!))) {
        res = data;
    }

    if(res == null) {
        throw new Error("No available record")
    }

    const record = new RecordClass({ userid: res.userid, levelid: res.levelid })
    await record.pull()
    record.reviewer = res.reviewer = user.uid!
    record.queueNo = null
    record.update()

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
        throw error
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
        throw error
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
        throw error
    }
}