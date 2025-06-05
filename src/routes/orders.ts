import { payOS } from "@src/lib/classes/payOS";
import { getOrders } from "@src/lib/client/store";
import userAuth from "@src/middleware/userAuth";
import express from "express"

const router = express.Router();

/**
* @openapi
* "/":
*   get:
*     tags:
*       - Orders
*     summary: Get player's orders
*     responses:
*       200:
*         description: Success
*/
router.route('/')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals;

        res.send(await getOrders(user.uid!))
    })

/**
* @openapi
* "/getPaymentLink/{id}":
*   get:
*     tags:
*       - Payment
*     summary: Get payment link
*     parameters:
*       - name: id
*         in: path
*         description: The ID of the order
*         required: true
*         schema:
*           type: number
*     responses:
*       200:
*         description: Success
*/
router.route('/getPaymentLink/:id')
    .get(async (req, res) => {
        const { id } = req.params

        res.send(await payOS.getPaymentLinkInformation(parseInt(id)));
    })

export default router;