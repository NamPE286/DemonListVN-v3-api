import type { Request, Response } from 'express'
import searchService from '@src/services/searchService'

export class SearchController {
    async search(req: Request, res: Response) {
        try {
            const { query } = req.params
            const results = await searchService.search(query, req.query)

            res.send(results)
        } catch (error) {
            res.status(500).send()
        }
    }
}

export default new SearchController()
