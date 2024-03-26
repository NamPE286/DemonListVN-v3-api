import express from "express";
import { getDemonListLevels, getFeaturedListLevels } from '@lib/client'

const router = express.Router()

router.route('/DL')
    .get((req, res) => {
        getDemonListLevels({start: 0, end: 10})
        res.send()
    })

router.route('/FL')
    .get((req, res) => {

    })

export default router