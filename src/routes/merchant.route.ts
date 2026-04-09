import supabase from '@src/client/supabase'
import { sendNotification } from '@src/services/notification.service'
import { getOrder, getAllOrders, getAllProducts, changeOrderState, upsertProduct } from '@src/services/store.service'
import { getAllRecordCards, markRecordCardPrinted } from '@src/services/card.service'
import managerAuth from '@src/middleware/manager-auth.middleware'
import express from 'express'
import { FRONTEND_URL } from '@src/config/url'

const router = express.Router()

const VALID_STATES = ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED']

/**
 * @openapi
 * "/merchant/orders/all":
 *   get:
 *     tags:
 *       - Merchant
 *     summary: Get all orders with filtering (manager only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: state
 *         in: query
 *         description: Filter by order state
 *         schema:
 *           type: string
 *       - name: paymentMethod
 *         in: query
 *         description: Filter by payment method
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         description: Search term
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
router.route('/orders/all')
    .get(managerAuth, async (req, res) => {
        try {
            const { state, paymentMethod, search } = req.query as {
                state?: string, paymentMethod?: string, search?: string
            }
            const data = await getAllOrders({ state, paymentMethod, search })
            res.send(data)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    })

router.route('/order/:id/state')
    /**
     * @openapi
     * "/merchant/order/{id}/state":
     *   patch:
     *     tags:
     *       - Merchant
     *     summary: Change order state (manager only)
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
     *               state:
     *                 type: string
     *                 enum: [PENDING, PAID, CANCELLED, EXPIRED]
     *     responses:
     *       200:
     *         description: Order state updated successfully
     *       400:
     *         description: Invalid state
     *       500:
     *         description: Internal server error
     */
    .patch(managerAuth, async (req, res) => {
        const { state } = req.body as { state: string }
        const { id } = req.params

        if (!VALID_STATES.includes(state)) {
            res.status(400).send({ message: 'Invalid state' })
            return
        }

        try {
            await changeOrderState(parseInt(id), state)
            res.send()
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    })

router.route('/products')
    /**
     * @openapi
     * "/merchant/products":
     *   get:
     *     tags:
     *       - Merchant
     *     summary: Get all products (manager only)
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
     *   post:
     *     tags:
     *       - Merchant
     *     summary: Create a product (manager only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Product created successfully
     *       500:
     *         description: Internal server error
     */
    .get(managerAuth, async (req, res) => {
        try {
            const data = await getAllProducts()
            res.send(data)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    })
    .post(managerAuth, async (req, res) => {
        try {
            const data = await upsertProduct(req.body)
            res.send(data)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    })

router.route('/products/:id')
    /**
     * @openapi
     * "/merchant/products/{id}":
     *   patch:
     *     tags:
     *       - Merchant
     *     summary: Update a product (manager only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The product ID
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Product updated successfully
     *       500:
     *         description: Internal server error
     */
    .patch(managerAuth, async (req, res) => {
        const { id } = req.params
        try {
            const data = await upsertProduct({ ...req.body, id: parseInt(id) })
            res.send(data)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    })

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
    .get(managerAuth, async (req, res) => {
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
    .post(managerAuth, async (req, res) => {
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

        if (content.toLowerCase().includes("delivered") || content.includes("đã được giao thành công")) {
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

router.route('/record-cards')
    /**
     * @openapi
     * "/merchant/record-cards":
     *   get:
     *     tags:
     *       - Merchant
     *     summary: Get all record cards (manager only)
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
    .get(managerAuth, async (req, res) => {
        try {
            const data = await getAllRecordCards()
            res.send(data)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    })

router.route('/record-cards/:id/printed')
    /**
     * @openapi
     * "/merchant/record-cards/{id}/printed":
     *   patch:
     *     tags:
     *       - Merchant
     *     summary: Mark a record card as printed (manager only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The record card ID
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Record card marked as printed successfully
     *       500:
     *         description: Internal server error
     */
    .patch(managerAuth, async (req, res) => {
        const { id } = req.params
        try {
            await markRecordCardPrinted(id)
            res.send()
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    })

export default router