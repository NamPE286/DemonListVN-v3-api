import express from 'express'
import { getDeathCount, getDeathCountProgress, updateDeathCount } from '@src/services/death-count.service'
import { getActiveseason, trackProgressAfterDeathCount } from '@src/services/battlepass.service'
import { upsertDeathCountAutoRecord } from '@src/services/record.service'
import userAuth from '@src/middleware/user-auth.middleware'

const router = express.Router()

function parseBoolean(value: unknown, fallback = false) {
    if (typeof value == 'boolean') {
        return value
    }

    if (typeof value == 'string') {
        return ['true', '1', 'yes'].includes(value.toLowerCase())
    }

    return fallback
}

function parseNumber(value: unknown, fallback: number) {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : fallback
}

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
            const tag = String(req.query.tag ?? 'default')

            res.send(await getDeathCount(uid, parseInt(levelID), tag));
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
        const tag = String(req.query.tag ?? 'default')
        const mobile = parseBoolean(req.query.mobile ?? req.body?.mobile)
        const refreshRate = parseNumber(req.query.refreshRate ?? req.body?.refreshRate, 60)

        try {
            const { levelID } = req.params
            const uid = res.locals.user.uid!
            const levelIDNum = parseInt(levelID)

            try {
                const player = await updateDeathCount(uid, levelIDNum, tag, arr, setCompleted);

                if (tag == 'default') {
                    await upsertDeathCountAutoRecord({
                        userid: uid,
                        levelid: levelIDNum,
                        progress: player.completedTime ? 100 : getDeathCountProgress(player.count),
                        mobile,
                        refreshRate
                    })
                }
            } catch (err) {
                console.error('Check A', err)
            }

            try {
                const season = await getActiveseason()
                const player = await updateDeathCount(uid, levelIDNum, `battlepass:${season.id}`, arr, setCompleted);

                await trackProgressAfterDeathCount(uid, levelIDNum, player);
            } catch (err) {
                console.error('Check B', err)
            }
        } catch (err) {
            console.error(err)
        }

        res.send()
    })

export default router