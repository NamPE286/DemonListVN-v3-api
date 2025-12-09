import { getTopBuyers } from '@src/services/player.service'
import express from 'express'

const router = express.Router()

router.route('/top')
    .get(async (req, res) => {
        const { interval = 2592000000, limit = 1000, offset = 0 } = req.query

        res.send(await getTopBuyers(
            parseInt(String(interval)),
            parseInt(String(limit)),
            parseInt(String(offset))
        ))
    })

export default router