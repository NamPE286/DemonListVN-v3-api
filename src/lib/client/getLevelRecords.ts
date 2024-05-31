import supabase from "@src/database/supabase"
import Record from "@src/lib/classes/Record"

export async function getLevelRecords(id: number, { start = 0, end = 50, isChecked = true } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid!inner(*)')
        .eq('players.isHidden', false)
        .eq('levelid', id)
        .eq('isChecked', isChecked)
        .order('progress', { ascending: false })
        .order('timestamp')
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