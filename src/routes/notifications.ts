import express from 'express'
import { clearPlayerNotifications, getPlayerNotifications } from '@src/lib/client'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/:uid')
    .get(userAuth, async (req, res) => {
        const { uid } = req.params
        const { user } = res.locals

        if(user.data.uid != uid && !user.data.isAdmin) {
            res.status(403).send()
            return
        }

        res.send(await getPlayerNotifications(uid))
    })
    .delete(userAuth, async (req, res) => {
        const { uid } = req.params
        const { user } = res.locals

        if(user.data.uid != uid && !user.data.isAdmin) {
            res.status(403).send()
            return
        }

        res.send(await clearPlayerNotifications(uid))
    })

export default router