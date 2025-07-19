import { addOrderItems } from '@src/lib/client/store';
import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/')
    .post(userAuth, async (req, res) => {
        interface Item {
            orderID: number
            productID: number;
            quantity: number;
        }

        const { user } = res.locals
        const { items, address, phone, paymentMethod } = req.body as {
            items: Item[],
            address: string | undefined,
            phone: number | undefined,
            paymentMethod: string | undefined
        };

        if (!paymentMethod || paymentMethod != 'COD') {
            res.status(501).send({
                message: "Payment method is not supported in this route"
            })

            return
        }

        if (!address || !phone) {
            res.status(400)
            return
        }
        try {
            await addOrderItems(user, items, address, phone, paymentMethod)
        } catch (err) {
            console.error(err)
            res.status(400).send({
                // @ts-ignore
                message: err.message
            })

            return
        }

        res.send()
    })

export default router