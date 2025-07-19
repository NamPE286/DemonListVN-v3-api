import { addOrderItems, getOrder } from '@src/lib/client/store';
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
        const { items, address, phone, recipentName } = req.body as {
            items: Item[],
            address: string | undefined,
            phone: number | undefined,
            recipentName: string | undefined
        };

        if (!address || !phone || !recipentName) {
            res.status(400).send({
                message: "Missing info"
            })
            return
        }
        try {
            await addOrderItems(user, recipentName, items, address, phone, 'COD')
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

router.route('/:id')
    .get(async (req, res) => {
        const { id } = req.params

        try {
            res.send(await getOrder(parseInt(id)))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router