import express from 'express'
import { getAllPromotions, getOngoingPromotions } from '@src/lib/client/promotions'

const router = express.Router()

router.route('/all')
    .get(async (req, res) => {
        try {
            res.send(await getAllPromotions())
        } catch {
            res.status(500).send()
        }
    })

router.route('/ongoing')
    .get(async (req, res) => {
        try {
            res.send(await getOngoingPromotions())
        } catch {
            res.status(500).send()
        }
    })