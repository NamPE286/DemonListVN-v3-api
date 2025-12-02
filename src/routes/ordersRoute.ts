import express from 'express'
import userAuth from '@src/middleware/userAuth'
import ordersController from '@src/controllers/ordersController'

const router = express.Router()

/**
* @openapi
* "/orders":
*   get:
*     tags:
*       - Orders
*     summary: Get player's orders
*     responses:
*       200:
*         description: Success
*/
router.route('/')
    .get(userAuth, (req, res) => ordersController.getOrders(req, res))

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
    .get((req, res) => ordersController.getPaymentLink(req, res))

export default router
