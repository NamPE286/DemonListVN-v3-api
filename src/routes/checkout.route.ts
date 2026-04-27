import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import { addOrderItems, getOrder } from '@src/services/store.service'
import { createRecordCard, updateRecordCardImg, updateRecordCardAvatar } from '@src/services/card.service'
import { getSepayPaymentLink } from '@src/services/payment.service'
import supabase from '@src/client/supabase'

const router = express.Router()

const PAPER_CARD_PRODUCT_ID = 8
const PLASTIC_CARD_PRODUCT_ID = 9

type RecordCardItem = {
    type: 'record-card'
    levelID: number
    template: number
    material: 'paper' | 'plastic'
    imgUrl?: string
    avatarUrl?: string
    levelName: string
}

type ProductItem = {
    productID: number
    quantity: number
}

type CartItem = RecordCardItem | ProductItem

/**
 * @openapi
 * "/checkout":
 *   post:
 *     tags:
 *       - Checkout
 *     summary: Process checkout for mixed cart (products + record cards)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cartItems, address, phone, recipientName, paymentMethod]
 *             properties:
 *               cartItems:
 *                 type: array
 *               address:
 *                 type: string
 *               phone:
 *                 type: integer
 *               recipientName:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [Bank Transfer, COD]
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderID:
 *                   type: integer
 *                 checkoutUrl:
 *                   type: string
 *       400:
 *         description: Missing or invalid fields
 *       500:
 *         description: Internal server error
 */
router.route('/')
    .post(userAuth, async (req, res) => {
        const { user } = res.locals
        const { cartItems, address, phone, recipientName, paymentMethod } = req.body as {
            cartItems: CartItem[]
            address: string
            phone: number
            recipientName: string
            paymentMethod: 'Bank Transfer' | 'COD'
        }

        if (!cartItems?.length || !address || !phone || !recipientName || !paymentMethod) {
            res.status(400).send({ message: 'Missing required fields' })
            return
        }

        const recordCards = cartItems.filter((i): i is RecordCardItem => (i as RecordCardItem).type === 'record-card')
        const productItems = (cartItems.filter((i) => (i as RecordCardItem).type !== 'record-card') as ProductItem[])
            .map((i) => ({ productID: i.productID, quantity: i.quantity, orderID: 0 }))

        const cardProductItems = recordCards.map((rc) => ({
            productID: rc.material === 'paper' ? PAPER_CARD_PRODUCT_ID : PLASTIC_CARD_PRODUCT_ID,
            quantity: 1,
            orderID: 0
        }))

        const allItems = [...productItems, ...cardProductItems]

        let orderID: number
        let checkoutUrl: string | undefined

        try {
            if (paymentMethod === 'Bank Transfer') {
                orderID = await addOrderItems(user, recipientName, allItems, address, phone, 'Bank Transfer')
                const order = await getOrder(orderID)

                let amount = order.fee
                for (const i of order.orderItems) {
                    amount += i.quantity * i.products?.price
                }

                const description = order.orderItems
                    .map((i: any) => `${i.products?.name} x${i.quantity}`)
                    .join(', ')

                const redirectUrl = await getSepayPaymentLink(orderID, amount, description)

                if (!redirectUrl) {
                    res.status(500).send({ message: 'Failed to get payment link' })
                    return
                }

                checkoutUrl = redirectUrl
            } else {
                orderID = await addOrderItems(user, recipientName, allItems, address, phone, 'COD', true)
            }
        } catch (err) {
            console.error(err)
            res.status(400).send({ message: (err as Error).message })
            return
        }

        for (const rc of recordCards) {
            try {
                const { data: record, error: recordError } = await supabase
                    .from('records')
                    .select('userid, acceptedManually')
                    .eq('levelid', rc.levelID)
                    .eq('userid', user.uid!)
                    .eq('acceptedManually', true)
                    .single()

                if (recordError || !record) continue

                const cardID = await createRecordCard(orderID, user.uid!, rc.levelID, rc.template, rc.material)

                const patches: Promise<void>[] = []
                if (rc.imgUrl) patches.push(updateRecordCardImg(String(cardID), user.uid!, rc.imgUrl).catch(() => {}))
                if (rc.avatarUrl) patches.push(updateRecordCardAvatar(String(cardID), user.uid!, rc.avatarUrl).catch(() => {}))
                await Promise.all(patches)
            } catch (err) {
                console.error(`Failed to attach record card for level ${rc.levelID}:`, err)
            }
        }

        res.send({ orderID, checkoutUrl })
    })

export default router
