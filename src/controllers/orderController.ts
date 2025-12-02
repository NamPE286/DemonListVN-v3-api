import type { Request, Response } from 'express'
import orderService from '@src/services/orderService'

interface Item {
    orderID: number
    productID: number
    quantity: number
}

export class OrderController {
    async createOrder(req: Request, res: Response) {
        const { user } = res.locals
        const { items, address, phone, recipientName } = req.body as {
            items: Item[]
            address: string | undefined
            phone: number | undefined
            recipientName: string | undefined
        }

        if (!address || !phone || !recipientName) {
            res.status(400).send({
                message: 'Missing info'
            })

            return
        }

        try {
            const orderID = await orderService.createOrder(user, recipientName, items, address, phone)

            res.send({ orderID })
        } catch (err: any) {
            console.error(err)
            res.status(400).send({
                message: err.message
            })
        }
    }

    async getOrder(req: Request, res: Response) {
        const { id } = req.params
        const { user } = res.locals

        try {
            const order = await orderService.getOrder(parseInt(id), user)

            res.send(order)
        } catch (err: any) {
            console.error(err)

            if (err.message === 'Unauthorized') {
                res.status(401).send()

                return
            }

            res.status(500).send()
        }
    }
}

export default new OrderController()
