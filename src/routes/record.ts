import express from 'express'
import Record from '@lib/classes/Record'
import adminAuth from '@src/middleware/adminAuth'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/')
    .put(adminAuth, async (req, res) => {
        const record = new Record(req.body)
        await record.update()

        res.send()
    })

router.route('/:userID/:levelID')
    .delete(userAuth, async (req, res) => {
        const { user } = res.locals
        const { userID, levelID } = req.params

        if (user.data.uid != userID && !user.data.isAdmin) {
            res.status(403).send()
            return
        }

        const record = new Record({userid: userID, levelid: parseInt(levelID)})
        await record.delete()

        res.send()
    })

export default router