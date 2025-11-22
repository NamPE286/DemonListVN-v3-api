import { getInventoryItem } from '@src/lib/client/inventory'
import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals

        try {
            res.send(await user.getInventoryItems());
        } catch (err) {
            console.error(err);
            res.status(500).send()
        }
    })

router.route('/:id')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { id } = req.params

        try {
            const item = await getInventoryItem(Number(id))

            if (item.userID != user.uid) {
                throw new Error("User not owning this item")
            }

            res.send(item);
        } catch (err) {
            console.error(err);
            res.status(500).send()
        }
    })

export default router