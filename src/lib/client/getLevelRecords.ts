import supabase from "@src/database/supabase"
import Record from "@src/lib/classes/Record"

export async function getLevelRecords(id: number, { start = 0, end = 50, isChecked = true } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('levelid', id)
        .order('dlPt', { ascending: false })
        .order('flPt', { ascending: false })
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