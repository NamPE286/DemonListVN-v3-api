import supabase from '@database/supabase'

export async function getRecords({ start = 0, end = 50, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*, players!userid(uid, name), reviewer:players!reviewer(uid, name)')
        .match({ isChecked: isChecked })
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}