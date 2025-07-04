import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/submissions')
    .get(userAuth, async (req, res) => {
        // TODO
    })

router.route('/submit')
    .post(userAuth, async (req, res) => {
        // TODO
    })

router.route('/leaderboard')
    .get(async (req, res) => {
        // TODO
    })

export default router