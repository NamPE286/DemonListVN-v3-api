import supabase from '@src/database/supabase'
import discordService from '@src/services/discordService'

async function getPlayerNotifications(uid: string) {
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

async function clearPlayerNotifications(uid: string) {
    var { error } = await supabase
        .from('notifications')
        .delete()
        .eq('to', uid)

    if (error) {
        throw error
    }
}

export class NotificationsService {
    async getPlayerNotifications(uid: string) {
        return await getPlayerNotifications(uid)
    }

    async clearPlayerNotifications(uid: string) {
        return await clearPlayerNotifications(uid)
    }
}

export default new NotificationsService()
