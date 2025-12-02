import express from 'express'
import adminAuth from '@src/middleware/adminAuth'
import merchantController from '@src/controllers/merchantController'

const router = express.Router()

router.route('/orders')
    .get(adminAuth, merchantController.getOrders.bind(merchantController))

router.route('/order/:id/tracking')
    .post(adminAuth, merchantController.addOrderTracking.bind(merchantController))

export default router
