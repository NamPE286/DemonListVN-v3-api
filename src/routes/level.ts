import express from 'express'
import Level from '@src/classes/Level'
import adminAuth from '@src/middleware/adminAuth'

const router = express.Router()

router.route('/')
    .put(adminAuth, async (req, res) => {
        const data = req.body

        if (!('id' in data)) {
            res.status(400).send({
                message: "Missing 'id' property"
            })

            return
        }

        const level = new Level(data)
        await level.update()

        res.send()
    })

router.route('/:id')
    .get(async (req, res) => {
        const { id } = req.params
        const level = new Level({ id: parseInt(id) })

        await level.init()

        res.send(level.data)
    })

export default router