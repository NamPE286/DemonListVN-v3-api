import Clan from '@src/lib/classes/Clan'
import ClanInvitation from '@src/lib/classes/ClanInvitation'
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
        const { id } = req.params
        const clan = new Clan({ id: parseInt(id) })

        try {
            res.send(await clan.fetchMembers())
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })


router.route('/:id/records')
    .get(async (req, res) => {
        const { id } = req.params
        const clan = new Clan({ id: parseInt(id) })

        try {
            res.send(await clan.fetchRecords())
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/invite/:uid')
    .post(userAuth, async (req, res) => {
        const { user } = res.locals
        const { uid } = req.params

        if (!user.data.clan) {
            res.status(500).send()
            return
        }

        const clan = new Clan({ id: user.data.clan })
        await clan.pull()

        if (clan.data.isPublic || clan.data.owner == user.data.uid) {
            await clan.invite(uid)
            res.send()
            return
        }

        res.status(403).send()
    })

router.route('/:id/invite')
    .put(userAuth, async (req, res) => {
        const { user } = res.locals
        const { id } = req.params
        const invitation = new ClanInvitation({ to: user.data.uid, clan: parseInt(id) })

        try {
            await invitation.accept()
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/:id/invite')
    .delete(userAuth, async (req, res) => {
        const { user } = res.locals
        const { id } = req.params
        const invitation = new ClanInvitation({ to: user.data.uid, clan: parseInt(id) })

        try {
            await invitation.reject()
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router