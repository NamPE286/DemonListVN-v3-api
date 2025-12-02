import { sepay } from '@src/lib/classes/sepay'
import { getOrders } from '@src/services/storeClientService'

export class OrdersService {
    async getOrders(uid: string) {
        return await getOrders(uid)
    }

    async getPaymentLink(orderId: string) {
        return await sepay.order.retrieve(orderId)
    }
}

export default new OrdersService()
