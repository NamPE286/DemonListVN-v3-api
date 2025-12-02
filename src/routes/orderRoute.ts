import express from 'express'
import userAuth from '@src/middleware/userAuth'
import orderController from '@src/controllers/orderController'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/order":
     *   post:
     *     tags:
     *       - Order
     *     summary: Create a new order
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *     responses:
     *       200:
     *         description: Success
     */
    .post(userAuth, (req, res) => orderController.createOrder(req, res))

router.route('/:id')
    /**
     * @openapi
     * "/order/{id}":
     *   get:
     *     tags:
     *       - Order
     *     summary: Get an order by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the order
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get(userAuth, (req, res) => orderController.getOrder(req, res))

export default router
