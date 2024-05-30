import supabase from '@src/database/supabase'
import Record from '@src/lib/classes/Record'
import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/submitVerdict":
      *   PUT:
      *     tags:
      *       - Verdict
      *     summary: Submit a verdict from trusted player
      *     requestBody:
      *         required: true
      *         content:
      *             application/json:
      *     responses:
      *       200:
      *         description: Success
     */
    .put(userAuth, async (req, res) => {
        const record = new Record({ userid: req.body.userid, levelid: req.body.levelid })
        await record.pull()

        if (record.data.reviewer != res.locals.user.data.uid || !res.locals.user.data.isTrusted) {
            res.status(401).send()
            return
        }

        const { error } = await supabase
            .from('records')
            .update(req.body)
            .match({ userid: req.body.userid, levelid: req.body.levelid })

        if (error) {
            console.log(error)
            res.status(500).send()
            return
        }

        res.send()
    })

export default router