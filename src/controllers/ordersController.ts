import type { Request, Response } from 'express'
import ordersService from '@src/services/ordersService'

export class OrdersController {
    async getOrders(req: Request, res: Response) {
        const { user } = res.locals

        try {
            const orders = await ordersService.getOrders(user.uid!)

            res.send(orders)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getPaymentLink(req: Request, res: Response) {
        const { id } = req.params

        try {
            const paymentLink = await ordersService.getPaymentLink(id)

            res.send(paymentLink)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new OrdersController()
