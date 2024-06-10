import supabase from '@database/supabase'
import Record from '@src/lib/classes/Record'

export async function getRecords({ start = 0, end = 50, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid(*), reviewer:players!reviewer(*), levels(*)')
        .match({ isChecked: isChecked })
        .order('needMod', { ascending: false })
        .order('timestamp', { ascending: true })
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