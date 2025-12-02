import type { Request, Response } from 'express'
import cardService from '@src/services/cardService'

export class CardController {
    async getCard(req: Request, res: Response) {
        const { id } = req.params

        try {
            const card = await cardService.getCard(id)

            res.send(card)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async linkCard(req: Request, res: Response) {
        const { id } = req.params
        const { user } = res.locals

        try {
            await cardService.linkCard(id, user)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async updateCardContent(req: Request, res: Response) {
        const { id } = req.params

        try {
            await cardService.updateCardContent(id, req.body.content)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new CardController()
