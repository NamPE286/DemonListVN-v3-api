import express from 'express'
import { sendNotification } from '@src/lib/client/notification'
import adminAuth from '@src/middleware/adminAuth'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/notification":
      *   post:
      *     tags:
      *       - Notification
      *     summary: Send a notification
      *     requestBody:
      *         required: true
      *         content:
      *             application/json:
      *     responses:
      *       200:
      *         description: Success
     */
    .post(adminAuth, async (req, res) => {
        try {
            await sendNotification(req.body)
            res.send()
        } catch(err) {
            res.status(500).send()
        }

    })

export default router