import { addOrderItems, getOrder, getOrders } from '@src/services/store.service';
import userAuth from '@src/middleware/userAuth.middleware'
import express from 'express'
import { sepay } from '@src/client/sepay';

const router = express.Router()

router.route('/')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals;

        res.send(await getOrders(user.uid!))
    })
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
                orderID: await addOrderItems(user, recipientName, items, address, phone, 'COD', true)
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

/**
* @openapi
* "/orders/getPaymentLink/{id}":
*   get:
*     tags:
*       - Orders
*     summary: Get payment link
*     parameters:
*       - name: id
*         in: path
*         description: The ID of the order
*         required: true
*         schema:
*           type: number
*     responses:
*       200:
*         description: Success
*/
router.route('/getPaymentLink/:id')
    .get(async (req, res) => {
        const { id } = req.params

        res.send(await sepay.order.retrieve(id));
    })

export default router