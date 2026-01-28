import { syncWiki } from '@src/services/sync.service'
import express from 'express'

const router = express.Router()

router.route('/wiki')
    .post(async (req, res) => {
        const { commit_id: commitId } = req.body

        await syncWiki(commitId)
        
        res.send()
    })

export default router