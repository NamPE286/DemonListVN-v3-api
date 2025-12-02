import { getProductByID, addNewOrder, changeOrderState, getOrder, renewStock, handlePayment, addOrderItems } from '@src/lib/client/store'
import { getSepayPaymentLink } from '@src/lib/client/payment'
import { sepay } from '@src/lib/classes/sepay'
import type Player from '@lib/classes/Player'
import type { SepayWebhookBody } from '@src/lib/types/sepayWebhook'

interface Item {
    orderID: number
    productID: number
    quantity: number
}

interface PaymentItem {
    name: string
    quantity: number
    price: number
}

export class PaymentService {
    async getPaymentLinkForProduct(productID: number, quantity: number, userUid: string, giftTo?: string, targetClanID?: number) {
        const id = new Date().getTime()
        const product = await getProductByID(productID)
        const amount = product.price! * quantity

        const redirectUrl = await getSepayPaymentLink(
            id,
            amount,
            `${product.name} x${quantity}`
        )

        if (!redirectUrl) {
            throw new Error('Failed to get payment link')
        }

        await addNewOrder(
            id,
            productID,
            userUid,
            quantity,
            giftTo ? String(giftTo) : null,
            amount,
            'VND',
            'Bank Transfer',
            null,
            null,
            0,
            null,
            targetClanID ? Number(targetClanID) : null
        )

        return redirectUrl
    }

    async getPaymentLinkForOrder(user: Player, recipientName: string, items: Item[], address: string, phone: number) {
        const orderID = await addOrderItems(user, recipientName, items, address, phone, 'Bank Transfer')
        const order = await getOrder(orderID)
        const paymentItem: PaymentItem[] = []
        let amount = order.fee

        for (const i of order.orderItems) {
            paymentItem.push({
                name: i.products?.name!,
                quantity: i.quantity,
                price: i.quantity * i.products?.price!
            })

            amount += i.quantity * i.products?.price!
        }

        const description = paymentItem.map(i => `${i.name} x${i.quantity}`).join(', ')
        const redirectUrl = await getSepayPaymentLink(orderID, amount, description)

        if (!redirectUrl) {
            throw new Error('Failed to get payment link')
        }

        return redirectUrl
    }

    async waitForPayment(orderId: number): Promise<boolean> {
        const maxAttempts = 10
        let attempts = 0

        while (attempts < maxAttempts) {
            const order = await getOrder(orderId)

            if (order.state === 'PAID') {
                return true
            }

            attempts++

            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 300))
            }
        }

        return false
    }

    async cancelPayment(orderId: number) {
        const order = await getOrder(orderId)

        if (order.state == 'CANCELLED' || order.state == 'PAID') {
            return
        }

        for (const i of order.orderTracking) {
            if (i.delivering) {
                return
            }
        }

        if (order.paymentMethod == 'Bank Transfer') {
            await sepay.order.cancel(String(orderId))
        }

        if (order.state == 'PENDING' && order.paymentMethod == 'COD') {
            await renewStock(order)
        }

        await changeOrderState(orderId, 'CANCELLED')
    }

    async processWebhook(body: SepayWebhookBody) {
        const { notification_type, order: orderData } = body

        if (notification_type !== 'ORDER_PAID') {
            return false
        }

        const orderId = parseInt(orderData.order_invoice_number)

        await handlePayment(orderId, orderData)

        return true
    }
}

export default new PaymentService()
