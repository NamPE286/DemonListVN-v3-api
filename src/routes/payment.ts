import express from 'express'
import { payOS } from '@src/lib/classes/payOS';
import { getProductByID, addNewOrder, changeOrderState, addOrderItems, getOrder, renewStock, handlePayment } from '@src/lib/client/store';
import userAuth from '@src/middleware/userAuth';
import logger from '@src/utils/logger';

const router = express.Router();

/**
 * @openapi
 * "/payment/getPaymentLink/{productID}/{quantity}":
 *   get:
 *     tags:
 *       - Payment
 *     summary: Get payment link
 *     parameters:
 *       - name: productID
 *         in: path
 *         description: The ID of the product
 *         required: true
 *         schema:
 *           type: number
 *       - name: quantity
 *         in: path
 *         description: Number of product to buy
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/getPaymentLink/:productID/:quantity')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { giftTo } = req.query;
        const { productID, quantity } = req.params
        const id = new Date().getTime();
        const product = await getProductByID(parseInt(productID));
        const amount = product.price! * parseInt(quantity);
        const paymentLinkRes = await payOS.createPaymentLink({
            orderCode: id,
            amount: amount,
            description: "dlvn",
            expiredAt: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
            items: [
                {
                    name: product.name!,
                    quantity: parseInt(quantity),
                    price: product.price!,
                },
            ],
            cancelUrl: "https://api.demonlistvn.com/payment/cancelled",
            returnUrl: "https://api.demonlistvn.com/payment/success",
        });

        await addNewOrder(id, parseInt(productID), user.uid!, parseInt(quantity), giftTo ? String(giftTo) : null, amount, "VND");
        res.send(paymentLinkRes);
    })

router.route('/getPaymentLink')
    .post(userAuth, async (req, res) => {
        interface Item {
            orderID: number
            productID: number;
            quantity: number;
        }

        interface PaymentItem {
            name: string,
            quantity: number,
            price: number,
        }

        const { items, address, phone, recipientName } = req.body as {
            items: Item[],
            address: string | undefined,
            phone: number | undefined,
            recipientName: string | undefined
        };
        const { user } = res.locals

        if (!address || !phone || !recipientName) {
            res.status(400).send({
                message: "Missing info"
            })
            return
        }

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

        const paymentLinkRes = await payOS.createPaymentLink({
            orderCode: orderID,
            amount: amount,
            description: "dlvn",
            expiredAt: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
            items: paymentItem,
            cancelUrl: "https://api.demonlistvn.com/payment/cancelled",
            returnUrl: "https://api.demonlistvn.com/payment/success",
        });

        res.send(paymentLinkRes);
    })

/**
 * @openapi
 * "/payment/success":
 *   get:
 *     tags:
 *       - Payment
 *     summary: Callback route when payment is successful
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/success')
    .get(async (req, res) => {
        const { orderCode } = req.query;
        const id = parseInt(String(orderCode));

        await handlePayment(id, res)
    })

/**
* @openapi
* "/payment/cancelled":
*   get:
*     tags:
*       - Payment
*     summary: Callback route when payment is cancelled
*     responses:
*       200:
*         description: Success
*/
router.route('/cancelled')
    .get(async (req, res) => {
        const { orderCode } = req.query;
        const id = parseInt(String(orderCode));

        res.redirect(`https://www.demonlistvn.com/orders/${id}`)

        const order = await getOrder(id)

        if (order.state == 'CANCELLED' || order.state == 'PAID') {
            return
        }

        for (const i of order.orderTracking) {
            if (i.delivering) {
                return;
            }
        }

        if (order.paymentMethod == 'Bank Transfer') {
            try {
                await payOS.cancelPaymentLink(id)
            } catch { }
        }

        await changeOrderState(id, "CANCELLED");
        await renewStock(order)
    })

router.route('/webhook')
    .post(async (req, res) => {
        const { orderCode } = req.body.data
        const id = parseInt(String(orderCode))
        const paymentLink = await payOS.getPaymentLinkInformation(id);

        if (paymentLink.status == 'EXPIRED') {
            await handlePayment(id)
        }

        logger.log(JSON.stringify(req.body))

        res.send()
    })

export default router;