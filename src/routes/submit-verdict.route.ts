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

        if (record.reviewer!.uid != res.locals.user.uid || (!user.isAdmin && !user.isTrusted)) {
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


        await logger.log(`${user.name} (${user.uid}) ${req.body.needMod ? 'đã chuyển tiếp' : ''}${req.body.isChecked ? 'đã chấp nhận' : ''} record ${req.body.levelid} của ${req.body.userid}\nNhận xét của reviewer: ${req.body.reviewerComment}`)
        
        if (req.body.isChecked) {
            const level = await getLevel(parseInt(req.body.levelid));

            await sendNotification({ to: req.body.userid, content: `Record ${level.name} (${level.id}) của bạn đã được chấp nhận bởi ${user.name}.`, status: 0 })
        } else if (req.body.needMod) {
            const level = await getLevel(parseInt(req.body.levelid));

            await sendNotification({ to: req.body.userid, content: `Record ${level.name} (${level.id}) của bạn đã được chuyển tiếp đến đội ngũ moderator để kiểm tra thêm bởi ${user.name}.`, status: 0 })
        }

        res.send()

    })

export default router