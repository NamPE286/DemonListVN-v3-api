import supabase from "@src/database/supabase";

export async function getAllEvents() {

}

export async function getOngoingEvents() {
    const cur = new Date().toISOString()

    const { data, error } = await supabase
        .from('events')
        .select('*')
        .lte('start', cur)
        .gte('end', cur)
        .order('start', { ascending: false })

    if (error) {
        throw error
    }

    return data
}