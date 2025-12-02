import { sendNotification } from '@src/lib/client/notification'

export class NotificationService {
    async sendNotification(data: any) {
        await sendNotification(data)
    }
}

export default new NotificationService()
