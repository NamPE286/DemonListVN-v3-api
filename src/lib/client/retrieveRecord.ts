import supabase from "@src/database/supabase"
import type Player from "@src/lib/classes/Player"
import Record from "@src/lib/classes/Record"

export async function retrieveRecord(user: Player) {
    var { data, error } = await supabase
        .from('records')
        .select('*')
        .neq('userid', user.data.uid)
        .eq('needMod', false)
        .eq('isChecked', false)
        .eq('reviewer', user.data.uid)
        .order('timestamp', { ascending: true })
        .limit(1)
        .single()

    if (data) {
        return data
    }

    var { data, error } = await supabase
        .from('records')
        .select('*')
        .neq('userid', user.data.uid)
        .eq('needMod', false)
        .eq('isChecked', false)
        .is('reviewer', null)
        .order('timestamp', { ascending: true })
        .limit(1)
        .single()

    const record = new Record({ userid: data.userid, levelid: data.levelid })
    await record.pull()
    record.data.reviewer = data.reviewer = user.data.uid
    record.update()

    return data
}