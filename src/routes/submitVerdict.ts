import supabase from '@src/database/supabase'
import Record from '@src/lib/classes/Record'
import userAuth from '@src/middleware/userAuth'
import logger from '@src/utils/logger'
import express from 'express'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/submitVerdict":
      *   PUT:
      *     tags:
      *       - Verdict
      *     summary: Submit a verdict from trusted player
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
        const record = new Record({ userid: req.body.userid, levelid: req.body.levelid })
        await record.pull()

        if (record.data.reviewer != res.locals.user.data.uid || (!user.data.isAdmin && !user.data.isTrusted)) {
            res.status(401).send()
            return
        }

        var { error } = await supabase
            .from('records')
            .update(req.body)
            .match({ userid: req.body.userid, levelid: req.body.levelid })

        if (error) {
            console.log(error)
            res.status(500).send()
            return
        }

        var { error } = await supabase
            .from('players')
            .update({ reviewCooldown: new Date() })
            .match({ uid: res.locals.user.data.uid })

        if (error) {
            console.log(error)
            res.status(500).send()
            return
        }

        res.send()

        logger.log(`${user.data.name} (${user.data.uid}) ${req.body.needMod ? 'forwarded' : ''}${req.body.isChecked ? 'accepted' : ''} ${req.body.levelid} record of ${req.body.userid}\nReviewer's comment: ${req.body.reviewerComment}`)
    })

export default router