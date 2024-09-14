import express from 'express'
import { getEvent } from '@src/lib/client/event'

const router = express.Router()

router.route('/:id')
    .get(async (req, res) => {
        const { id } = req.params

        try {
            res.send(await getEvent(parseInt(id)))
        } catch {
            res.status(500).send()
        }
    })

export default router