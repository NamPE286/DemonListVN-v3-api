import express from 'express'
import adminAuth from '@src/middleware/admin-auth.middleware'
import userAuth from '@src/middleware/user-auth.middleware'
import {
    getRecord,
    getRecords,
    retrieveRecord,
    updateRecord,
    deleteRecord,
    type OverwatchRecordScope
} from '@src/services/record.service'
import { changeSuggestedRating, getEstimatedQueue } from '@src/services/record.service'
import { getRecordById, getAcceptedRecord, getPendingRecord } from '@src/services/record.service'
import logger from '@src/utils/logger'

const router = express.Router()
const OVERWATCH_DAILY_LIMITS = {
    official: 3,
    nonOfficial: 5
} as const

function getOverwatchDailyCount(user: any, scope: OverwatchRecordScope) {
    const today = new Date().toISOString().slice(0, 10)

    if (user.overwatchReviewDate !== today) {
        return 0
    }

    return scope === 'official'
        ? user.overwatchOfficialReviewCount || 0
        : user.overwatchNonOfficialReviewCount || 0
}

function getOverwatchLimitSummary(user: any) {
    return {
        official: getOverwatchLimit(user, 'official'),
        nonOfficial: getOverwatchLimit(user, 'nonOfficial')
    }
}

function getOverwatchLimit(user: any, scope: OverwatchRecordScope) {
    const usedToday = getOverwatchDailyCount(user, scope)
    const limit = OVERWATCH_DAILY_LIMITS[scope]

    return {
        limit,
        usedToday,
        limitLeft: Math.max(0, limit - usedToday)
    }
}

function parseOverwatchRecordScope(value: unknown): OverwatchRecordScope | null {
    if (value === undefined || value === '' || value === 'official') {
        return 'official'
    }

    if (value === 'nonOfficial' || value === 'non-official' || value === 'non_official') {
        return 'nonOfficial'
    }

    return null
}

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

        // Allow callers to target a specific row via ?id= when a user has
        // both an accepted record and a pending replacement. Without an id,
        // the service deletes the pending row first (reject semantics) and
        // only falls back to the accepted one when no pending exists.
        const rawId = req.query.id
        const recordId = rawId !== undefined ? Number(rawId) : undefined

        try {
            await deleteRecord(userID, parseInt(levelID), Number.isFinite(recordId) ? recordId : undefined)

            await logger.log(`${user.name} (${user.uid}) performed DELETE /record/${userID}/${levelID}${recordId ? `?id=${recordId}` : ''}`)

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
        const levelIdNum = parseInt(levelID)

        try {
            // When an `id` query parameter is provided, return that specific
            // row (verifying it belongs to the given user/level). This lets
            // reviewers fetch a pending replacement row unambiguously even
            // when an accepted record also exists for the same pair.
            const rawId = req.query.id
            if (rawId !== undefined && rawId !== '') {
                const recordId = Number(rawId)
                if (!Number.isFinite(recordId)) {
                    res.status(400).send()
                    return
                }

                const record: any = await getRecordById(recordId, { includePublicListStats: true })
                if (!record || record.userid !== userID || record.levelid !== levelIdNum) {
                    res.status(404).send()
                    return
                }

                res.send(record)
                return
            }

            // With a `variant=pending` query parameter, explicitly fetch the
            // pending replacement row if one exists.
            if (req.query.variant === 'pending') {
                const pending = await getPendingRecord(userID, levelIdNum)
                if (!pending) {
                    res.status(404).send()
                    return
                }

                res.send(pending)
                return
            }

            res.send(await getRecord(userID, levelIdNum, { includePublicListStats: true }))
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/:userID/:levelID/all')
    /**
     * @openapi
     * "/record/{userID}/{levelID}/all":
     *   get:
     *     tags:
     *       - Record
     *     summary: Get both the accepted and pending records for a user + level
     *     responses:
     *       200:
     *         description: Returns { accepted, pending } where each field is
     *           either the matching record row or null.
     */
    .get(async (req, res) => {
        const { userID, levelID } = req.params
        const levelIdNum = parseInt(levelID)

        try {
            const [accepted, pending] = await Promise.all([
                getAcceptedRecord(userID, levelIdNum),
                getPendingRecord(userID, levelIdNum)
            ])

            res.send({ accepted, pending })
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
        const scope = parseOverwatchRecordScope(req.query.type)

        if (!scope) {
            res.status(400).send({ message: 'Invalid retrieve type' })
            return
        }

        if (!user.isAdmin && !user.isTrusted) {
            res.status(401).send()
            return
        }

        const limitStatus = getOverwatchLimit(user, scope)

        if (limitStatus.limitLeft <= 0) {
            res.status(429).send({
                message: 'Daily limit reached',
                type: scope,
                limit: limitStatus.limit,
                limitLeft: 0,
                limits: getOverwatchLimitSummary(user)
            })
            return
        }

        try {
            const record = await retrieveRecord(user, scope)
            res.send({
                ...record,
                type: scope,
                limit: limitStatus.limit,
                limitLeft: limitStatus.limitLeft,
                limits: getOverwatchLimitSummary(user)
            })
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/retrieve-limit')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals

        if (!user.isAdmin && !user.isTrusted) {
            res.status(401).send()
            return
        }

        res.send({
            limits: getOverwatchLimitSummary(user)
        })
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