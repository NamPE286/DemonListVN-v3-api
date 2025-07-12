import { redeem } from '@src/lib/client/store'
import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/:code')
    .delete(userAuth, async (req, res) => {
        const { code } = req.params
        const { user } = res.locals

        try {
            await redeem(code, user)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router