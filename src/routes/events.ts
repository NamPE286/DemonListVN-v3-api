import express from 'express'
import { getEvents, getOngoingEvents, getEventProofs } from '@src/lib/client/event'

const router = express.Router()

router.route('/')
    .get(async (req, res) => {
        const { from, to } = req.query

        try {
            if (!to) {
                res.send(await getEvents(0, 49))
            } else {
                res.send(await getEvents(Number(from), Number(to)))

            }
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

/**
 * @openapi
 * "/events/proofs":
 *   delete:
 *     tags:
 *       - Event
 *     summary: Get event proofs
 *     parameters:
 *       - name: start
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: number
 *       - name: end
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: number
 *       - name: accepted
 *         in: query
 *         description: Whether the proof is accepted
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/proofs')
    .get(async (req, res) => {
        try {
            res.send(await getEventProofs(null, req.query))
        } catch {
            res.status(500).send()
        }
    })

export default router