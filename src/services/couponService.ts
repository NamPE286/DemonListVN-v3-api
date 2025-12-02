import { getCoupon, redeem } from '@src/lib/client/store'
import type Player from '@lib/classes/Player'

export class CouponService {
    async getCoupon(code: string) {
        return await getCoupon(code)
    }

    async redeemCoupon(code: string, user: Player) {
        await redeem(code, user)
    }
}

export default new CouponService()
