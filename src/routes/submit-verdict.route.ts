import supabase from '@src/client/supabase'
import { sendNotification } from '@src/services/notification.service'
import { getLevel } from '@src/services/level.service'
import { getRecord } from '@src/services/record.service'
import userAuth from '@src/middleware/user-auth.middleware'
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
        const record = await getRecord(req.body.userid, req.body.levelid)

        if (record.reviewer != res.locals.user.uid || (!user.isAdmin && !user.isTrusted)) {
            res.status(401).send()
            return
        }

        var { error } = await supabase
            .from('records')
            .update(req.body)
            .match({ userid: req.body.userid, levelid: req.body.levelid })

        if (error) {
            console.error(error)
            res.status(500).send()
            return
        }

        var { error } = await supabase
            .from('players')
            .update({ reviewCooldown: new Date() } as any)
            .match({ uid: res.locals.user.uid })

        if (error) {
            console.error(error)
            res.status(500).send()
            return
        }

        res.send()

        logger.log(`${user.name} (${user.uid}) ${req.body.needMod ? 'forwarded' : ''}${req.body.isChecked ? 'accepted' : ''} ${req.body.levelid} record of ${req.body.userid}\nReviewer's comment: ${req.body.reviewerComment}`)
        if (req.body.isChecked) {
            const level = await getLevel(parseInt(req.body.levelid));

            await sendNotification({ to: req.body.userid, content: `Your ${level.name} (${level.id}) record has been accepted by ${user.name}.`, status: 0 })
        } else if (req.body.needMod) {
            const level = await getLevel(parseInt(req.body.levelid));

            await sendNotification({ to: req.body.userid, content: `Your ${level.name} (${level.id}) record has been forwarded to moderator team for further inspection by ${user.name}.`, status: 0 })
        }
    })

export default router