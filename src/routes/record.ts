import express from 'express'
import adminAuth from '@src/middleware/adminAuth'
import userAuth from '@src/middleware/userAuth'
import recordController from '@src/controllers/recordController'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/record":
     *   put:
     *     tags:
     *       - Record
     *     summary: Add or update a record
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .put(adminAuth, recordController.updateRecord.bind(recordController))

router.route('/:userID/:levelID')
    /**
     * @openapi
     * "/record/{userID}/{levelID}":
     *   delete:
     *     tags:
     *       - Record
     *     summary: Delete a single record
     *     parameters:
     *       - name: userID
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
     *       - name: levelID
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .delete(userAuth, recordController.deleteRecord.bind(recordController))

router.route('/:userID/:levelID')
    /**
     * @openapi
     * "/record/{userID}/{levelID}":
     *   GET:
     *     tags:
     *       - Record
     *     summary: Get a single record
     *     parameters:
     *       - name: userID
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
     *       - name: levelID
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .get(recordController.getRecord.bind(recordController))

router.route('/:userID/:levelID/changeSuggestedRating/:rating')
    /**
     * @openapi
     * "/record/{userID}/{levelID}/changeSuggestedRating/{rating}":
     *   PUT:
     *     tags:
     *       - Record
     *     summary: Change suggested rating of a record
     *     parameters:
     *       - name: userID
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
     *       - name: levelID
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .put(userAuth, recordController.changeSuggestedRating.bind(recordController))

router.route('/retrieve')
    /**
     * @openapi
     * "/retrieve":
     *   GET:
     *     tags:
     *       - Record
     *     summary: Retrieve a record for trusted player
     *     responses:
     *       200:
     *         description: Success
     */
    .get(userAuth, recordController.retrieveRecord.bind(recordController))

export default router
