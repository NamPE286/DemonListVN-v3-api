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

export default router