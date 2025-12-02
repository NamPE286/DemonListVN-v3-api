import type { Request, Response } from 'express'
import refreshService from '@src/services/refreshService'

export class RefreshController {
    async refreshRanks(req: Request, res: Response) {
        try {
            await refreshService.refreshRanks()
            res.send()
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }
}

export default new RefreshController()
