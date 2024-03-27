import supabase from "@src/database/supabase"
import type { Notification } from "@src/lib/types/Notification"

export async function sendNotification(notification: Notification) {
    notification.timestamp = Date.now()

    var { data, error } = await supabase
        .from('notifications')
        .insert(notification)

    if (error) {
        throw error
    }
}