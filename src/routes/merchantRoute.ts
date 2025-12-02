import express from 'express'
import adminAuth from '@src/middleware/adminAuth'
import merchantController from '@src/controllers/merchantController'

const router = express.Router()

router.route('/orders')
    /**
     * @openapi
     * "/merchant/orders":
     *   get:
     *     tags:
     *       - Merchant
     *     summary: Get all orders for merchant
     *     responses:
     *       200:
     *         description: Success
     */
    .get(adminAuth, (req, res) => merchantController.getOrders(req, res))

router.route('/order/:id/tracking')
    /**
     * @openapi
     * "/merchant/order/{id}/tracking":
     *   post:
     *     tags:
     *       - Merchant
     *     summary: Add tracking information to an order
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the order
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *     responses:
     *       200:
     *         description: Success
     */
    .post(adminAuth, (req, res) => merchantController.addOrderTracking(req, res))

export default router
