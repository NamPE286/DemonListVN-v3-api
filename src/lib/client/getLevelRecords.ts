import supabase from "@src/database/supabase"
import Record from "@src/lib/classes/Record"

export async function getLevelRecords(id: number, { start = 0, end = 50, isChecked = true } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*, players(*)')
        .eq('levelid', id)
        .order('progress', { ascending: false })
        .order('timestamp')
        .eq('isChecked', isChecked)
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