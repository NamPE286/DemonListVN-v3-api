import supabase from "@src/database/supabase"
import Record from "@src/lib/classes/Record"

export async function getRecord(uid: string, levelID: number): Promise<Record> {
    const { data, error } = await supabase
        .from('records')
        .select('*, players(*), levels(*)')
        .eq('levelid', levelID)
        .eq('userid', uid)
        .limit(1)
        .single()

    if (error) {
        throw error
    }

    // @ts-ignore
    return data
}