import supabase from "@src/database/supabase"
import { sendDirectMessage } from "@src/services/discordClientService"
import type { TNotification } from "@src/lib/types"

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

export async function sendNotification(notification: TNotification, bypass = false) {
    var { data, error } = await supabase
        .from('notifications')
        .insert(notification as any)

    if (error) {
        throw error
    }

    if (notification.redirect) {
        notification.content += `\n[Link](${notification.redirect})`
    }

    await sendDirectMessage(notification.to!, notification.content!, bypass)
}