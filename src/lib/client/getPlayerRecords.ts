import supabase from "@src/database/supabase"
import Record from "@src/lib/classes/Record"

export async function getPlayerRecords(uid: string, { start = 0, end = 50, sortBy = 'pt', ascending = 'false', isChecked = 'true' } = {}) {
    let query = supabase
        .from('records')
        .select('*, levels!inner(*)')
        .eq('userid', uid)
        .eq('isChecked', isChecked == 'true')

    if (sortBy == 'pt') {
        query = query
            .order('dlPt', { ascending: ascending == 'true' })
            .order('flPt', { ascending: ascending == 'true' })
    } else {
        query = query.order(sortBy, { ascending: ascending == 'true' })
    }

    query = query.range(start, end)

    const { data, error } = await query

    if (error) {
        throw error
    }

    const records: Record[] = []

    for (const i of data) {
        records.push(new Record(i))
    }

    return records
}