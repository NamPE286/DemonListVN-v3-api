import supabase from "@src/database/supabase";

export async function getAllEvents() {

}

export async function getEvent(id: number) {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .limit(1)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function getOngoingEvents() {
    const cur = new Date().toISOString()
    var { data, error } = await supabase
        .from('events')
        .select('*')
        .lte('start', cur)
        .gte('end', cur)
        .order('start', { ascending: false })

    if (error) {
        throw error
    }

    const res = data

    var { data, error } = await supabase
        .from('events')
        .select('*')
        .is('end', null)

    if (error) {
        throw error
    }

    return res?.concat(data!)
}

export async function getEventProof(eventID: number, uid: string) {
    const { data, error } = await supabase
        .from('eventProofs')
        .select('*')
        .match({ eventID: eventID, userid: uid })
        .limit(1)
        .single()

    if (error) {
        throw error;
    }

    return data
}

export async function getEventProofs(eventID: number, { start = 0, end = 50, accepted = 'true' } = {}) {
    const { data, error } = await supabase
        .from('eventProofs')
        .select('*')
        .eq('eventID', eventID)
        .eq('accepted', accepted == 'true')
        .order('created_at', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}

export async function upsertEventProof(data: any) {
    const { error } = await supabase
        .from('eventProofs')
        .upsert(data)

    if (error) {
        throw error
    }
}

export async function insertEventProof(data: any) {
    const { error } = await supabase
        .from('eventProofs')
        .insert(data)

    if (error) {
        throw error
    }
}