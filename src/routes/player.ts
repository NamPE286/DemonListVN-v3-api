import express from 'express'
import Player from '@src/classes/Player'
import adminAuth from '@src/middleware/adminAuth'

const router = express.Router()

router.route('/')
    /**
        * @openapi
        * '/player':
        *  put:
        *     tags:
        *     - Player
        *     summary: Add or update a Player
        *     requestBody:
        *      required: true
        *      content:
        *        application/json:
     */
    .put(adminAuth, async (req, res) => {
        const data = req.body

        if (!('uid' in data)) {
            res.status(400).send({
                message: "Missing 'uid' property"
            })

            return
        }

        const player = new Player(data)
        await player.update()

        res.send()
    })

router.route('/:uid')
    /**
        * @openapi
        * '/player/{uid}':
        *  get:
        *     tags:
        *     - Player
        *     summary: Get a single player by the uid
        *     parameters:
        *      - name: uid
        *        in: path
        *        description: The uid of the player
        *        required: true
        *        schema:
        *           type: string
        *     responses:
        *       200:
        *         description: Success
        *         content:
        *          application/json:
        *           schema:
     */
    .get(async (req, res) => {
        const { uid } = req.params
        const player = new Player({ uid: uid })

        await player.init()

        res.send(player.data)
    })



export default router