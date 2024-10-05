import express from 'express'
import Record from '@lib/classes/Record'
import adminAuth from '@src/middleware/adminAuth'
import userAuth from '@src/middleware/userAuth'
import { getRecord, retrieveRecord } from '@src/lib/client/record'
import { changeSuggestedRating } from '@src/lib/client/record'
import logger from '@src/utils/logger'

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
    .put(adminAuth, async (req, res) => {
        try {
            const record = new Record(req.body)
            await record.update()

            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

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
    .delete(userAuth, async (req, res) => {
        const { user } = res.locals
        const { userID, levelID } = req.params

        if (user.uid != userID && !user.isAdmin) {
            res.status(403).send()
            return
        }

        try {
            const record = new Record({ userid: userID, levelid: parseInt(levelID) })
            await record.delete()

            res.send()
            logger.log(`${user.name} (${user.uid}) performed DELETE /record/${userID}/${levelID}`)
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

export default router