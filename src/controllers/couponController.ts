import type { Request, Response } from 'express'
import couponService from '@src/services/couponService'

export class CouponController {
    async getCoupon(req: Request, res: Response) {
        const { code } = req.params

        try {
            const coupon = await couponService.getCoupon(code)

            res.send(coupon)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async redeemCoupon(req: Request, res: Response) {
        const { code } = req.params
        const { user } = res.locals

        try {
            await couponService.redeemCoupon(code, user)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new CouponController()
