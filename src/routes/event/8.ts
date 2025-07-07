import userAuth from '@src/middleware/userAuth'
import express from 'express'
import supabase from '@src/database/supabase'
import { getEvent, getEventLevels, getEventSubmissions } from '@src/lib/client/event'

const router = express.Router()
const levelIDs = [121184864, 120313852, 120866069, 120552432, 121537017]
const levelPts = [100, 200, 300, 400, 500]

function getPenalty(records: any[]) {
    let res: number = 0;

    for (const i of records) {
        if (i == null) {
            continue;
        }

        res += new Date(i.created_at).getTime()
    }

    return res
}

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
            .select("*, clans!id(*), eventRecords!inner(*, eventLevels!inner(*))")
            .eq("eventRecords.eventLevels.eventID", 8)


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

            if (x == y && x != 0) {
                return getPenalty(a.eventRecords) - getPenalty(b.eventRecords)
            }

            return y - x;
        });

        res.send(data)
    })

export default router