import express from 'express'
import { getDeathCount, updateDeathCount } from '@src/services/deathCount.service'
import userAuth from '@src/middleware/userAuth.middleware'

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
     *       - name: id
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
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .post(userAuth, async (req, res) => {
        res.send()
        const { count } = req.params
        const arr: any[] = count.split('|')

        for(let i = 0; i < arr.length; i++) {
            arr[i] = parseInt(arr[i]);
        }

        try {
            const { levelID } = req.params
            const uid = res.locals.user.uid!

            await updateDeathCount(uid, parseInt(levelID), arr);
        } catch { }
    })

export default router