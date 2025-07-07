import userAuth from '@src/middleware/userAuth'
import express from 'express'
import supabase from '@src/database/supabase'
import { deleteEventSubmission, getEvent, getEventLeaderboard, getEventLevels, getEventSubmissions, insertEventSubmission } from '@src/lib/client/event'

const router = express.Router()

router.route('/levels')
    .get(async (req, res) => {
        try {
            res.send(await getEventLevels(8))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/submissions')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        try {
            res.send(await getEventSubmissions(8, user.uid!))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/submit')
    .post(userAuth, async (req, res) => {
        const event = await getEvent(8)

        if (new Date(event.end!) < new Date()) {
            res.status(401).send();
            return;
        }

        const { user } = res.locals

        req.body.userID = user.uid
        req.body.accepted = false

        try {
            await insertEventSubmission(req.body)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/submission/:levelID')
    .delete(userAuth, async (req, res) => {
        const event = await getEvent(8)

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

router.route('/leaderboard')
    .get(async (req, res) => {
        try {
            res.send(await getEventLeaderboard(8))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router