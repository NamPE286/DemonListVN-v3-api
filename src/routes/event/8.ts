import userAuth from '@src/middleware/userAuth'
import express from 'express'
import supabase from '@src/database/supabase'
import { plugin } from 'bun'

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
        const levelIDs = [123, 234, 345, 456, 567]
        const levelPts = [100, 200, 300, 400, 500]
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

            while(res.length < levelIDs.length) {
                let found = false;

                for(const record of player.eventRecords) {
                    if(record.levelID == levelIDs[res.length]) {
                        res.push(record)
                        found = true;
                        break
                    }
                }

                if(!found) {
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

            return y - x;
        });

        res.send(data)
    })

export default router