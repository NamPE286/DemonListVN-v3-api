import express from 'express'
import Player from '@root/classes/Player'
import adminAuth from '@root/middleware/adminAuth'

const router = express.Router()

router.route('/')
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
    .get(async (req, res) => {
        const { uid } = req.params
        const player = new Player({uid: uid})

        await player.init()

        res.send(player.data)
    })



export default router