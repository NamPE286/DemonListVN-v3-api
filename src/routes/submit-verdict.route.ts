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
        const acceptedManually = req.body.acceptedManually ?? req.body.isChecked
        const recordUpdate = {
            ...req.body,
            acceptedManually
        }

        delete recordUpdate.isChecked

        if (record.reviewer!.uid != res.locals.user.uid || (!user.isAdmin && !user.isTrusted)) {
            res.status(401).send()
            return
        }

        var { error } = await supabase
            .from('records')
            .update(recordUpdate)
            .match({ userid: req.body.userid, levelid: req.body.levelid })

        if (error) {
            console.error(error)
            res.status(500).send()
            return
        }

        const today = new Date().toISOString().slice(0, 10)
        const prevCount = user.overwatchReviewDate === today ? (user.overwatchReviewCount || 0) : 0
        var { error } = await supabase
            .from('players')
            .update({
                overwatchReviewDate: today,
                overwatchReviewCount: prevCount + 1
            } as any)
            .match({ uid: res.locals.user.uid })

        if (error) {
            console.error(error)
            res.status(500).send()
            return
        }


		await logger.log(`${user.name} (${user.uid}) ${req.body.needMod ? 'forwarded' : ''}${acceptedManually ? 'accepted' : ''} record ${req.body.levelid} của ${req.body.userid}\nNhận xét của reviewer: ${req.body.reviewerComment}`)
        
        if (acceptedManually) {
            const level = await getLevel(parseInt(req.body.levelid));

            await sendNotification({ to: req.body.userid, content: `Record ${level.name} (${level.id}) của bạn đã được chấp nhận bởi ${user.name}.`, status: 0 })
        } else if (req.body.needMod) {
            const level = await getLevel(parseInt(req.body.levelid));

            await sendNotification({ to: req.body.userid, content: `Record ${level.name} (${level.id}) của bạn đã được chuyển tiếp đến đội ngũ moderator để kiểm tra thêm bởi ${user.name}.`, status: 0 })
        }

        res.send()

    })

export default router