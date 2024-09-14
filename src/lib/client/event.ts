import supabase from "@src/database/supabase";

export async function getAllEvents() {

}

export async function getEvent(id: number) {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .limit(1)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function getOngoingEvents() {
    const cur = new Date().toISOString()
    var { data, error } = await supabase
        .from('events')
        .select('*')
        .lte('start', cur)
        .gte('end', cur)
        .order('start', { ascending: false })

    if (error) {
        throw error
    }

    const res = data

    var { data, error } = await supabase
        .from('events')
        .select('*')
        .is('end', null)

    if (error) {
        throw error
    }

    return res?.concat(data!)
}