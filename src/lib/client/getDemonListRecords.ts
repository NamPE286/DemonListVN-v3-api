import supabase from '@database/supabase'
import Record from '@src/lib/classes/Record'

export async function getDemonListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .not('dlPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    const res: Record[] = []

    for(const i of data) {
        res.push(new Record(i))
    }

    return res
}