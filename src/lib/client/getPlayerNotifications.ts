import supabase from "@src/database/supabase"
import type { Notification } from "@src/lib/types/Notification"

export async function getPlayerNotifications(uid: string) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('to', uid)
        .order('timestamp', { ascending: false })

    if (error) {
        throw error
    }

    const res: Notification[] = []

    for (const i of data!) {
        res.push(i)
    }

    return res
}