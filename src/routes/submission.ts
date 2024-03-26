import express, { application } from 'express'
import Record from '@lib/classes/Record'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/submission":
      *   put:
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
    .put(userAuth, async (req, res) => {
        const { user } = res.locals
        req.body.userid = user.data.uid
        req.body.timestamp = Date.now()
        req.body.isChecked = false

        if (req.body.videoLink == undefined ||
            req.body.progress == undefined ||
            req.body.mobile == undefined) {
            res.status(400).send()
            return
        }

        const record = new Record(req.body)
        await record.update()

        res.send()
    })

export default router