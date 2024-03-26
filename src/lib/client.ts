import supabase from '@database/supabase'
import Record from '@src/lib/classes/Record'

interface Filter {
    start?: number
    end?: number
    sortBy?: string
}

const defaultFilter: Filter = {
    start: 0,
    end: 50,
    sortBy: 'timestamp'
}

export async function getDemonListLevels(filter: Filter = defaultFilter) {

}

export async function getFeaturedListLevels(filter: Filter = defaultFilter) {

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