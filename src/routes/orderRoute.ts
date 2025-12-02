import express from 'express'
import userAuth from '@src/middleware/userAuth'
import orderController from '@src/controllers/orderController'

const router = express.Router()

router.route('/')
    .post(userAuth, (req, res) => orderController.createOrder(req, res))

router.route('/:id')
    .get(userAuth, (req, res) => orderController.getOrder(req, res))

export default router
