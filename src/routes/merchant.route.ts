import supabase from '@src/client/supabase'
import { sendNotification } from '@src/services/notification.service'
import { getOrder } from '@src/services/store.service'
import adminAuth from '@src/middleware/admin-auth.middleware'
import express from 'express'
import { FRONTEND_URL } from '@src/config/constants'

const router = express.Router()

router.route('/orders')
    /**
     * @openapi
     * "/merchant/orders":
     *   get:
     *     tags:
     *       - Merchant
     *     summary: Get all pending and paid orders for merchant
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     *       500:
     *         description: Internal server error
     */
    .get(adminAuth, async (req, res) => {
        const { data, error } = await supabase
            .from("orders")
            .select("*, orderTracking(*)")
            .or("and(paymentMethod.eq.COD,state.eq.PENDING),and(paymentMethod.eq.Bank Transfer,state.eq.PAID,delivered.eq.false)")
            .order("created_at", { ascending: false })
            .order("created_at", { referencedTable : "orderTracking", ascending: false })

        if (error) {
            console.error(error)
            res.status(500).send()
        }

        res.send(data)
    })

router.route('/order/:id/tracking')
    /**
     * @openapi
     * "/merchant/order/{id}/tracking":
     *   post:
     *     tags:
     *       - Merchant
     *     summary: Add tracking information to an order
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The order ID
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               content:
     *                 type: string
     *                 description: Tracking update content
     *               link:
     *                 type: string
     *                 description: Optional tracking link
     *     responses:
     *       200:
     *         description: Tracking information added successfully
     *       500:
     *         description: Internal server error
     */
    .post(adminAuth, async (req, res) => {
        const { content, link } = req.body as { content: string; link?: string }
        const { id } = req.params

        var { error } = await supabase
            .from("orderTracking")
            .insert({
                orderID: parseInt(id),
                content: content,
                link: (link ? link : null)
            })

        if (error) {
            console.error(error)
            res.status(500).send()
        }

        if (content.toLowerCase().includes("delivered")) {
            var { error } = await supabase
                .from("orders")
                .update({ state: "PAID", delivered: true })
                .eq('id', parseInt(id))

            if (error) {
                console.error(error)
                res.status(500).send()
            }
        }

        res.send()

        const order = await getOrder(parseInt(id))

        sendNotification({
            content: content,
            redirect: `${FRONTEND_URL}/orders/${id}`,
            to: order.userID
        }, true)

    })

export default router