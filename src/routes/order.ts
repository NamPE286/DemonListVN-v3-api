import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/')
    .post(userAuth, async (req, res) => {
        interface Item {
            id: number;
            quantity: number;
        }

        const { items, address, phone } = req.body as { items: Item[], address: string, phone: number };

        // TODO

    })

export default router