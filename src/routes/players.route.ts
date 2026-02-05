import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import { getHeatmap } from '@src/services/heatmap.service'
import { getPlayerRecordRating, getPlayerRecords } from '@src/services/record.service'
import { updateHeatmap } from '@src/services/heatmap.service'
import { getPlayerSubmissions } from '@src/services/record.service'
import { syncRoleDLVN, syncRoleGDVN } from '@src/services/discord.service'
import supabase from '@src/client/supabase'
import { EVENT_SELECT_STR } from '@src/services/event.service'
import { getPlayers, getPlayersBatch, getPlayer, updatePlayer, getPlayerInventoryItems } from '@src/services/player.service'
import getAuthUid from '@src/middleware/get-auth-uid'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/players":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get all players matched filter
     *     parameters:
     *       - name: province
     *         in: query
     *         description: Province name
     *         required: true
     *         schema:
     *           type: string
     *       - name: city
     *         in: query
     *         description: City name
     *         required: false
     *         schema:
     *           type: string
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: rating
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
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
            res.send(await getPlayers(req.query))
        } catch {
            res.status(500).send()
        }
    })
    /**
     * @openapi
     * "/players":
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
        const user = res.locals.user

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

        if (user.uid != data.uid && !user.isAdmin) {
            res.status(403).send()
            return
        }

        try {
            await updatePlayer(data)

            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

    .post(getAuthUid, async (req, res) => {
        const { userId } = res.locals

        const { error } = await supabase
            .from("players")
            .insert({
                uid: userId,
                name: String(new Date().getTime())
            })

        if (error) {
            console.error(error)
            res.status(500).send()
            return;
        }

        res.send();
    })

/**
 * @openapi
 * "/players/batch":
 *   post:
 *     tags:
 *       - Player
 *     summary: Get multiple players by UIDs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batch:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of player UIDs
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
router.route('/batch')
    .post(async (req, res) => {
        const { batch } = req.body

        if (batch) {
            try {
                res.send(await getPlayersBatch(batch))
            } catch {
                res.status(500).send()
            }

            return;
        }

        res.send()
    })

router.route('/:uid')
    /**
     * @openapi
     * "/players/{uid}":
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
            const player = await getPlayer(
                uid.startsWith('@') ? undefined : uid,
                uid.startsWith('@') ? uid.slice(1) : undefined
            )

            res.send(player)
        } catch (err) {
            res.status(404).send()
        }
    })

router.route('/:uid/records')
    /**
     * @openapi
     * "/players/{uid}/records":
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
     * "/players/{uid}/heatmap/{year}":
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
     * "/players/heatmap/{count}":
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
        try {
            await updateHeatmap(res.locals.user.uid!, parseInt(req.params.count))
        } catch (err) {
            console.error(err)
        }

        res.send()
    })

router.route('/:uid/submissions')
    /**
     * @openapi
     * "/players/{uid}/submissions":
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
     * "/players/syncRole":
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
     * "/players/{uid}/medals":
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
        try {
            res.send(await getPlayerInventoryItems(id))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/players/{uid}/events":
 *   get:
 *     tags:
 *       - Player
 *     summary: Get player's event proofs
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
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * "/players/{uid}/cards":
 *   get:
 *     tags:
 *       - Player
 *     summary: Get player's supporter cards
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
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
router.route('/:uid/cards')
    .get(async (req, res) => {
        const { uid } = req.params
        const { data, error } = await supabase
            .from('cards')
            .select('id, created_at, supporterIncluded, owner, activationDate, name, img')
            .eq('owner', uid)
            .order('activationDate')

        if (error) {
            console.error(error);
            res.status(500).send()
            return;
        }

        res.send(data)
    })

export default router