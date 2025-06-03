import express from 'express'
import { payOS } from '@src/lib/classes/payOS';
import { getProductByID, addNewOrder, changeOrderState } from '@src/lib/client/store';
import userAuth from '@src/middleware/userAuth';

const router = express.Router();

router.route('/getPaymentLink/:productID')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { productID } = req.params
        const id = new Date().getTime();
        const product = await getProductByID(parseInt(productID));
        const paymentLinkRes = await payOS.createPaymentLink({
            orderCode: id,
            amount: 20000,
            description: "dlvn",
            items: [
                {
                    name: product.name!,
                    quantity: 1,
                    price: product.price!,
                },
            ],
            cancelUrl: "http://localhost:8080/payment/cancelled",
            returnUrl: "http://localhost:8080/payment/success",
        });

        await addNewOrder(id, parseInt(productID), user);
        res.status(200).send(paymentLinkRes);
    })

router.route('/success')
    .get(async (req, res) => {
        const { orderCode } = req.query;
        const id = parseInt(String(orderCode));

        res.redirect(`http://localhost:5173/supporter/success?id=${id}`)

        const paymentLink = await payOS.getPaymentLinkInformation(id);

        changeOrderState(id, paymentLink.status);
    })

router.route('/cancelled')
    .get(async (req, res) => {
        const { orderCode } = req.query;
        const id = parseInt(String(orderCode));

        res.redirect("http://localhost:5173/supporter")

        const paymentLink = await payOS.getPaymentLinkInformation(id);

        changeOrderState(id, paymentLink.status);
    })

router.route('/getOrder/:id')
    .get(async (req, res) => {
        const { id } = req.params;
        const paymentLink = await payOS.getPaymentLinkInformation(parseInt(id));

        res.status(200).send(paymentLink);
    })

export default router;