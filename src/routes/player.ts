import express from 'express'
import Player from '@src/classes/Player'
import userAuth from '@src/middleware/userAuth'

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
            res.status(400).send({
                message: "Missing 'uid' property"
            })

            return
        }

        if (user.data.uid != data.uid && !user.data.isAdmin) {
            res.status(403).send()
        }

        const player = new Player(data)
        await player.update()

        res.send()
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
        const player = new Player({ uid: uid })

        await player.init()

        res.send(player.data)
    })



export default router