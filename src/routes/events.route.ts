import express from 'express'
import {
    deleteEventProof,
    getEvent,
    getEventProof,
    getEventProofs,
    insertEventProof,
    upsertEventProof,
    deleteEventSubmission,
    get_event_leaderboard,
    getEventLevels,
    getEventSubmissions,
    insertEventSubmission,
    upsertEventSubmission,
    insertEvent,
    updateEvent,
    upsertEventLevel,
    deleteEventLevel,
    updateEventLevel,
    getEventLevelsSafe,
    getEvents,
    getOngoingEvents
} from '@src/services/event.service'
import userAuth from '@src/middleware/user-auth.middleware'
import adminAuth from '@src/middleware/admin-auth.middleware'
import optionalUserAuth from '@src/middleware/optional-user-auth.middleware'
import supabase from '@src/client/supabase'
import { calcLeaderboard } from '@src/services/elo.service'
import { getEventQuest, getEventQuests, isQuestClaimed, isQuestCompleted, createEventQuest, updateEventQuest, deleteEventQuest, addQuestReward, removeQuestReward } from '@src/services/event-quest.service'
import { addInventoryItem, receiveReward } from '@src/services/inventory.service'
import { isActive } from '@src/utils'

const router = express.Router()

/**
 * @openapi
 * "/events":
 *   get:
 *     tags:
 *       - Event
 *     summary: Get all events with filters
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Search term
 *         required: false
 *         schema:
 *           type: string
 *       - name: eventType
 *         in: query
 *         description: Event type filter
 *         required: false
 *         schema:
 *           type: string
 *           default: all
 *       - name: contestType
 *         in: query
 *         description: Contest type filter
 *         required: false
 *         schema:
 *           type: string
 *           default: all
 *       - name: from
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *       - name: to
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Event
 *     summary: Create a new event (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event created successfully
 *       500:
 *         description: Internal server error
 */
