import { addOrderItems, getOrder } from '@src/services/storeClientService'
import type Player from '@lib/classes/Player'
import type { OrderItem } from '@src/types/order'

export class OrderService {
    async createOrder(user: Player, recipientName: string, items: OrderItem[], address: string, phone: number) {
        const orderID = await addOrderItems(user, recipientName, items, address, phone, 'COD', true)

        return orderID
    }

    async getOrder(orderId: number, user: Player) {
        const order = await getOrder(orderId)

        if (!user.isAdmin && order.userID != user.uid) {
            throw new Error('Unauthorized')
        }

        return order
    }
}

export default new OrderService()
