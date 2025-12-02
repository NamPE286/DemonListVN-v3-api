import type { Request, Response } from 'express'
import merchantService from '@src/services/merchantService'

export class MerchantController {
    async getOrders(req: Request, res: Response) {
        try {
            const orders = await merchantService.getOrders()

            res.send(orders)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }

    async addOrderTracking(req: Request, res: Response) {
        const { content, link } = req.body as { content: string; link?: string }
        const { id } = req.params

        try {
            await merchantService.addOrderTracking(parseInt(id), content, link)

            res.send()
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }
}

export default new MerchantController()
