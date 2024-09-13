import express from 'express'
import { getAllEvents, getOngoingEvents } from '@src/lib/client/events'

const router = express.Router()

router.route('/all')
    .get(async (req, res) => {
        try {
            res.send(await getAllEvents())
        } catch {
            res.status(500).send()
        }
    })

router.route('/ongoing')
    .get(async (req, res) => {
        try {
            res.send(await getOngoingEvents())
        } catch {
            res.status(500).send()
        }
    })

export default router