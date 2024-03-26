import supabase from '@database/supabase'
import Record from '@src/lib/classes/Record'

export const getLevelRecords = async (id: number) => {
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

export const getPlayerRecords = async (uid: string) => {
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