import storeService from '@src/services/storeService'
import type Player from '@lib/classes/Player'

export class CouponService {
    async getCoupon(code: string) {
        return await storeService.getCoupon(code)
    }

    async redeemCoupon(code: string, user: Player) {
        await storeService.redeem(code, user)
    }
}

export default new CouponService()
