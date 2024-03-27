import supabase from "@src/database/supabase";
import Record from "@src/lib/classes/Record";

export async function getFeaturedListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .not('flPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    const res: Record[] = []

    for (const i of data) {
        res.push(new Record(i))
    }

    return res
}