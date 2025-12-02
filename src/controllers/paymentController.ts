import type { Request, Response } from 'express'
import paymentService from '@src/services/paymentService'
import { FRONTEND_URL } from '@src/lib/constants'
import type { SepayWebhookBody } from '@src/lib/types/sepayWebhook'
import type { OrderItem } from '@src/types/order'

export class PaymentController {
    async getPaymentLinkForProduct(req: Request, res: Response) {
        const { user } = res.locals
        const { giftTo, targetClanID } = req.query
        const { productID, quantity } = req.params

        try {
            const redirectUrl = await paymentService.getPaymentLinkForProduct(
                parseInt(productID),
                parseInt(quantity),
                user.uid!,
                giftTo ? String(giftTo) : undefined,
                targetClanID ? Number(targetClanID) : undefined
            )

            res.send({ checkoutUrl: redirectUrl })
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }

    async getPaymentLinkForOrder(req: Request, res: Response) {
        const { items, address, phone, recipientName } = req.body as {
            items: OrderItem[]
            address: string | undefined
            phone: number | undefined
            recipientName: string | undefined
        }
        const { user } = res.locals

        if (!address || !phone || !recipientName) {
            res.status(400).send({
                message: 'Missing info'
            })

            return
        }

        try {
            const redirectUrl = await paymentService.getPaymentLinkForOrder(user, recipientName, items, address, phone)

            res.send({ checkoutUrl: redirectUrl })
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }

    async handleSuccessCallback(req: Request, res: Response) {
        const { orderCode } = req.query
        const id = parseInt(String(orderCode))

        try {
            const success = await paymentService.waitForPayment(id)

            if (success) {
                res.redirect(`${FRONTEND_URL}/supporter/success?id=${id}`)

                return
            }

            res.status(500).send({ message: 'Payment verification timeout' })
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: 'Payment verification failed' })
        }
    }

    async handleCancelCallback(req: Request, res: Response) {
        const { orderCode } = req.query
        const id = parseInt(String(orderCode))

        try {
            await paymentService.cancelPayment(id)

            res.redirect(`${FRONTEND_URL}/orders/${id}`)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }

    async handleWebhook(req: Request<{}, any, SepayWebhookBody>, res: Response) {
        try {
            const processed = await paymentService.processWebhook(req.body)

            if (processed) {
                res.send({ message: 'Webhook processed successfully' })
            } else {
                res.send({ message: 'Notification received' })
            }
        } catch (error) {
            console.error('Webhook processing error:', error)
            res.status(500).send({ message: 'Webhook processing failed' })
        }
    }
}

export default new PaymentController()
