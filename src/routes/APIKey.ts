import express from 'express'
import userAuth from '@src/middleware/userAuth'
import { createAPIKey, deleteAPIKey, getAllAPIKey } from '@src/lib/client'

const router = express.Router()

router.route('/')
    .get(userAuth, async (req, res) => {
        if(res.locals.authType == 'key') {
            res.status(403).send()
            return
        }
        
        try {
            res.send(await getAllAPIKey(res.locals.user.data.uid))
        } catch (err) {
            res.status(500).send()
        }
    })
    .post(userAuth, async (req, res) => {
        if(res.locals.authType == 'key') {
            res.status(403).send()
            return
        }
        
        try {
            await createAPIKey(res.locals.user.data.uid)
            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/:key')
    .delete(userAuth, async (req, res) => {
        if(res.locals.authType == 'key') {
            res.status(403).send()
            return
        }
        
        try {
            await deleteAPIKey(res.locals.user.data.uid, req.params.key)
            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

export default router