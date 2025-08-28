import supabase from "@src/database/supabase";
import type Player from "@src/lib/classes/Player";
import type { Tables } from "@src/lib/types/supabase";

function getPenalty(records: any[]) {
    let res: number = 0;

    for (const i of records) {
        if (i == null) {
            continue;
        }

        res += new Date(i.created_at).getTime()
    }

    return res
}

function formatEventSubmissions(submissions: Tables<"eventRecords">[], levels: Tables<"eventLevels" | "levels">[]) {
    const result = []

    while (result.length < levels.length) {
        let found = false;

        for (const record of submissions) {
            if (record.levelID == levels[result.length].id) {
                result.push(record)
                found = true;
                break
            }
        }

        if (!found) {
            result.push(null)
        }
    }

    return result
}

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
        .gte('end', cur)
        .eq('hidden', false)
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


export async function getEventSubmissions(eventID: number, userID: string) {
    const levels = await getEventLevels(eventID)

    const { data, error } = await supabase
        .from("eventRecords")
        .select("*, eventLevels!inner(*)")
        .eq("userID", userID)
        .eq("eventLevels.eventID", eventID)

    if (error) {
        throw error
    }

    return formatEventSubmissions(data, levels)
}

export async function getEventLeaderboard(eventID: number, ignoreFreeze: boolean) {
    const event = await getEvent(eventID)
    const levels = await getEventLevels(eventID)
    const { data, error } = await supabase
        .from("eventProofs")
        .select("userid, eventID, diff, players!inner(*, clans!id(*), eventRecords(*, eventLevels(*)))")
        .eq("eventID", eventID)
        .lte("players.eventRecords.created_at", event.freeze && !ignoreFreeze ? event.freeze : new Date().toISOString());

    if (error) {
        throw error
    }

    const res = []

    for (let i of data) {
        if (!i.players) {
            continue
        }

        if (!i.players.eventRecords === null) {
            i.players.eventRecords = []
        }
        // @ts-ignore
        i.players.diff = i.diff
        res.push(i.players)
    }

    for (const player of res) {
        // @ts-ignore
        player.eventRecords = formatEventSubmissions(player.eventRecords, levels);
    }

    res.sort((a, b) => {
        const x = a.eventRecords.reduce((sum, record, index) => {
            return sum + (record && (record.accepted === null || record.accepted === true) ? levels[index].point * record.progress : 0);
        }, 0);

        const y = b.eventRecords.reduce((sum, record, index) => {
            return sum + (record && (record.accepted === null || record.accepted === true) ? levels[index].point * record.progress : 0);
        }, 0);

        if (x == y && x != 0) {
            return getPenalty(a.eventRecords) - getPenalty(b.eventRecords)
        }

        return y - x;
    });

    return res
}

export async function deleteEventSubmission(levelID: number, userID: string) {
    const { error } = await supabase
        .from('eventRecords')
        .delete()
        .match({ userID: userID, levelID: levelID })

    if (error) {
        throw error
    }
}

export async function insertEventSubmission(submission: any) {
    var { error } = await supabase
        .from("eventRecords")
        .insert(submission)

    if (error) {
        throw error
    }

    var { data, error } = await supabase
        .from("eventLevels")
        .select("id, eventID")
        .eq("id", submission.levelID)
        .single()

    if (error) {
        throw error
    }

    try {
        await insertEventProof({
            userid: submission.userID,
            eventID: data?.eventID
        })
    } catch (err) {
        console.warn(err)
    }
}

export async function upsertEventSubmission(submission: any) {
    var { error } = await supabase
        .from("eventRecords")
        .upsert(submission)
}