import express from 'express'
import { sendNotification } from '@src/lib/client'
import adminAuth from '@src/middleware/adminAuth'

const router = express.Router()

router.route('/')
    .post(adminAuth, async (req, res) => {
        await sendNotification(req.body)
        res.send()
    })

export default router