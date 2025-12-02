import userAuth from '@src/middleware/userAuth'
import express from 'express'
import couponController from '@src/controllers/couponController'

const router = express.Router()

router.route('/:code')
    /**
     * @openapi
     * "/coupon/{code}":
     *   get:
     *     tags:
     *       - Coupon
     *     summary: Get a coupon by code
     *     parameters:
     *       - name: code
     *         in: path
     *         description: The coupon code
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get(userAuth, (req, res) => couponController.getCoupon(req, res))

router.route('/:code')
    /**
     * @openapi
     * "/coupon/{code}":
     *   delete:
     *     tags:
     *       - Coupon
     *     summary: Redeem a coupon
     *     parameters:
     *       - name: code
     *         in: path
     *         description: The coupon code
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .delete(userAuth, (req, res) => couponController.redeemCoupon(req, res))

export default router
