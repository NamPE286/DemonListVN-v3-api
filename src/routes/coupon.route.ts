import { getCoupon, redeem } from '@src/services/store.service'
import userAuth from '@src/middleware/user-auth.middleware'
import express from 'express'

const router = express.Router()

router.route('/:code')
    /**
     * @openapi
     * "/coupon/{code}":
     *   get:
     *     tags:
     *       - Coupon
     *     summary: Get coupon details by code
     *     security:
     *       - bearerAuth: []
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
     *         content:
     *           application/json:
     *             schema:
     *       500:
     *         description: Internal server error
     */
    .get(userAuth, async (req, res) => {
        const { code } = req.params

        try {
            const coupon = await getCoupon(code)
            res.send(coupon)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/:code')
    /**
     * @openapi
     * "/coupon/{code}":
     *   delete:
     *     tags:
     *       - Coupon
     *     summary: Redeem a coupon code
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: code
     *         in: path
     *         description: The coupon code to redeem
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Coupon redeemed successfully
     *       500:
     *         description: Internal server error
     */
    .delete(userAuth, async (req, res) => {
        const { code } = req.params
        const { user } = res.locals

        try {
            await redeem(code, user)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router