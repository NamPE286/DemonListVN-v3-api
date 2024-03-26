import supabase from '@database/supabase'
import Record from '@src/lib/classes/Record'

export async function getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true } = {}) {
    if(typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .not('dlTop', 'is', null)
        .order(sortBy, { ascending: ascending })
        .range(start, end)
    
    if(error) {
        throw error
    }

    return data
}

export async function getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true } = {}) {
    if(typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .not('flTop', 'is', null)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if(error) {
        throw error
    }

    return data
}

export async function getLevelRecords(id: number) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('levelid', id)

    if (error) {
        throw error
    }

    const records: Record[] = []

    for (const i of data) {
        records.push(new Record(i))
    }

    return records
}

export async function getPlayerRecords(uid: string) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('userid', uid)

    if (error) {
        throw error
    }

    const records: Record[] = []

    for (const i of data) {
        records.push(new Record(i))
    }

    return records
}