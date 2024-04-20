import express from 'express'
import userAuth from '@src/middleware/userAuth'
import { createAPIKey, deleteAPIKey } from '@src/lib/client'

const router = express.Router()

router.route('/')
    .post(userAuth, async (req, res) => {
        try {
            await createAPIKey(res.locals.user.data.uid)
            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })
    
router.route('/:key')
    .delete(userAuth, async (req, res) => {
        try {
            await deleteAPIKey(res.locals.user.data.uid, req.params.key)
            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

export default router