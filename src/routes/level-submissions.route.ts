import express from 'express'
import adminAuth from '@src/middleware/admin-auth.middleware'
import userAuth from '@src/middleware/user-auth.middleware'
import supabase from '@src/client/supabase'
import { fetchLevelFromGD, updateLevel, getLevel } from '@src/services/level.service'
import { sendNotification } from '@src/services/notification.service'

const router = express.Router()

/**
 * @openapi
 * /level-submissions:
 *   get:
 *     tags:
 *       - Level Submissions
 *     summary: Get all level submissions (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: start
 *         in: query
 *         schema:
 *           type: number
 *           default: 0
 *       - name: end
 *         in: query
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
    .get(adminAuth, async (req, res) => {
        const { start = 0, end = 50 } = req.query

        const { data, error } = await supabase
            .from('levelSubmissions')
            .select('*, levels(*), players!userId(*)')
            .order('created_at', { ascending: true })
            .range(Number(start), Number(end))

        if (error) {
            console.error(error)
            res.status(500).send({ message: error.message })
            return
        }

        res.send(data)
    })
    /**
     * @openapi
     * /level-submissions:
     *   post:
     *     tags:
     *       - Level Submissions
     *     summary: Submit a new challenge level for review
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               levelId:
     *                 type: number
     *               comment:
     *                 type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .post(userAuth, async (req, res) => {
        const { user } = res.locals
        const { levelId, comment } = req.body

        if (!levelId) {
            res.status(400).send({ message: 'Missing levelId' })
            return
        }

        try {
            // Check if level already exists in database
            const { data: existingLevel } = await supabase
                .from('levels')
                .select('id, isChallenge, isNonList')
                .eq('id', levelId)
                .maybeSingle()

            if (existingLevel && !existingLevel.isNonList) {
                res.status(400).send({
                    en: 'Level already exists in the list',
                    vi: 'Level đã tồn tại trong danh sách'
                })
                return
            }

            // Check if user already submitted this level
            const { data: existingSubmission } = await supabase
                .from('levelSubmissions')
                .select('*')
                .eq('userId', user.uid)
                .eq('levelId', levelId)
                .maybeSingle()

            if (existingSubmission) {
                res.status(400).send({
                    en: 'You have already submitted this level',
                    vi: 'Bạn đã nộp level này rồi'
                })
                return
            }

            // Fetch level from GD if not exists
            const apiLevel = await fetchLevelFromGD(levelId)

            // Create or update the level with isNonList = true
            if (!existingLevel) {
                await updateLevel({
                    id: levelId,
                    name: apiLevel.name,
                    creator: apiLevel.author,
                    isPlatformer: apiLevel.length == 5,
                    isChallenge: true,
                    isNonList: true,
                    creatorId: user.uid
                })
            }

            // Insert level submission
            const { error: insertError } = await supabase
                .from('levelSubmissions')
                .insert({
                    userId: user.uid,
                    levelId: levelId,
                    comment: comment || null,
                    accepted: false
                })

            if (insertError) {
                console.error(insertError)
                res.status(500).send({ message: insertError.message })
                return
            }

            res.send({ message: 'Level submission created successfully' })
        } catch (err: any) {
            console.error(err)
            res.status(500).send(err)
        }
    })

/**
 * @openapi
 * /level-submissions/user/{userId}:
 *   get:
 *     tags:
 *       - Level Submissions
 *     summary: Get level submissions by user
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/user/:userId')
    .get(async (req, res) => {
        const { userId } = req.params

        try {
            const { data, error } = await supabase
                .from('levelSubmissions')
                .select('*, levels(*)')
                .eq('userId', userId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error(error)
                res.status(500).send({ message: error.message })
                return
            }

            res.send(data)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message || 'An error occurred' })
        }
    })

/**
 * @openapi
 * /level-submissions/{userId}/{levelId}:
 *   delete:
 *     tags:
 *       - Level Submissions
 *     summary: Delete a level submission (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: levelId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/:userId/:levelId')
    .delete(adminAuth, async (req, res) => {
        const { userId, levelId } = req.params

        const { error } = await supabase
            .from('levelSubmissions')
            .delete()
            .eq('userId', userId)
            .eq('levelId', Number(levelId))

        if (error) {
            console.error(error)
            res.status(500).send({ message: error.message })
            return
        }

        res.send({ message: 'Level submission deleted' })
    })

/**
 * @openapi
 * /level-submissions/{userId}/{levelId}/verdict:
 *   post:
 *     tags:
 *       - Level Submissions
 *     summary: Accept or reject a level submission (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: levelId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accept:
 *                 type: boolean
 *               rating:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/:userId/:levelId/verdict')
    .post(adminAuth, async (req, res) => {
        const { userId, levelId } = req.params
        const { accept, rating, reason } = req.body

        try {
            // Get level info for notification
            const level = await getLevel(Number(levelId))

            if (accept) {
                // Update level: set isNonList to false and update rating if provided
                const updateData: any = {
                    id: Number(levelId),
                    isNonList: false
                }

                if (rating !== undefined && rating !== null) {
                    updateData.rating = rating
                }

                await updateLevel(updateData)

                // Update submission as accepted
                const { error: updateError } = await supabase
                    .from('levelSubmissions')
                    .update({ accepted: true })
                    .eq('userId', userId)
                    .eq('levelId', Number(levelId))

                if (updateError) {
                    throw updateError
                }

                // Send notification to user
                await sendNotification({
                    to: userId,
                    status: 1,
                    content: `Your level submission "${level.name}" (${levelId}) has been accepted and added to the Challenge List!`
                })

                res.send({ message: 'Level submission accepted' })
            } else {
                // Delete the submission
                const { error: deleteError } = await supabase
                    .from('levelSubmissions')
                    .delete()
                    .eq('userId', userId)
                    .eq('levelId', Number(levelId))

                if (deleteError) {
                    throw deleteError
                }

                // Send notification to user
                await sendNotification({
                    to: userId,
                    status: 2,
                    content: `Your level submission "${level.name}" (${levelId}) has been rejected. ${reason ? `Reason: ${reason}` : ''}`
                })

                res.send({ message: 'Level submission rejected' })
            }
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message || 'An error occurred' })
        }
    })

export default router
