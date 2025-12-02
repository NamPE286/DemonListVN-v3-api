import type { Request, Response } from 'express'
import notificationsService from '@src/services/notificationsService'

export class NotificationsController {
    async getPlayerNotifications(req: Request, res: Response) {
        const { uid } = req.params
        const { user } = res.locals

        if (user.uid != uid && !user.isAdmin) {
            res.status(403).send()

            return
        }

        try {
            const notifications = await notificationsService.getPlayerNotifications(uid)

            res.send(notifications)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async clearPlayerNotifications(req: Request, res: Response) {
        const { uid } = req.params
        const { user } = res.locals

        if (user.uid != uid && !user.isAdmin) {
            res.status(403).send()

            return
        }

        try {
            const result = await notificationsService.clearPlayerNotifications(uid)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new NotificationsController()
