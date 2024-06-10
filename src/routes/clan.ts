import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/:id')
    .get(async (req, res) => {

    })

    .put(userAuth, async (req, res) => {

    })

router.route('/:id/members')
    .get(async (req, res) => {

    })

router.route('/:id/records')
    .get(async (req, res) => {

    })

router.route('/invite/:uid')
    .post(userAuth, async (req, res) => {

    })

router.route('/:id/invite/accept')
    .put(userAuth, async (req, res) => {

    })

router.route('/:id/invite/reject')
    .delete(userAuth, async (req, res) => {

    })

export default router