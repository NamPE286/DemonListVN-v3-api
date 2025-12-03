import storeService from '@src/services/storeService'
import type Player from '@lib/classes/Player'
import type { OrderItem } from '@src/types/order'

export class OrderService {
    async createOrder(user: Player, recipientName: string, items: OrderItem[], address: string, phone: number) {
        const orderID = await storeService.addOrderItems(user, recipientName, items, address, phone, 'COD', true)

        return orderID
    }

    async getOrder(orderId: number, user: Player) {
        const order = await storeService.getOrder(orderId)

        if (!user.isAdmin && order.userID != user.uid) {
            throw new Error('Unauthorized')
        }

        return order
    }
}

export default new OrderService()
