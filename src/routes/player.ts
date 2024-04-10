import express from 'express'
import Player from '@lib/classes/Player'
import userAuth from '@src/middleware/userAuth'
import { getPlayerRecords } from '@src/lib/client'

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
     *       - name: cached
     *         in: query
     *         description: Whether to cache the player data
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
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

            if(cached == 'true') {
                res.set('Cache-Control', 'public, s-maxage=1800, max-age=1800 stale-while-revalidate=7200')
            }

            res.send(player.data)
        } catch {
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

export default router