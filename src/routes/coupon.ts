import userAuth from '@src/middleware/userAuth'
import express from 'express'
import couponController from '@src/controllers/couponController'

const router = express.Router()

router.route('/:code')
    .get(userAuth, couponController.getCoupon.bind(couponController))

router.route('/:code')
    .delete(userAuth, couponController.redeemCoupon.bind(couponController))

export default router
