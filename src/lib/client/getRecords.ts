import supabase from '@database/supabase'

export async function getRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}