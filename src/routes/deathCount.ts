import express from 'express'
import { getDeathCount, updateDeathCount } from '@src/lib/client'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/:uid/:levelID')
    .get(async (req, res) => {
        try {
            const { uid, levelID } = req.params
            res.send(await getDeathCount(uid, parseInt(levelID)));
        } catch {
            res.status(500).send();
        }
    })

router.route('/:levelID/:count')
    .post(userAuth, async (req, res) => {
        const { count } = req.params
        const arr: any[] = count.split('|')

        for(let i = 0; i < arr.length; i++) {
            arr[i] = parseInt(arr[i]);
        }

        try {
            const { levelID } = req.params
            const uid = res.locals.user.data.uid

            res.send(await updateDeathCount(uid, parseInt(levelID), arr));
        } catch {
            res.status(500).send();
        }
    })

export default router