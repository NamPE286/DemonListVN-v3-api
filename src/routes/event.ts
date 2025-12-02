import express from 'express'
import userAuth from '@src/middleware/userAuth'
import adminAuth from '@src/middleware/adminAuth'
import optionalUserAuth from '@src/middleware/optionalUserAuth'
import eventController from '@src/controllers/eventController'

const router = express.Router()

router.route('/')
    .post(adminAuth, eventController.createEvent.bind(eventController))

router.route('/proof')
    /**
     * @openapi
     * "/event/proof":
     *   put:
     *     tags:
     *       - Event
     *     summary: Add/Edit user's event proof
     *     requestBody:
     *         required: true
     *         content:
     *             application/json:
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .put(adminAuth, eventController.upsertProof.bind(eventController))
    /**
     * @openapi
     * "/event/proof":
     *   post:
     *     tags:
     *       - Event
     *     summary: Create new event proof
     *     requestBody:
     *         required: true
     *         content:
     *             application/json:
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .post(userAuth, eventController.createProof.bind(eventController))

router.route('/submitLevel/:levelID')
    .put(userAuth, eventController.submitLevel.bind(eventController))

router.route('/quest/:questId/check')
    .get(userAuth, eventController.checkQuest.bind(eventController))

router.route('/quest/:questId/claim')
    .post(userAuth, eventController.claimQuest.bind(eventController))

router.route('/submission')
    .get(adminAuth, eventController.getSubmission.bind(eventController))
    .patch(adminAuth, eventController.updateSubmission.bind(eventController))
    .delete(adminAuth, eventController.deleteSubmission.bind(eventController))

router.route('/:id')
    .get(eventController.getEvent.bind(eventController))
    .patch(adminAuth, eventController.updateEvent.bind(eventController))
    .delete(adminAuth, eventController.deleteEvent.bind(eventController))

router.route('/:id/levels')
    /**
     * @openapi
     * "/event/{id}/levels":
     *   get:
     *     tags:
     *       - Event
     *     summary: Get levels of an event
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
    .get(optionalUserAuth, eventController.getEventLevels.bind(eventController))
    .put(adminAuth, eventController.upsertEventLevel.bind(eventController))

router.route('/:id/level/:levelID')
    .patch(adminAuth, eventController.updateEventLevel.bind(eventController))
    .delete(adminAuth, eventController.deleteEventLevel.bind(eventController))

router.route('/:id/submissions')
    /**
     * @openapi
     * "/event/{id}/submissions":
     *   get:
     *     tags:
     *       - Event
     *     summary: Get submissions of an event
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
    .get(eventController.getEventSubmissions.bind(eventController))

router.route('/:id/submit')
    /**
     * @openapi
     * "/event/{id}/submit":
     *   post:
     *     tags:
     *       - Event
     *     summary: Submit an event
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the event
     *         required: true
     *         schema:
     *           type: number
     *     requestBody:
     *         required: true
     *         content:
     *             application/json:
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .post(userAuth, eventController.submitRecord.bind(eventController))

router.route('/:id/submission/:levelID')
    /**
     * @openapi
     * "/event/{id}/submission/{levelID}":
     *   get:
     *     tags:
     *       - Event
     *     summary: Get submission for a specific level in an event
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the event
     *         required: true
     *         schema:
     *           type: number
     *       - name: levelID
     *         in: path
     *         description: The id of the level
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
    .get(eventController.getSubmissionByLevel.bind(eventController))
    /**
     * @openapi
     * "/event/{id}/submission/{levelID}":
     *   patch:
     *     tags:
     *       - Event
     *     summary: Update submission for a specific level in an event
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the event
     *         required: true
     *         schema:
     *           type: number
     *       - name: levelID
     *         in: path
     *         description: The id of the level
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
    .patch(userAuth, eventController.updateSubmission.bind(eventController))

router.route('/:id/leaderboard')
    /**
     * @openapi
     * "/event/{id}/leaderboard":
     *   get:
     *     tags:
     *       - Event
     *     summary: Get leaderboard of an event
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
    .get(eventController.getLeaderboard.bind(eventController))

router.route('/:id/proofs')
    /**
     * @openapi
     * "/event/{id}/proofs":
     *   get:
     *     tags:
     *       - Event
     *     summary: Get event's proofs
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
    .get(eventController.getEventProofs.bind(eventController))

router.route('/:id/proof/:uid')
    /**
     * @openapi
     * "/event/{id}/proof/{uid}":
     *   get:
     *     tags:
     *       - Event
     *     summary: Get user's event proof
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the event
     *         required: true
     *         schema:
     *           type: number
     *       - name: uid
     *         in: path
     *         description: The id of the event
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(eventController.getEventProof.bind(eventController))
    /**
     * @openapi
     * "/event/{id}/proof/{uid}":
     *   delete:
     *     tags:
     *       - Event
     *     summary: Delete a player's event proof
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .delete(userAuth, eventController.deleteEventProof.bind(eventController))

router.route('/:id/calc')
    .patch(adminAuth, eventController.calculateLeaderboard.bind(eventController))

router.route('/:id/quest')
    .get(optionalUserAuth, eventController.getEventQuests.bind(eventController))

export default router

export default router