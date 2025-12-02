import type { Request, Response } from 'express'
import deathCountService from '@src/services/deathCountService'

export class DeathCountController {
    async getDeathCount(req: Request, res: Response) {
        try {
            const { uid, levelID } = req.params
            const deathCount = await deathCountService.getDeathCount(uid, parseInt(levelID))

            res.send(deathCount)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async updateDeathCount(req: Request, res: Response) {
        res.send()

        const { count, levelID } = req.params
        const uid = res.locals.user.uid!
        const arr: any[] = count.split('|')

        for (let i = 0; i < arr.length; i++) {
            arr[i] = parseInt(arr[i])
        }

        try {
            await deathCountService.updateDeathCount(uid, parseInt(levelID), arr)
        } catch (err) {
            console.error(err)
        }
    }
}

export default new DeathCountController()
