import express from 'express'
import adminAuth from '@src/middleware/adminAuth'
import merchantController from '@src/controllers/merchantController'

const router = express.Router()

router.route('/orders')
    .get(adminAuth, (req, res) => merchantController.getOrders(req, res))

router.route('/order/:id/tracking')
    .post(adminAuth, (req, res) => merchantController.addOrderTracking(req, res))

export default router
