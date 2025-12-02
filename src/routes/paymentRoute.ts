import express from 'express'
import userAuth from '@src/middleware/userAuth'
import webhookAuth from '@src/middleware/webhookAuth'
import paymentController from '@src/controllers/paymentController'

const router = express.Router()

router.route('/getPaymentLink/:productID/:quantity')
    .get(userAuth, (req, res) => paymentController.getPaymentLinkForProduct(req, res))

router.route('/getPaymentLink')
    .post(userAuth, (req, res) => paymentController.getPaymentLinkForOrder(req, res))

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
    .get((req, res) => paymentController.handleSuccessCallback(req, res))

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
    .get((req, res) => paymentController.handleCancelCallback(req, res))

router.route('/webhook')
    .post(webhookAuth, (req, res) => paymentController.handleWebhook(req, res))

export default router
