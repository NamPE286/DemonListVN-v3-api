import userAuth from '@src/middleware/userAuth'
import express from 'express'
import supabase from '@src/database/supabase'
import { getEvent } from '@src/lib/client/event'

const router = express.Router()
const levelIDs = [121184864, 120313852, 120866069, 120552432, 121537017]
const levelPts = [100, 200, 300, 400, 500]

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

        const result = []

        while (result.length < levelIDs.length) {
            let found = false;

            for (const record of data) {
                if (record.levelID == levelIDs[result.length]) {
                    result.push(record)
                    found = true;
                    break
                }
            }

            if (!found) {
                result.push(null)
            }

        }

        res.send(result)

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

router.route('/submission/:levelID')
    .delete(userAuth, async (req, res) => {
        const event = await getEvent(8)

        if (new Date(event.end!) < new Date()) {
            res.status(401).send();
            return;
        }

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
        const { data, error } = await supabase
            .from("players")
            .select("*, clans!id(*), eventRecords!inner(*)")
            .eq("eventRecords.eventID", 8)

        if (error) {
            console.error(error)
            res.status(500).send()

            return;
        }

        for (const player of data) {
            const res = []

            while (res.length < levelIDs.length) {
                let found = false;

                for (const record of player.eventRecords) {
                    if (record.levelID == levelIDs[res.length]) {
                        res.push(record)
                        found = true;
                        break
                    }
                }

                if (!found) {
                    res.push(null)
                }
            }

            // @ts-ignore
            player.eventRecords = res;
        }

        data.sort((a, b) => {
            const x = a.eventRecords.reduce((sum, record, index) => {
                return sum + (record ? levelPts[index] * record.progress : 0);
            }, 0);

            const y = b.eventRecords.reduce((sum, record, index) => {
                return sum + (record ? levelPts[index] * record.progress : 0);
            }, 0);

            if (x == y) {
                return Math.min(...a.eventRecords.map(r => (r ? new Date(r.created_at).getTime() : Infinity)))
                    - Math.min(...b.eventRecords.map(r => (r ? new Date(r.created_at).getTime() : Infinity)))
            }

            return y - x;
        });

        res.send(data)
    })

export default router