import Clan from '@src/lib/classes/Clan'
import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()


router.route('/')
    .post(userAuth, async (req, res) => {
        const { user } = res.locals

        if (user.data.clan) {
            res.status(500).send()
            return
        }

        req.body.owner = user.data.uid
        delete req.body.id

        const clan = new Clan(req.body)

        try {
            await clan.create()
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

    .patch(userAuth, async (req, res) => {
        const { user } = res.locals

        if (!user.data.clan) {
            res.status(500).send()
            return
        }

        req.body.id = user.data.clan
        const clan = new Clan(req.body)

        try {
            await clan.update()
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/:id')
    .get(async (req, res) => {
        const { id } = req.params
        const clan = new Clan({ id: parseInt(id) })

        try {
            await clan.pull()
            res.send(clan.data)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
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