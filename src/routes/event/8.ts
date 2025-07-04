import userAuth from '@src/middleware/userAuth'
import express from 'express'
import supabase from '@src/database/supabase'

const router = express.Router()

router.route('/submissions')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals

        const { data, error } = await supabase
            .from("eventRecords")
            .select("*")
            .match({ userID: user.uid!, eventID: 8 })

        if (error) {
            console.error(error)
            res.status(500).send()

            return;
        }

        res.send(data)
    })

router.route('/submit')
    .post(userAuth, async (req, res) => {
        const { user } = res.locals

        req.body.userID = user.uid

        const { error } = await supabase
            .from("eventRecords")
            .insert(req.body)

        if (error) {
            console.error(error)
            res.status(500).send()

            return;
        }

        res.send()
    })

router.route('/cancel/:levelID')
    .delete(userAuth, async (req, res) => {
        const { user } = res.locals
        const { levelID } = req.params

        const { error } = await supabase
            .from('eventRecords')
            .delete()
            .match({ userID: user.uid!, levelID: parseInt(levelID) })

        if (error) {
            console.error(error)
            res.status(500).send()

            return;
        }

        res.send()
    })

router.route('/leaderboard')
    .get(async (req, res) => {
        // TODO
    })

export default router