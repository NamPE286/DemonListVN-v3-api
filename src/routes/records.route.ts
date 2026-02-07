import express from 'express'
import adminAuth from '@src/middleware/admin-auth.middleware'
import userAuth from '@src/middleware/user-auth.middleware'
import { getRecord, getRecords, retrieveRecord, updateRecord, deleteRecord } from '@src/services/record.service'
import { changeSuggestedRating, getEstimatedQueue } from '@src/services/record.service'
import logger from '@src/utils/logger'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/records":
     *   get:
     *     tags:
     *       - Record
     *     summary: Get all records of all list
     *     parameters:
     *       - name: start
     *         in: query
     *         description: Range start index
     *         required: false
     *         schema:
     *           type: number
     *           default: 0
     *       - name: end
     *         in: query
     *         description: Range end index
     *         required: false
     *         schema:
     *           type: number
     *           default: 50
     *       - name: isChecked
     *         in: query
     *         description: Record acception status
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getRecords(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })
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
    .put(adminAuth, async (req, res) => {
        try {
            await updateRecord(req.body)

            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/:userID/:levelID')
    /**
     * @openapi
     * "/records/{userID}/{levelID}":
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
    .delete(userAuth, async (req, res) => {
        const { user } = res.locals
        const { userID, levelID } = req.params

        if (user.uid != userID && !user.isAdmin) {
            res.status(403).send()
            return
        }

        try {
            await deleteRecord(userID, parseInt(levelID))

            await logger.log(`${user.name} (${user.uid}) performed DELETE /record/${userID}/${levelID}`)

            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

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
    .get(async (req, res) => {
        const { userID, levelID } = req.params

        try {
            res.send(await getRecord(userID, parseInt(levelID)))
        } catch (err) {
            res.status(500).send()
        }
    })

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
    .put(userAuth, async (req, res) => {
        const { user } = res.locals
        const { userID, levelID, rating } = req.params

        if (user.uid != userID) {
            res.status(401).send()
            return;
        }

        try {
            res.send(await changeSuggestedRating(userID, parseInt(levelID), parseInt(rating)))
        } catch (err) {
            res.status(500).send()
        }
    })

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
    .get(userAuth, async (req, res) => {
        const { user } = res.locals

        if (!user.isAdmin && !user.isTrusted) {
            res.status(401).send()
            return
        }

        if (user.reviewCooldown && (new Date()).getTime() - new Date(user.reviewCooldown).getTime() < 7200000) {
            res.status(429).send()
            return
        }

        try {
            res.send(await retrieveRecord(user))
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/:userID/:levelID/getEstimatedQueue/:prioritizedBy')
    /**
     * @openapi
     * "/records/{userID}/{levelID}/getEstimatedQueue/{prioritizedBy}":
     *   GET:
     *     tags:
     *       - Record
     *     summary: Get estimated queue number for a record
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
     *       - name: prioritizedBy
     *         in: path
     *         description: The timestamp in milliseconds to prioritize the record
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 estimatedQueueNo:
     *                   type: number
     */
    .get(async (req, res) => {
        const { userID, levelID, prioritizedBy } = req.params

        try {
            const estimatedQueueNo = await getEstimatedQueue(userID, parseInt(levelID), parseInt(prioritizedBy))
            res.send({ no: estimatedQueueNo })
        } catch (err) {
            res.status(500).send()
        }
    })

export default router