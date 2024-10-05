import supabase from "@src/database/supabase"
import type { Database } from '@src/lib/types/supabase'

export type Notification = Database['public']['Tables']['notifications']['Update']

export async function getPlayerNotifications(uid: string) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('to', uid)
        .order('timestamp', { ascending: false })

    if (error) {
        throw error
    }

    return data
}

export async function clearPlayerNotifications(uid: string) {
    var { error } = await supabase
        .from('notifications')
        .delete()
        .eq('to', uid)

    if (error) {
        throw error
    }
}

export async function sendNotification(notification: Notification) {
    var { data, error } = await supabase
        .from('notifications')
        .insert(notification as any)

    if (error) {
        throw error
    }
}