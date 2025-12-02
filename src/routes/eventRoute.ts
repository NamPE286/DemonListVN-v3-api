import express from 'express'
import userAuth from '@src/middleware/userAuth'
import adminAuth from '@src/middleware/adminAuth'
import optionalUserAuth from '@src/middleware/optionalUserAuth'
import eventController from '@src/controllers/eventController'

const router = express.Router()

router.route('/')
    .post(adminAuth, (req, res) => eventController.createEvent(req, res))

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
    .put(adminAuth, (req, res) => eventController.upsertProof(req, res))
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
    .post(userAuth, (req, res) => eventController.createProof(req, res))

router.route('/submitLevel/:levelID')
    .put(userAuth, (req, res) => eventController.submitLevel(req, res))

router.route('/quest/:questId/check')
    .get(userAuth, (req, res) => eventController.checkQuest(req, res))

router.route('/quest/:questId/claim')
    .post(userAuth, (req, res) => eventController.claimQuest(req, res))

router.route('/submission')
    .get(adminAuth, (req, res) => eventController.getSubmission(req, res))
    .patch(adminAuth, (req, res) => eventController.updateSubmission(req, res))
    .delete(adminAuth, (req, res) => eventController.deleteSubmission(req, res))

router.route('/:id')
    .get((req, res) => eventController.getEvent(req, res))
    .patch(adminAuth, (req, res) => eventController.updateEvent(req, res))
    .delete(adminAuth, (req, res) => eventController.deleteEvent(req, res))

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
    .get(optionalUserAuth, (req, res) => eventController.getEventLevels(req, res))
    .put(adminAuth, (req, res) => eventController.upsertEventLevel(req, res))

router.route('/:id/level/:levelID')
    .patch(adminAuth, (req, res) => eventController.updateEventLevel(req, res))
    .delete(adminAuth, (req, res) => eventController.deleteEventLevel(req, res))

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
    .get((req, res) => eventController.getEventSubmissions(req, res))

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
    .post(userAuth, (req, res) => eventController.submitRecord(req, res))

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
    .get((req, res) => eventController.getSubmissionByLevel(req, res))
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
    .patch(userAuth, (req, res) => eventController.updateSubmission(req, res))

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
    .get((req, res) => eventController.getLeaderboard(req, res))

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
    .get((req, res) => eventController.getEventProofs(req, res))

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
    .get((req, res) => eventController.getEventProof(req, res))
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
    .delete(userAuth, (req, res) => eventController.deleteEventProof(req, res))

router.route('/:id/calc')
    .patch(adminAuth, (req, res) => eventController.calculateLeaderboard(req, res))

router.route('/:id/quest')
    .get(optionalUserAuth, (req, res) => eventController.getEventQuests(req, res))

export default router