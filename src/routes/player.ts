import express from 'express'
import Player from '@lib/classes/Player'
import userAuth from '@src/middleware/userAuth'
import { getHeatmap } from '@src/lib/client/heatmap'
import { getPlayerRecordRating, getPlayerRecords } from '@src/lib/client/record'
import { updateHeatmap } from '@src/lib/client/heatmap'
import { getPlayerSubmissions } from '@src/lib/client/record'
import { syncRoleDLVN, syncRoleGDVN } from '@src/lib/client/discord'
import supabase from '@src/database/supabase'
import { EVENT_SELECT_STR } from '@src/lib/client/event'

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
            if (user.isAdmin) {
                res.status(400).send({
                    message: "Missing 'uid' property"
                })

                return
            } else {
                data.uid = user.uid
            }
        }
        /**
         * @openapi
         * "/player":
         *   post:
         *     tags:
         *       - Player
         *     summary: Add a Player
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *     responses:
         *       200:
         *         description: Success
         */
        if (user.uid != data.uid && !user.isAdmin) {
            res.status(403).send()
            return
        }

        try {
            const player = new Player(data)
            await player.update()

            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

    .post(userAuth, async (req, res) => {
        const user = res.locals.user

        const { error } = await supabase
            .from("players")
            .insert({
                uid: user.uid!,
                name: String(new Date().getTime())
            })

        if (error) {
            console.error(error)
            res.status(500).send()
            return;
        }

        res.send();
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
            const player = new Player({})

            if (uid.startsWith('@')) {
                player.name = uid.slice(1)
            } else {
                player.uid = uid
            }

            await player.pull()

            res.send(player)
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
        const { ratingOnly } = req.query
        try {
            if (ratingOnly) {
                res.send(await getPlayerRecordRating(req.params.uid))
            } else {
                res.send(await getPlayerRecords(req.params.uid, req.query))
            }
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
            updateHeatmap(res.locals.user.uid!, parseInt(req.params.count))
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


router.route('/syncRole')
    /**
     * @openapi
     * "/player/syncRole":
     *   patch:
     *     tags:
     *       - Player
     *     summary: Synchronize the player's role to Discord
     *     responses:
     *       200:
     *         description: Role synchronized successfully
     *       500:
     *         description: Internal server error
     */
    .patch(userAuth, async (req, res) => {
        const { user } = res.locals

        try {
            await syncRoleDLVN(user);
            await syncRoleGDVN(user);

            res.send();
        } catch (err) {
            console.error(err)
            res.status(500).send();
        }
    })

router.route('/:id/medals')
    /**
     * @openapi
     * "/{uid}/medals":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get player's medals
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
        const { id } = req.params
        const player = new Player({ uid: id })
        try {
            res.send(await player.getInventoryItems('medal'))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/:uid/events')
    .get(async (req, res) => {
        const { uid } = req.params
        const { data, error } = await supabase
            .from('eventProofs')
            .select(`*, events(${EVENT_SELECT_STR})`)
            .eq('userid', uid)
            .order('events(start)', { ascending: false })

        if (error) {
            console.error(error);
            res.status(500).send()
            return;
        }

        res.send(data)
    })

export default router