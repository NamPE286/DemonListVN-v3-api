import express from 'express'
import userAuth from '@src/middleware/userAuth'
import webhookAuth from '@src/middleware/webhookAuth'
import paymentController from '@src/controllers/paymentController'

const router = express.Router()

router.route('/getPaymentLink/:productID/:quantity')
    .get(userAuth, paymentController.getPaymentLinkForProduct.bind(paymentController))

router.route('/getPaymentLink')
    .post(userAuth, paymentController.getPaymentLinkForOrder.bind(paymentController))

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
    .get(paymentController.handleSuccessCallback.bind(paymentController))

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
    .get(paymentController.handleCancelCallback.bind(paymentController))

router.route('/webhook')
    .post(webhookAuth, paymentController.handleWebhook.bind(paymentController))

export default router
