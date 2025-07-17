import express from 'express'
import { payOS } from '@src/lib/classes/payOS';
import { getProductByID, addNewOrder, changeOrderState, getOrderByID, getOrders } from '@src/lib/client/store';
import userAuth from '@src/middleware/userAuth';
import Player from '@src/lib/classes/Player';
import supabase from '@src/database/supabase';
import { sendNotification } from '@src/lib/client/notification'
import { sendMessageToChannel } from '@src/lib/client/discord';

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
        res.status(200).send(paymentLinkRes);
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
        const order = await getOrderByID(id);

        if (order.delivered) {
            res.redirect(`https://www.demonlistvn.com/supporter/success?id=${id}`)
            return;
        }

        if (order.state == 'CANCELLED') {
            await payOS.cancelPaymentLink(order.id)
            res.redirect(`https://www.demonlistvn.com/orders`)

            return;
        }

        const paymentLink = await payOS.getPaymentLinkInformation(id);
        order.state = paymentLink.status

        await changeOrderState(id, paymentLink.status);

        if (paymentLink.status == 'PENDING') {
            res.redirect(`https://pay.payos.vn/web/${paymentLink.id}`)
            return;
        }

        if (paymentLink.status != "PAID") {
            res.redirect(`https://www.demonlistvn.com/orders`)
            return;
        }


        const buyer = new Player({ uid: order.userID })
        const recipent = new Player({ uid: order.giftTo ? order.giftTo : order.userID })

        await buyer.pull();
        await recipent.pull();

        if (order.productID === 1) {
            await recipent.extendSupporter(order.quantity);

            const { error } = await supabase
                .from("orders")
                .update({ delivered: true })
                .eq("id", order.id)

            if (error) {
                throw error
            }
        }

        res.redirect(`https://www.demonlistvn.com/supporter/success?id=${id}`)

        if (order.productID === 1) {
            let msg = ''

            if (buyer.discord) {
                msg = `<@${buyer.discord}>`
            } else {
                msg = `[${buyer.name}](https://demonlistvn.com/player/${buyer.uid})`
            }

            if (order.giftTo) {
                msg += ` gifted ${order.quantity} month${order.quantity > 1 ? "s" : ""} of Demon List VN Supporter Role to `

                if (recipent.discord) {
                    msg = `<@${recipent.discord}>`
                } else {
                    msg = `[${recipent.name}](https://demonlistvn.com/player/${recipent.uid})`
                }

                await sendNotification({
                    content: `You have been gifted ${order.quantity} month${order.quantity > 1 ? "s" : ""} of Demon List VN Supporter Role`,
                    to: order.giftTo
                })
            } else {
                msg += ` purchased ${order.quantity} month${order.quantity > 1 ? "s" : ""} of Demon List VN Supporter Role`

            }

            msg += '!'

            await sendMessageToChannel(String(process.env.DISCORD_GENERAL_CHANNEL_ID), msg)
        }
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

        res.redirect("https://www.demonlistvn.com/orders")

        const paymentLink = await payOS.getPaymentLinkInformation(id);

        changeOrderState(id, paymentLink.status);
    })

export default router;