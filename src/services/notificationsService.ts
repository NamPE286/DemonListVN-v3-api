import notificationService from '@src/services/notificationService'

export class NotificationsService {
    async getPlayerNotifications(uid: string) {
        return await notificationService.getPlayerNotifications(uid)
    }

    async clearPlayerNotifications(uid: string) {
        return await notificationService.clearPlayerNotifications(uid)
    }
}

export default new NotificationsService()
