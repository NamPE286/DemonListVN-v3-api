import express from 'express'
import { getDemonListLeaderboard, getFeaturedListLeaderboard } from '@src/lib/client'

const router = express.Router()

router.route('/dl')
    .get(async (req, res) => {
        try {
            res.send(await getDemonListLeaderboard(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/fl')
    .get(async (req, res) => {
        try {
            res.send(await getFeaturedListLeaderboard(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

export default router