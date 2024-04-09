import express from 'express'
import { getPlayers } from '@src/lib/client'

const router = express.Router()

router.route('/')
    .get(async (req, res) => {
        try {
            res.send(await getPlayers(req.query))
        } catch {
            res.status(500).send()
        }
    })

export default router