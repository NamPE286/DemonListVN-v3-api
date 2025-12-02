import type { Request, Response } from 'express'
import playerService from '@src/services/playerService'

export class PlayersController {
    async getPlayers(req: Request, res: Response) {
        try {
            const players = await playerService.getFilteredPlayers(req.query)
            res.send(players)
        } catch (error) {
            res.status(500).send()
        }
    }

    async getPlayersBatch(req: Request, res: Response) {
        const { batch } = req.body

        if (!batch) {
            res.send()
            return
        }

        try {
            const players = await playerService.getPlayersByBatch(batch)
            res.send(players)
        } catch (error) {
            res.status(500).send()
        }
    }
}

export default new PlayersController()
