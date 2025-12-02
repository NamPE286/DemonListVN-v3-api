import type { Request, Response } from 'express'
import rulesService from '@src/services/rulesService'

export class RulesController {
    async getRules(req: Request, res: Response) {
        try {
            const rules = await rulesService.getRules()

            res.send(rules)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }
}

export default new RulesController()
