import { addOrderItems, getOrder } from '@src/lib/client/store';
import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/')
    .post(userAuth, async (req, res) => {
        interface Item {
            orderID: number;
            productID: number;
            quantity: number;
        }

        const { user } = res.locals
        const { items, address, phone, recipientName } = req.body as {
            items: Item[],
            address: string | undefined,
            phone: number | undefined,
            recipientName: string | undefined
        };

        if (!address || !phone || !recipientName) {
            res.status(400).send({
                message: "Missing info"
            })
            return
        }

        try {
            res.send({
                orderID: await addOrderItems(user, recipientName, items, address, phone, 'COD')
            })
        } catch (err) {
            console.error(err)
            res.status(400).send({
                // @ts-ignore
                message: err.message
            })

            return
        }
    })

router.route('/:id')
    .get(userAuth, async (req, res) => {
        const { id } = req.params
        const { user } = res.locals

        try {
            const order = await getOrder(parseInt(id))

            if (!user.isAdmin && order.userID != user.uid) {
                res.status(401).send()
                return
            }

            res.send(order)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router