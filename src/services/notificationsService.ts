import { clearPlayerNotifications, getPlayerNotifications } from '@src/lib/client/notification'

export class NotificationsService {
    async getPlayerNotifications(uid: string) {
        return await getPlayerNotifications(uid)
    }

    async clearPlayerNotifications(uid: string) {
        return await clearPlayerNotifications(uid)
    }
}

export default new NotificationsService()
