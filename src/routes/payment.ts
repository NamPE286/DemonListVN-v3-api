import express from 'express'
import { payOS } from '@src/lib/classes/payOS';
import { getProductByID } from '@src/lib/client/store';
import userAuth from '@src/middleware/userAuth';

const router = express.Router();

router.route('/getPaymentLink/:productID')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { productID } = req.params

        res.status(200).send(await getProductByID(parseInt(productID)));

        return;

        const id = new Date().getTime();
        const body = {
            orderCode: id,
            amount: 20000,
            description: `Demon List VN Supporter 1 Month`,
            items: [
                {
                    name: "Demon List VN Supporter",
                    quantity: 1,
                    price: 20000,
                },
            ],
            cancelUrl: "http://localhost:5173/supporter",
            returnUrl: `http://localhost:5173/supporter/success/${id}`,
        };

        const paymentLinkRes = await payOS.createPaymentLink(body);

        res.status(200).send(paymentLinkRes);
    })

router.route('/getOrder/:id')
    .get(async (req, res) => {
        const { id } = req.params;
        const paymentLink = await payOS.getPaymentLinkInformation(parseInt(id));

        res.status(200).send(paymentLink);

    })

export default router;