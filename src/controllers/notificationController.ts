import type { Request, Response } from 'express'
import notificationService from '@src/services/notificationService'

export class NotificationController {
    async sendNotification(req: Request, res: Response) {
        try {
            await notificationService.sendNotification(req.body)
            res.send()
        } catch (error) {
            res.status(500).send()
        }
    }
}

export default new NotificationController()
