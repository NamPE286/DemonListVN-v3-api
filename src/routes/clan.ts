import Clan from '@src/lib/classes/Clan'
import ClanInvitation from '@src/lib/classes/ClanInvitation'
import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/clan":
      *   post:
      *     tags:
      *       - Clan
      *     summary: Create a new clan
      *     requestBody:
      *         required: true
      *         content:
      *             application/json:
      *     responses:
      *       200:
      *         description: Success
      */
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

    /**
     * @openapi
     * "/clan":
     *   patch:
     *     tags:
     *       - Clan
     *     summary: Edit a clan owned by user
     *     requestBody:
     *         required: true
     *         content:
     *             application/json:
     *     responses:
     *       200:
     *         description: Success
     */
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
    /**
     * @openapi
     * "/clan/{id}":
     *   get:
     *     tags:
     *       - Clan
     *     summary: Get a single clan by the id
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the clan
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
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
    /**
     * @openapi
     * "/clan/{id}/members":
     *   get:
     *     tags:
     *       - Clan
     *     summary: Get member list of a clan
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the clan
     *         required: true
     *         schema:
     *           type: number
     *       - name: start
     *         in: query
     *         description: Range start index
     *         required: false
     *         schema:
     *           type: number
     *           default: 0
     *       - name: end
     *         in: query
     *         description: Range end index
     *         required: false
     *         schema:
     *           type: number
     *           default: 50
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: rating
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        const { id } = req.params
        const clan = new Clan({ id: parseInt(id) })

        try {
            res.send(await clan.fetchMembers(req.query))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })


router.route('/:id/records')
    /**
     * @openapi
     * "/clan/{id}/records":
     *   get:
     *     tags:
     *       - Clan
     *     summary: Get record list of a clan
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the clan
     *         required: true
     *         schema:
     *           type: number
     *       - name: start
     *         in: query
     *         description: Range start index
     *         required: false
     *         schema:
     *           type: number
     *           default: 0
     *       - name: end
     *         in: query
     *         description: Range end index
     *         required: false
     *         schema:
     *           type: number
     *           default: 50
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: dlPt
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        const { id } = req.params
        const clan = new Clan({ id: parseInt(id) })

        try {
            res.send(await clan.fetchRecords(req.query))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/invite/:uid')
    /**
      * @openapi
      * "/clan/invite/{uid}":
      *   post:
      *     tags:
      *       - Clan
      *     summary: Invite a player to a clan by the uid
      *     parameters:
      *       - name: uid
      *         in: path
      *         description: The uid of the player
      *         required: true
      *         schema:
      *           type: string
      *     responses:
      *       200:
      *         description: Success
      */
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
    /**
      * @openapi
      * "/clan/{id}/invite":
      *   patch:
      *     tags:
      *       - Clan
      *     summary: Accept a clan invitation
      *     parameters:
      *       - name: id
      *         in: path
      *         description: The id of the clan
      *         required: true
      *         schema:
      *           type: number
      *     responses:
      *       200:
      *         description: Success
      */
    .patch(userAuth, async (req, res) => {
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
    /**
      * @openapi
      * "/clan/{id}/invite":
      *   delete:
      *     tags:
      *       - Clan
      *     summary: Reject a clan invitation
      *     parameters:
      *       - name: id
      *         in: path
      *         description: The id of the clan
      *         required: true
      *         schema:
      *           type: number
      *     responses:
      *       200:
      *         description: Success
      */
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