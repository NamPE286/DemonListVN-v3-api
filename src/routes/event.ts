import express from 'express'
import { getEvent, getEventProof, getEventProofs, insertEventProof, upsertEventProof } from '@src/lib/client/event'
import userAuth from '@src/middleware/userAuth'
import adminAuth from '@src/middleware/adminAuth'

const router = express.Router()

router.route('/:id')
    /**
     * @openapi
     * "/events/{id}":
     *   get:
     *     tags:
     *       - Event
     *     summary: Get event by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the event
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        const { id } = req.params

        try {
            res.send(await getEvent(parseInt(id)))
        } catch {
            res.status(500).send()
        }
    })

router.route('/:id/proofs')
    .get(async (req, res) => {
        const { id } = req.params

        try {
            res.send(await getEventProofs(parseInt(id), req.query))
        } catch {
            res.status(500).send();
        }
    })

router.route('/:id/proof/:uid')
    .get(async (req, res) => {
        const { id, uid } = req.params

        try {
            res.send(await getEventProof(parseInt(id), uid))
        } catch {
            res.status(500).send();
        }
    })

router.route('/proof')
    .put(adminAuth, async (req, res) => {
        try {
            res.send(await upsertEventProof(req.body))
        } catch {
            res.status(500).send();
        }
    })
    .post(userAuth, async (req, res) => {
        req.body.userid = res.locals.user.data.uid
        
        try {
            res.send(await insertEventProof(req.body))
        } catch {
            res.status(500).send();
        }
    })

export default router