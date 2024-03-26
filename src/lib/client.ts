import supabase from '@database/supabase'
import Record from '@src/lib/classes/Record'
import Level from '@src/lib/classes/Level'

export async function getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .not('dlTop', 'is', null)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw error
    }

    const levels: Level[] = []

    for (const i of data) {
        levels.push(new Level(i))
    }

    return levels
}

export async function getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .not('flTop', 'is', null)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw error
    }

    const levels: Level[] = []

    for (const i of data) {
        levels.push(new Level(i))
    }

    return levels
}

export async function getLevelRecords(id: number, { start = 0, end = 50, accepted = true } = {}) {
    if (typeof accepted == 'string') {
        accepted = (accepted == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('levelid', id)
        .order('dlPt', { ascending: false })
        .order('flPt', { ascending: false })
        .eq('accepted', accepted)
        .range(start, end)

    if (error) {
        throw error
    }

    const records: Record[] = []

    for (const i of data) {
        records.push(new Record(i))
    }

    return records
}

export async function getPlayerRecords(uid: string, { start = 0, end = 50, accepted = true } = {}) {
    if (typeof accepted == 'string') {
        accepted = (accepted == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('userid', uid)
        .order('dlPt', { ascending: false })
        .order('flPt', { ascending: false })
        .eq('accepted', accepted)
        .range(start, end)

    if (error) {
        throw error
    }

    const records: Record[] = []

    for (const i of data) {
        records.push(new Record(i))
    }

    return records
}

export async function getDemonListSubmissions({ start = 0, end = 50 }) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .not('dlPt', 'is', null)
        .order('flPt', { ascending: false })
        .eq('accepted', false)
        .range(start, end)

    if(error) {
        throw error
    }

    const records: Record[] = []

    for(const i of data) {
        records.push(new Record(i))
    }

    return records
}

export async function getFeaturedListSubmissions({ start = 0, end = 50 }) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .not('flPt', 'is', null)
        .order('flPt', { ascending: false })
        .eq('accepted', false)
        .range(start, end)

    if(error) {
        throw error
    }

    const records: Record[] = []

    for(const i of data) {
        records.push(new Record(i))
    }

    return records
}