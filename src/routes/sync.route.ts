import { syncWiki } from '@src/services/sync.service'
import express from 'express'

const router = express.Router()

router.route('/wiki')
    .post(async (req, res) => {
        try {
            const { commit_id: commitId } = req.body

            await syncWiki(commitId)

            res.send()
        } catch (err: any) {
            console.error(err);
            
            res.status(500).send({
                error: err.message
            })
        }

    })

export default router