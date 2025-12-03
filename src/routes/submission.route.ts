import express, { application } from 'express'
import { submitRecord } from '@src/services/record.service'
import userAuth from '@src/middleware/userAuth.middleware'
import logger from '@src/utils/logger'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/submission":
      *   POST:
      *     tags:
      *       - Submission
      *     summary: Add or edit a submission
      *     requestBody:
      *         required: true
      *         content:
      *             application/json:
      *     responses:
      *       200:
      *         description: Success
     */
    .post(userAuth, async (req, res) => {
        const { user } = res.locals
        req.body.userid = user.uid
        req.body.timestamp = Date.now()
        req.body.isChecked = false

        if (req.body.videoLink == undefined ||
            req.body.progress == undefined ||
            req.body.mobile == undefined) {
            res.status(500).send()
            return
        }

        try {
            await submitRecord(req.body)
            res.send()
            logger.notice(`New record submitted! Please check it out.`)
        } catch (err: any) {
            res.status(500).send(err)
        }
    })

export default router