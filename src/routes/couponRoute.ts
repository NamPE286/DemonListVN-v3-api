import userAuth from '@src/middleware/userAuth'
import express from 'express'
import couponController from '@src/controllers/couponController'

const router = express.Router()

router.route('/:code')
    .get(userAuth, (req, res) => couponController.getCoupon(req, res))

router.route('/:code')
    .delete(userAuth, (req, res) => couponController.redeemCoupon(req, res))

export default router
