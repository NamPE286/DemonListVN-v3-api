import express from "express";
import { getDemonListLevels, getFeaturedListLevels } from '@lib/client'

const router = express.Router()

router.route('/DL')
    .get(async (req, res) => {
        res.send(await getDemonListLevels(req.query))
    })

router.route('/FL')
    .get(async (req, res) => {
        res.send(await getFeaturedListLevels(req.query))
    })

export default router