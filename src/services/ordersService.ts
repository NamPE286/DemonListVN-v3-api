import { sepay } from '@src/lib/classes/sepay'
import storeService from '@src/services/storeService'

export class OrdersService {
    async getOrders(uid: string) {
        return await storeService.getOrders(uid)
    }

    async getPaymentLink(orderId: string) {
        return await sepay.order.retrieve(orderId)
    }
}

export default new OrdersService()
