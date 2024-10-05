import supabase from '@src/database/supabase'
import Level from '@src/lib/classes/Level'
import Record from '@src/lib/classes/Record'
import { sendNotification } from '@src/lib/client/notification'
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

        if (record.reviewer != res.locals.user.uid || (!user.isAdmin && !user.isTrusted)) {
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
            .update({ reviewCooldown: new Date() } as any)
            .match({ uid: res.locals.user.uid })

        if (error) {
            console.log(error)
            res.status(500).send()
            return
        }

        res.send()

        logger.log(`${user.name} (${user.uid}) ${req.body.needMod ? 'forwarded' : ''}${req.body.isChecked ? 'accepted' : ''} ${req.body.levelid} record of ${req.body.userid}\nReviewer's comment: ${req.body.reviewerComment}`)
        if (req.body.isChecked) {
            const level = new Level({ id: parseInt(req.body.levelid) });
            await level.pull()

            await sendNotification({ to: req.body.userid, content: `Your ${level.name} (${level.id}) record has been accepted by ${user.name}.`, status: 0 })
        } else if (req.body.needMod) {
            const level = new Level({ id: parseInt(req.body.levelid) });
            await level.pull()

            await sendNotification({ to: req.body.userid, content: `Your ${level.name} (${level.id}) record has been forwarded to moderator team for further inspection by ${user.name}.`, status: 0 })
        }
    })

export default router