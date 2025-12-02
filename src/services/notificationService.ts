import supabase from '@src/database/supabase'
import discordService from '@src/services/discordService'
import type { TNotification } from '@src/lib/types'

export class NotificationService {
    async getPlayerNotifications(uid: string) {
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

    async clearPlayerNotifications(uid: string) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('to', uid)

        if (error) {
            throw error
        }
    }

    async sendNotification(notification: TNotification, bypass = false) {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification as any)

        if (error) {
            throw error
        }

        if (notification.redirect) {
            notification.content += `\n[Link](${notification.redirect})`
        }

        await discordService.sendDirectMessage(notification.to!, notification.content!, bypass)
    }
}

export default new NotificationService()
