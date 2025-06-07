import express from 'express'
import { payOS } from '@src/lib/classes/payOS';
import { getProductByID, addNewOrder, changeOrderState, getOrderByID, getOrders } from '@src/lib/client/store';
import userAuth from '@src/middleware/userAuth';
import Player from '@src/lib/classes/Player';
import supabase from '@src/database/supabase';
import { sendNotification } from '@src/lib/client/notification'

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
        const paymentLink = await payOS.getPaymentLinkInformation(id);

        changeOrderState(id, paymentLink.status);

        if (paymentLink.status != "PAID") {
            res.redirect(`https://demonlistvn.com/orders`)
            return;
        }

        const order = await getOrderByID(id);
        const player = new Player({ uid: order.giftTo ? order.giftTo : order.userID })

        if (order.delivered) {
            res.redirect(`https://demonlistvn.com/supporter/success?id=${id}`)
            return;
        }

        await player.pull();
        await player.extendSupporter(order.quantity);

        const { error } = await supabase
            .from("orders")
            .update({ delivered: true })
            .eq("id", order.id)

        if (error) {
            throw error
        }

        res.redirect(`https://demonlistvn.com/supporter/success?id=${id}`)

        if (order.giftTo) {
            await sendNotification({
                content: `You have been gifted ${order.quantity} month${order.quantity > 1 ? "s" : ""} of Demon List VN Supporter Role`,
                to: order.giftTo
            })
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

        res.redirect("https://demonlistvn.com/orders")

        const paymentLink = await payOS.getPaymentLinkInformation(id);

        changeOrderState(id, paymentLink.status);
    })

export default router;