router.route('/')
    .get(async (req, res) => {
        let defaultFilter = {
            search: '',
            eventType: 'all',
            contestType: 'all',
            start: '',
            end: '',
            from: 0,
            to: 50
        };
        const filter: any = { ...defaultFilter, ...req.query };

        try {
            if (!filter.to) {
                res.send(await getEvents(filter))
            } else {
                res.send(await getEvents(filter))
            }
        } catch {
            res.status(500).send()
        }
    })
    .post(adminAuth, async (req, res) => {
        try {
            await insertEvent(req.body);
            res.send()
        } catch (err: any) {
            console.error(err);

            res.status(500).send({
                message: err.message
            })
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
 *   get:
 *     tags:
 *       - Event
 *     summary: Get event proofs
 *     parameters:
 *       - name: from
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: integer
 *       - name: to
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
router.route('/proofs')
    .get(async (req, res) => {
        try {
            res.send(await getEventProofs(null, req.query))
        } catch {
            res.status(500).send()
        }
    })
    /**
     * @openapi
     * "/event/proofs":
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
    .put(adminAuth, async (req, res) => {
        try {
            res.send(await upsertEventProof(req.body))
        } catch {
            res.status(500).send();
        }
    })
    /**
     * @openapi
     * "/event/proofs":
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
    .post(userAuth, async (req, res) => {
        const { user } = res.locals;

        req.body.userid = res.locals.user.uid
        req.body.accepted = false

        const event = await getEvent(parseInt(req.body.eventID));

        if (event.isSupporterOnly && !isActive(user.supporterUntil)) {
            res.status(401).send();
            return;
        }

        if (event.isContest && !user.discord) {
            res.status(401).send();
            return;
        }

        if (event.end && new Date() >= new Date(event.end)) {
            res.status(401).send();
            return;
        }

        try {
            res.send(await insertEventProof(req.body))
        } catch (err) {
            console.error(err)
            res.status(500).send();
        }
    })

/**
 * @openapi
 * "/events/submitLevel/{levelID}":
 *   put:
 *     tags:
 *       - Event
 *     summary: Submit event level completion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: levelID
 *         in: path
 *         description: The ID of the level
 *         required: true
 *         schema:
 *           type: integer
 *       - name: progress
 *         in: query
 *         description: Completion progress
 *         required: false
 *         schema:
 *           type: integer
 *       - name: password
 *         in: query
 *         description: Submit password for authentication
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Level submitted successfully
 *       403:
 *         description: Invalid password
 *       500:
 *         description: Internal server error
 */
router.route('/submitLevel/:levelID')
    .put(userAuth, async (req, res) => {
        const { user } = res.locals
        const { levelID } = req.params
        const { progress, password } = req.query

        if (password != process.env.SUBMIT_PASSWORD) {
            res.status(403).send()
            return;
        }

        const now = new Date().toISOString()
        var { data, error } = await supabase
            .from('eventProofs')
            .select('userid, eventID, events!inner(start, end, type, eventLevels!inner(*, eventRecords(userID, levelID, progress, accepted, videoLink)))')
            .eq('userid', user.uid!)
            .eq('events.eventLevels.levelID', Number(levelID))
            .eq('events.eventLevels.eventRecords.userID', user.uid!)
            .lte('events.start', now)
            .gte('events.end', now)

        if (error) {
            console.error(error)
            res.status(500).send()

            return
        }

        for (const i of data!) {
            const levels = await getEventLevelsSafe(i.eventID)

            if (!levels.some(level => level && level.levelID === Number(levelID))) {
                res.status(500).send()
                return
            }
        }

        interface LevelUpdateData {
            level_id: number,
            gained: number
        }

        const eventRecordUpsertData = []
        const eventLevelUpdateData: LevelUpdateData[] = []

        for (const event of data!) {
            for (const level of event.events?.eventLevels!) {
                let totalProgress = 0;

                for (const record of level.eventRecords) {
                    if (record.progress < Number(progress) && event.events!.type == 'basic') {
                        // @ts-ignore
                        record.created_at = new Date().toISOString()
                        record.progress = Number(progress)
                        record.videoLink = "Submitted via Geode mod"
                        record.accepted = true;

                        eventRecordUpsertData.push(record);
                    }


                    if (event.events!.type == 'raid') {
                        const remainingHP = Math.max(0, level.point - level.totalProgress)

                        // @ts-ignore
                        record.created_at = new Date().toISOString()

                        let prog = Number(progress);
                        let dmg = Math.min(remainingHP, Number(progress) * Math.pow(1.0305, Number(progress)));

                        if (prog >= level.minEventProgress) {
                            if (prog == 100) {
                                dmg *= 1.5
                            }

                            record.progress += dmg;
                            totalProgress += dmg;
                            record.videoLink = "Submitted via Geode mod"
                            record.accepted = true;

                            eventRecordUpsertData.push(record);
                        }
                    }
                }

                if (!level.eventRecords.length) {
                    eventRecordUpsertData.push({
                        created_at: new Date().toISOString(),
                        userID: user.uid!,
                        levelID: level.id,
                        progress: Number(progress),
                        accepted: true,
                        videoLink: "Submitted via Geode mod"
                    })
                }

                if (totalProgress > 0) {
                    level.totalProgress! += totalProgress;

                    eventLevelUpdateData.push({
                        level_id: level.id,
                        gained: totalProgress
                    })
                }
            }
        }

        var { error } = await supabase
            .from('eventRecords')
            .upsert(eventRecordUpsertData)

        if (error) {
            console.error(error)
            res.status(500).send()

            return
        }

        var { error } = await supabase.rpc('add_event_levels_progress', {
            updates: JSON.parse(JSON.stringify(eventLevelUpdateData))
        });

        if (error) {
            console.error(error)
            res.status(500).send()

            return
        }

        res.send();
    })

/**
 * @openapi
 * "/events/quest/{questId}/check":
 *   get:
 *     tags:
 *       - Event
 *     summary: Check quest completion status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: questId
 *         in: path
 *         description: The ID of the quest
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quest status returned (claimed, claimable, or unclaimable)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [claimed, claimable, unclaimable]
 */
router.route('/quest/:questId/check')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { questId } = req.params

        if (await isQuestClaimed(user, Number(questId))) {
            res.send({
                status: 'claimed'
            })

            return;
        }

        try {
            const result = await isQuestCompleted(user, Number(questId));

            if (!result) {
                res.send({
                    status: 'unclaimable'
                })

                return;
            }

            res.send({
                status: 'claimable'
            })
        } catch {
            res.send({
                status: 'unclaimable'
            })
        }
    })

/**
 * @openapi
 * "/events/quest/{questId}/claim":
 *   post:
 *     tags:
 *       - Event
 *     summary: Claim quest reward
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: questId
 *         in: path
 *         description: The ID of the quest
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quest reward claimed successfully
 *       400:
 *         description: Quest already claimed or not completed
 *       500:
 *         description: Internal server error
 */
router.route('/quest/:questId/claim')
    .post(userAuth, async (req, res) => {
        const { questId } = req.params
        const { user } = res.locals

        try {
            if (await isQuestClaimed(user, Number(questId))) {
                res.status(400).send({ message: 'Already claimed' })
                return
            }

            const completed = await isQuestCompleted(user, Number(questId))

            if (!completed) {
                res.status(401).send()
                return
            }

            const quest = await getEventQuest(Number(questId))
            const event = await getEvent(quest.eventId)

            var { error } = await supabase
                .from('eventQuestClaims')
                .insert({
                    userId: user.uid!,
                    questId: Number(questId)
                })

            if (error) {
                console.error(error)
                res.status(500).send()
                return
            }

            if (quest.rewards && Array.isArray(quest.rewards)) {
                for (const reward of quest.rewards) {
                    try {
                        await receiveReward(user, reward)
                    } catch (err) {
                        console.error(err)
                    }
                }
            }

            res.send()
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }

    })

/**
 * @openapi
 * "/events/submission":
 *   patch:
 *     tags:
 *       - Event
 *     summary: Update event submission (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *       500:
 *         description: Internal server error
 */
router.route('/submission')
    .patch(adminAuth, async (req, res) => {
        try {
            await upsertEventSubmission(req.body)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/events/{id}":
 *   patch:
 *     tags:
 *       - Event
 *     summary: Update an event (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the event
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       500:
 *         description: Internal server error
 */
router.route('/:id')
    .patch(adminAuth, async (req, res) => {
        const { id } = req.params
        try {
            await updateEvent(Number(id), req.body);
            res.send()
        } catch (err: any) {
            console.error(err);

            res.status(500).send({
                message: err.message
            })
        }
    })

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
    .get(optionalUserAuth, async (req, res) => {
        const { id } = req.params
        const event = await getEvent(parseInt(id))
        const { user } = res.locals

        try {
            if (user && user.isAdmin) {
                res.send(await getEventLevels(parseInt(id)))
                return;
            }

            const result = await getEventLevelsSafe(parseInt(id));

            if (new Date(event.start) >= new Date()) {
                res.send(Array(result.length).fill(null))
            } else {
                res.send(result);
            }
        } catch (err) {
            console.error(err)
            res.send([])
        }
    })
    .put(adminAuth, async (req, res) => {
        const { id } = req.params;
        try {
            if (req.body.id) {
                await updateEventLevel(req.body);
            } else {
                await upsertEventLevel(Number(id), req.body);
            }

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/events/{id}/level/{levelID}":
 *   delete:
 *     tags:
 *       - Event
 *     summary: Delete a level from an event (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the event
 *         required: true
 *         schema:
 *           type: integer
 *       - name: levelID
 *         in: path
 *         description: The ID of the level
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Level deleted successfully
 *       500:
 *         description: Internal server error
 */
router.route('/:id/level/:levelID')
    .delete(adminAuth, async (req, res) => {
        const { id, levelID } = req.params;
        try {
            await deleteEventLevel(Number(id), Number(levelID));
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

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
    .get(userAuth, async (req, res) => {
        const { id } = req.params
        const { user } = res.locals

        try {
            res.send(await getEventSubmissions(parseInt(id), user.uid!))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

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
    .post(userAuth, async (req, res) => {
        const { id } = req.params
        const event = await getEvent(parseInt(id))

        if (new Date(event.end!) < new Date()) {
            res.status(401).send();
            return;
        }

        const { user } = res.locals

        req.body.userID = user.uid
        req.body.accepted = null

        try {
            await insertEventSubmission(req.body)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/:id/submission/:levelID')
    /**
     * @openapi
     * "/event/{id}/submission/{levelID}":
     *   delete:
     *     tags:
     *       - Event
     *     summary: Delete a submission for a specific level in an event
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
    .delete(userAuth, async (req, res) => {
        const { id } = req.params
        const event = await getEvent(parseInt(id))

        if (new Date(event.end!) < new Date()) {
            res.status(401).send();
            return;
        }

        const { user } = res.locals
        const { levelID } = req.params

        try {
            await deleteEventSubmission(parseInt(levelID), user.uid!)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

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
    .get(optionalUserAuth, async (req, res) => {
        const { id } = req.params
        const { user, authenticated } = res.locals
        const ignoreFreeze = authenticated && (user && user.isAdmin!)

        try {
            res.send(await get_event_leaderboard(parseInt(id), ignoreFreeze))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/:id')
    /**
     * @openapi
     * "/event/{id}":
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
    .get(async (req, res) => {
        const { id } = req.params

        try {
            res.send(await getEventProofs(parseInt(id), req.query))
        } catch {
            res.status(500).send();
        }
    })

router.route('/:id/proofs/:uid')
    /**
     * @openapi
     * "/event/{id}/proofs/{uid}":
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
    .get(async (req, res) => {
        const { id, uid } = req.params

        try {
            res.send(await getEventProof(parseInt(id), uid))
        } catch {
            res.status(500).send();
        }
    })
    /**
     * @openapi
     * "/event/{id}/proofs/{uid}":
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
    .delete(userAuth, async (req, res) => {
        const { id, uid } = req.params
        const user = res.locals.user

        if (!user.isAdmin && !(user.uid == uid)) {
            res.status(401).send()
            return
        }

        try {
            res.send(await deleteEventProof(parseInt(id), uid))
        } catch {
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/events/{id}/calc":
 *   patch:
 *     tags:
 *       - Event
 *     summary: Calculate event leaderboard (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the event
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leaderboard calculated successfully
 *       403:
 *         description: Event is unranked
 *       500:
 *         description: Internal server error
 */
router.route('/:id/calc')
    .patch(adminAuth, async (req, res) => {
        const { id } = req.params
        const event = await getEvent(Number(id))

        if (event.isCalculated) {
            res.send({
                message: 'Calculated'
            })

            return
        }

        if (!event.isRanked) {
            res.status(403).send({
                message: 'This event is unranked'
            })

            return
        }

        var { data, error } = await supabase
            .rpc('get_event_leaderboard', { event_id: Number(id) });

        const newData = calcLeaderboard(data!)

        for (const i of newData) {
            // @ts-ignore
            i.eventID = Number(id)
        }

        var { error } = await supabase
            .from('players')
            .upsert(newData.map(item => ({
                uid: item.userID,
                elo: item.elo,
                matchCount: item.matchCount + 1
            })))

        if (error) {
            console.error(error)
            res.status(500).send()
            return;
        }

        var { error } = await supabase
            .from('eventProofs')
            .upsert(newData.map((item) => ({
                userid: item.userID,
                eventID: Number(id),
                diff: item.diff
            })))

        if (error) {
            console.error(error)
            res.status(500).send()
            return;
        }

        if (error) {
            console.error(error)
            res.status(500).send()
            return;
        }

        event.isCalculated = true;
        event.freeze = null;

        var { error } = await supabase
            .from('events')
            .update(event)
            .eq('id', event.id)

        res.send()
    })

/**
 * @openapi
 * "/events/{id}/quest":
 *   get:
 *     tags:
 *       - Event
 *     summary: Get quests for an event
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the event
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
router.route('/:id/quest')
    .get(async (req, res) => {
        const { id } = req.params
        try {
            res.send(await getEventQuests(Number(id)))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    /**
     * @openapi
     * "/events/{id}/quest":
     *   post:
     *     tags:
     *       - Event
     *     summary: Create a new quest for an event (Admin only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the event
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               condition:
     *                 type: array
     *     responses:
     *       200:
     *         description: Quest created successfully
     *       500:
     *         description: Internal server error
     */
    .post(adminAuth, async (req, res) => {
        const { id } = req.params;
        const { title, condition } = req.body;

        try {
            const quest = await createEventQuest(Number(id), title, condition);
            res.send(quest);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    })

/**
 * @openapi
 * "/events/{id}/quest/{questId}":
 *   patch:
 *     tags:
 *       - Event
 *     summary: Update a quest (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the event
 *         required: true
 *         schema:
 *           type: integer
 *       - name: questId
 *         in: path
 *         description: The ID of the quest
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               condition:
 *                 type: array
 *     responses:
 *       200:
 *         description: Quest updated successfully
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags:
 *       - Event
 *     summary: Delete a quest (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the event
 *         required: true
 *         schema:
 *           type: integer
 *       - name: questId
 *         in: path
 *         description: The ID of the quest
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quest deleted successfully
 *       500:
 *         description: Internal server error
 */
router.route('/:id/quest/:questId')
    .patch(adminAuth, async (req, res) => {
        const { questId } = req.params;
        const updates = req.body;

        try {
            const quest = await updateEventQuest(Number(questId), updates);
            res.send(quest);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    })
    .delete(adminAuth, async (req, res) => {
        const { questId } = req.params;

        try {
            await deleteEventQuest(Number(questId));
            res.send({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    })

/**
 * @openapi
 * "/events/{id}/quest/{questId}/reward":
 *   post:
 *     tags:
 *       - Event
 *     summary: Add a reward to a quest (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the event
 *         required: true
 *         schema:
 *           type: integer
 *       - name: questId
 *         in: path
 *         description: The ID of the quest
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rewardId:
 *                 type: integer
 *               expireAfter:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reward added successfully
 *       500:
 *         description: Internal server error
 */
router.route('/:id/quest/:questId/reward')
    .post(adminAuth, async (req, res) => {
        const { questId } = req.params;
        const { rewardId, expireAfter } = req.body;

        try {
            const reward = await addQuestReward(Number(questId), Number(rewardId), expireAfter);
            res.send(reward);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    })

/**
 * @openapi
 * "/events/{id}/quest/{questId}/reward/{rewardId}":
 *   delete:
 *     tags:
 *       - Event
 *     summary: Remove a reward from a quest (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the event
 *         required: true
 *         schema:
 *           type: integer
 *       - name: questId
 *         in: path
 *         description: The ID of the quest
 *         required: true
 *         schema:
 *           type: integer
 *       - name: rewardId
 *         in: path
 *         description: The ID of the reward item
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reward removed successfully
 *       500:
 *         description: Internal server error
 */
router.route('/:id/quest/:questId/reward/:rewardId')
    .delete(adminAuth, async (req, res) => {
        const { questId, rewardId } = req.params;

        try {
            await removeQuestReward(Number(questId), Number(rewardId));
            res.send({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    })

export default router