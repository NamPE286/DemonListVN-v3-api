import express, { application } from 'express'
import Record from '@lib/classes/Record'
import userAuth from '@src/middleware/userAuth'
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
        req.body.userid = user.data.uid
        req.body.timestamp = Date.now()
        req.body.isChecked = false

        if (req.body.videoLink == undefined ||
            req.body.progress == undefined ||
            req.body.mobile == undefined) {
            res.status(500).send()
            return
        }

        const record = new Record(req.body)

        try {
            await record.submit()
            res.send()
            logger.notice(`New record submitted! Please check it out.`)
        } catch (err: any) {
            console.log(err.message)
            res.status(500).send({ message: err.message })
        }
    })

export default router