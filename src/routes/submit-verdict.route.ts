import supabase from '@src/client/supabase'
import { sendNotification } from '@src/services/notification.service'
import { getLevel } from '@src/services/level.service'
import {
    getRecord,
    getRecordById,
    getManuallyAcceptedRecord,
    getPendingRecord,
    isOfficialListLevel
} from '@src/services/record.service'
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

        // Clients may send the record's unique `id` to disambiguate when a
        // user has both an accepted and a pending replacement row. Fall back
        // to the legacy (userid, levelid) lookup — which now returns the
        // pending record if one exists, otherwise the accepted one — for
        // backwards compatibility.
        const record: any = req.body.id
            ? await getRecordById(Number(req.body.id))
            : (await getPendingRecord(req.body.userid, Number(req.body.levelid)))
                ?? (await getRecord(req.body.userid, Number(req.body.levelid)))

        if (!record) {
            res.status(404).send()
            return
        }

        const acceptedManually = req.body.acceptedManually ?? req.body.isChecked
        const recordUpdate: any = {
            ...req.body,
            userid: record.userid ?? record.players?.uid ?? req.body.userid,
            levelid: record.levelid ?? req.body.levelid,
            id: record.id,
            acceptedManually
        }

        delete recordUpdate.isChecked

        const reviewerUid = record.reviewer?.uid ?? record.reviewer
        if (reviewerUid != user.uid || (!user.isAdmin && !user.isTrusted)) {
            res.status(401).send()
            return
        }

        // If we are accepting a pending replacement, remove the previous
        // manually accepted record for the same (userid, levelid) pair FIRST.
        // Auto-accepted records are kept as a separate version.
        if (acceptedManually) {
            const previousAccepted: any = await getManuallyAcceptedRecord(recordUpdate.userid, recordUpdate.levelid)

            if (previousAccepted && previousAccepted.id !== record.id) {
                const { error: deleteErr } = await supabase
                    .from('records')
                    .delete()
                    .eq('id', previousAccepted.id)

                if (deleteErr) {
                    console.error(deleteErr)
                    res.status(500).send()
                    return
                }
            }
        }

        var { error } = await supabase
            .from('records')
            .update(recordUpdate)
            .eq('id', record.id)

        if (error) {
            console.error(error)
            res.status(500).send()
            return
        }

        const today = new Date().toISOString().slice(0, 10)
        const isSameOverwatchDay = user.overwatchReviewDate === today
        const isOfficialRecord = await isOfficialListLevel(Number(recordUpdate.levelid))
        const prevCount = isSameOverwatchDay ? (user.overwatchReviewCount || 0) : 0
        const prevOfficialCount = isSameOverwatchDay ? (user.overwatchOfficialReviewCount || 0) : 0
        const prevNonOfficialCount = isSameOverwatchDay ? (user.overwatchNonOfficialReviewCount || 0) : 0
        const overwatchCounterUpdate: any = {
            overwatchReviewDate: today,
            overwatchReviewCount: prevCount + 1
        }

        if (isOfficialRecord) {
            overwatchCounterUpdate.overwatchOfficialReviewCount = prevOfficialCount + 1
        } else {
            overwatchCounterUpdate.overwatchNonOfficialReviewCount = prevNonOfficialCount + 1
        }

        var { error } = await supabase
            .from('players')
            .update(overwatchCounterUpdate)
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