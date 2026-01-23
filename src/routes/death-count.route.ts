import express from 'express'
import { getDeathCount, updateDeathCount } from '@src/services/death-count.service'
import { trackProgressAfterDeathCount } from '@src/services/battlepass.service'
import userAuth from '@src/middleware/user-auth.middleware'

const router = express.Router()

router.route('/:uid/:levelID')
    /**
     * @openapi
     * "/deathCount/{uid}/{levelID}":
     *   get:
     *     tags:
     *       - Death count
     *     summary: Get player's level death count
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
     *       - name: levelID
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            const { uid, levelID } = req.params
            res.send(await getDeathCount(uid, parseInt(levelID)));
        } catch {
            res.status(500).send();
        }
    })

router.route('/:levelID/:count')
    /**
     * @openapi
     * "/deathCount/{levelID}/{count}":
     *   post:
     *     tags:
     *       - Death count
     *     summary: Add player's level death count
     *     parameters:
     *       - name: levelID
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *       - name: count
     *         in: path
     *         description: Serialized array string
     *         required: true
     *         schema:
     *           type: string
     *       - name: completed
     *         in: query
     *         description: If present, set completedTime to current time (only if not already set)
     *         required: false
     *         schema:
     *           type: boolean
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .post(userAuth, async (req, res) => {

        const { count } = req.params
        const arr: any[] = count.split('|')

        for (let i = 0; i < arr.length; i++) {
            arr[i] = parseInt(arr[i]);
        }

        const setCompleted = req.query.completed !== undefined

        try {
            const { levelID } = req.params
            const uid = res.locals.user.uid!
            const levelIDNum = parseInt(levelID)

            const player = await updateDeathCount(uid, levelIDNum, arr, setCompleted);

            await trackProgressAfterDeathCount(uid, levelIDNum, arr, setCompleted, player);
        } catch { }

        res.send()
    })

export default router