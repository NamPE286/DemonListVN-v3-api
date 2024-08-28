import express from 'express'
import Player from '@lib/classes/Player'
import userAuth from '@src/middleware/userAuth'
import { getHeatmap, getPlayerRecords } from '@src/lib/client'
import { updateHeatmap } from '@src/lib/client'
import { getPlayerSubmissions } from '@src/lib/client/getPlayerSubmissions'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/player":
     *   put:
     *     tags:
     *       - Player
     *     summary: Add or update a Player
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *     responses:
     *       200:
     *         description: Success
     */
    .put(userAuth, async (req, res) => {
        const data = req.body
        const user: Player = res.locals.user

        if (!('uid' in data)) {
            if (user.data.isAdmin) {
                res.status(400).send({
                    message: "Missing 'uid' property"
                })

                return
            } else {
                data.uid = user.data.uid
            }
        }

        if (user.data.uid != data.uid && !user.data.isAdmin) {
            res.status(403).send()
        }

        try {
            const player = new Player(data)
            await player.update()

            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/:uid')
    /**
     * @openapi
     * "/player/{uid}":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get a single player by the uid
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The uid of the player
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
    .get(async (req, res) => {
        const { uid } = req.params
        const { cached } = req.query

        try {
            const player = new Player({ uid: uid })
            await player.pull()

            res.send(player.data)
        } catch (err) {
            res.status(404).send()
        }

    })

router.route('/:uid/records')
    /**
     * @openapi
     * "/player/{uid}/records":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get all records of a player
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
     *       - name: start
     *         in: query
     *         description: Range start index
     *         required: false
     *         schema:
     *           type: number
     *           default: 0
     *       - name: end
     *         in: query
     *         description: Range end index
     *         required: false
     *         schema:
     *           type: number
     *           default: 50
     *       - name: isChecked
     *         in: query
     *         description: Record acception status
     *         required: false
     *         schema:
     *           type: boolean
     *           default: true
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getPlayerRecords(req.params.uid, req.query))
        } catch {
            res.status(404).send()
        }
    })

router.route('/:uid/heatmap/:year')
    /**
     * @openapi
     * "/player/{uid}/heatmap":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get player heatmap
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
     *       - name: year
     *         in: path
     *         description: Year to fetch
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .get(async (req, res) => {
        try {
            res.send(await getHeatmap(req.params.uid, parseInt(req.params.year)))
        } catch {
            res.status(500).send()
        }
    })

router.route('/heatmap/:count')
    /**
     * @openapi
     * "/player/heatmap/{count}":
     *   post:
     *     tags:
     *       - Player
     *     summary: Add 1 attempt to the heatmap
     *     parameters:
     *       - name: count
     *         in: path
     *         description: Amount of attempt to add
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .post(userAuth, async (req, res) => {
        res.send()
        try {
            updateHeatmap(res.locals.user.data.uid!, parseInt(req.params.count))
        } catch { }
    })

router.route('/:uid/submissions')
    /**
     * @openapi
     * "/{uid}/submissions":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get player's submissions
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The UID of the player
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get(async (req, res) => {
        const { uid } = req.params
        try {
            res.send(await getPlayerSubmissions(uid))
        } catch {
            res.status(500).send()
        }
    })

export default router