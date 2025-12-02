import type { Request, Response } from 'express'
import clansService from '@src/services/clansService'

export class ClansController {
    async getClans(req: Request, res: Response) {
        try {
            const clans = await clansService.getClans(req.query)

            res.send(clans)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new ClansController()
