import type { Request, Response } from 'express'
import levelsService from '@src/services/levelsService'

export class LevelsController {
    async getNewLevels(req: Request, res: Response) {
        try {
            const levels = await levelsService.getNewLevels()
            res.send(levels)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }

    async getRandomLevels(req: Request, res: Response) {
        try {
            const { list, limit } = req.query
            const filterType = list ? String(list) : null
            const limitNum = Number(limit)

            const levels = await levelsService.getRandomLevels(limitNum, filterType)
            res.send(levels)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }
}

export default new LevelsController()
