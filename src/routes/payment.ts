import express from 'express'
import { getProductByID, addNewOrder, changeOrderState, getOrder, renewStock, handlePayment, addOrderItems } from '@src/lib/client/store';
import { getSepayPaymentLink } from '@src/lib/client/payment';
import userAuth from '@src/middleware/userAuth';
import { sepay } from '@src/lib/classes/sepay';

const router = express.Router();

router.route('/getPaymentLink/:productID/:quantity')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals;
        const { giftTo, targetClanID } = req.query;
        const { productID, quantity } = req.params;
        const id = new Date().getTime();
        const product = await getProductByID(parseInt(productID));
        const amount = product.price! * parseInt(quantity);

        const redirectUrl = await getSepayPaymentLink(
            id,
            amount,
            `${product.name} x${quantity}`
        );

        if (redirectUrl) {
            await addNewOrder(
                id,
                parseInt(productID),
                user.uid!,
                parseInt(quantity),
                giftTo ? String(giftTo) : null,
                amount,
                "VND",
                "Bank Transfer",
                null,
                null,
                0,
                null,
                targetClanID ? Number(targetClanID) : null
            );

            res.send({ checkoutUrl: redirectUrl });
            return;
        }

        res.status(500).send();
    });

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

        const description = paymentItem.map(i => `${i.name} x${i.quantity}`).join(', ')
        const redirectUrl = await getSepayPaymentLink(orderID, amount, description)

        if (redirectUrl) {
            res.send({ checkoutUrl: redirectUrl })
            return
        }

        res.status(500).send()
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
            await sepay.order.cancel(String(orderCode))
        }

        if (order.state == 'PENDING' && order.paymentMethod == 'COD') {
            await renewStock(order)
        }

        await changeOrderState(id, "CANCELLED");
    })

router.route('/webhook')
    .post(async (req, res) => {
        const { orderCode } = req.body.data
        const id = parseInt(String(orderCode))

        // if (paymentLink.status == 'EXPIRED') {
        //     await handlePayment(id)
        // }

        // logger.log(JSON.stringify(req.body))

        res.send()
    })

export default router;