import storeService from '@src/services/storeService'
import { sepay } from '@src/lib/classes/sepay'
import { API_URL } from '@src/lib/constants'
import type Player from '@lib/classes/Player'
import type { SepayWebhookBody } from '@src/lib/types/sepayWebhook'
import type { OrderItem } from '@src/types/order'

interface PaymentItem {
    name: string
    quantity: number
    price: number
}

export class PaymentService {
    private async getSepayPaymentLink(
        orderID: number,
        amount: number,
        description: string
    ): Promise<string | null> {
        const url = sepay.checkout.initCheckoutUrl()
        const payload = sepay.checkout.initOneTimePaymentFields({
            payment_method: 'BANK_TRANSFER',
            order_invoice_number: String(orderID),
            order_amount: amount,
            currency: 'VND',
            order_description: description,
            success_url: `${API_URL}/payment/success?orderCode=${orderID}`,
            error_url: `${API_URL}/payment/error?orderCode=${orderID}`,
            cancel_url: `${API_URL}/payment/cancelled?orderCode=${orderID}`
        })

        const stringifiedPayload = Object.fromEntries(
            Object.entries(payload).map(([key, value]) => [key, String(value)])
        )

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(stringifiedPayload).toString(),
            redirect: 'manual'
        })

        if (response.status === 302) {
            return response.headers.get('location')
        }

        console.log(response.status)

        return null
    }

    async getPaymentLinkForProduct(productID: number, quantity: number, userUid: string, giftTo?: string, targetClanID?: number) {
        const id = new Date().getTime()
        const product = await storeService.getProductById(productID);
        const amount = product.price! * quantity

        const redirectUrl = await this.getSepayPaymentLink(
            id,
            amount,
            `${product.name} x${quantity}`
        )

        if (!redirectUrl) {
            throw new Error('Failed to get payment link')
        }

        await storeService.addNewOrder(
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

    async getPaymentLinkForOrder(user: Player, recipientName: string, items: OrderItem[], address: string, phone: number) {
        const orderID = await storeService.addOrderItems(user, recipientName, items, address, phone, 'Bank Transfer')
        const order = await storeService.getOrder(orderID)
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
        const redirectUrl = await this.getSepayPaymentLink(orderID, amount, description)

        if (!redirectUrl) {
            throw new Error('Failed to get payment link')
        }

        return redirectUrl
    }

    async waitForPayment(orderId: number): Promise<boolean> {
        const maxAttempts = 10
        let attempts = 0

        while (attempts < maxAttempts) {
            const order = await storeService.getOrder(orderId)

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
        const order = await storeService.getOrder(orderId)

        if (order.state === 'CANCELLED' || order.state === 'PAID') {
            return
        }

        for (const i of order.orderTracking) {
            if (i.delivering) {
                return
            }
        }

        if (order.paymentMethod === 'Bank Transfer') {
            await sepay.order.cancel(String(orderId))
        }

        if (order.state === 'PENDING' && order.paymentMethod === 'COD') {
            await storeService.renewStock(order)
        }

        await storeService.changeOrderState(orderId, 'CANCELLED')
    }

    async processWebhook(body: SepayWebhookBody) {
        const { notification_type, order: orderData } = body

        if (notification_type !== 'ORDER_PAID') {
            return false
        }

        const orderId = parseInt(orderData.order_invoice_number)

        await storeService.handlePayment(orderId, orderData)

        return true
    }
}

export default new PaymentService()
