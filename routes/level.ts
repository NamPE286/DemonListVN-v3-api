import express from 'express'
import Level from '@root/classes/Level'

const router = express.Router()

router.route('/:id')
    .get(async (req, res) => {
        const { id } = req.params
        const level = new Level(parseInt(id))

        await level.init()

        res.send(level)
    })

export default router