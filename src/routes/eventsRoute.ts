import express from 'express'
import eventsController from '@src/controllers/eventsController'

const router = express.Router()

router.route('/')
    .get((req, res) => eventsController.getEvents(req, res))

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
    .get((req, res) => eventsController.getOngoingEvents(req, res))

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
    .get((req, res) => eventsController.getEventProofs(req, res))

export default router
