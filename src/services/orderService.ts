import { addOrderItems, getOrder } from '@src/lib/client/store'
import type Player from '@lib/classes/Player'

interface Item {
    orderID: number
    productID: number
    quantity: number
}

export class OrderService {
    async createOrder(user: Player, recipientName: string, items: Item[], address: string, phone: number) {
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
