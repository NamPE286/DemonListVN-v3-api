import type { Request, Response } from 'express'
import leaderboardService from '@src/services/leaderboardService'

export class LeaderboardController {
    async getDemonListLeaderboard(req: Request, res: Response) {
        try {
            const result = await leaderboardService.getDemonListLeaderboard(req.query)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getFeaturedListLeaderboard(req: Request, res: Response) {
        try {
            const result = await leaderboardService.getFeaturedListLeaderboard(req.query)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getPlatformerListLeaderboard(req: Request, res: Response) {
        try {
            const result = await leaderboardService.getPlatformerListLeaderboard(req.query)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new LeaderboardController()
