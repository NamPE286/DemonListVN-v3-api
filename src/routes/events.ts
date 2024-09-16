import express from 'express'
import { getEvents, getOngoingEvents, getEventProofs } from '@src/lib/client/event'

const router = express.Router()

router.route('/all')
    .get(async (req, res) => {
        try {
            res.send(await getEvents())
        } catch {
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/events/ongoing":
 *   get:
 *     tags:
 *       - Event
 *     summary: Get ongoing events
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 */
router.route('/ongoing')
    .get(async (req, res) => {
        try {
            res.send(await getOngoingEvents())
        } catch {
            res.status(500).send()
        }
    })

router.route('/proofs')
    .get(async (req, res) => {
        try {
            res.send(await getEventProofs(null, req.query))
        } catch {
            res.status(500).send()
        }
    })

export default router