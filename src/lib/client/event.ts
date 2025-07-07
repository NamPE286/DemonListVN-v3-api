import supabase from "@src/database/supabase";

export async function getEvents() {

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

export async function getEventProofs(eventID: number | null, { start = 0, end = 50, accepted = 'true' } = {}) {
    let query = supabase
        .from('eventProofs')
        .select('*, events(*), players(*)')

    if (eventID) {
        query = query.eq('eventID', eventID)
    }

    query = query
        .eq('accepted', accepted == 'true')
        .order('created_at', { ascending: true })
        .range(start, end)

    const { data, error } = await query

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

export async function deleteEventProof(eventID: number, uid: string) {
    const { error } = await supabase
        .from('eventProofs')
        .delete()
        .match({ eventID: eventID, userid: uid })

    if (error) {
        throw error
    }
}

export async function getEventLevels(eventID: number) {
    const { data, error } = await supabase
        .from('eventLevels')
        .select('*, levels(*)')
        .eq("eventID", eventID)
        .order("id")

    if (error) {
        throw error;
    }

    const flattened = data.map(item => {
        const { levels, ...rest } = item;

        const { id: levelsId, ...flattenedLevels } = levels || {};

        return {
            ...rest,
            ...flattenedLevels,
        };
    });

    return flattened
}

export async function getEventSubmission(eventID: number) {

}