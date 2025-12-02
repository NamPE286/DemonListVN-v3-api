import express from 'express'
import userAuth from '@src/middleware/userAuth'
import orderController from '@src/controllers/orderController'

const router = express.Router()

router.route('/')
    .post(userAuth, orderController.createOrder.bind(orderController))

router.route('/:id')
    .get(userAuth, orderController.getOrder.bind(orderController))

export default router
