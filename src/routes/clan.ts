import supabase from '@src/database/supabase'
import Clan from '@src/lib/classes/Clan'
import ClanInvitation from '@src/lib/classes/ClanInvitation'
import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

async function isOwner(uid: string, clanID: number) {
    const clan = new Clan({ id: clanID })
    await clan.pull()

    return uid == clan.data.owner
}

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

        if (!user.data.rating && !user.data.totalFLpt) {
            res.status(500).send()
            return
        }

        req.body.owner = user.data.uid
        delete req.body.id

        const clan = new Clan(req.body)

        try {
            await clan.create()
            res.send(clan)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/invitations')
    /**
     * @openapi
     * "/clan/invitations":
     *   get:
     *     tags:
     *       - Clan
     *     summary: Get clan invitation list
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { data, error } = await supabase
            .from('clanInvitations')
            .select('*, clans(*, players!owner(*, clans!id(*)))')
            .eq('to', user.data.uid!)

        if (error) {
            console.error(error)
            res.status(500).send()
            return
        }

        res.send(data)
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

    /**
     * @openapi
     * "/clan/{id}":
     *   patch:
     *     tags:
     *       - Clan
     *     summary: Edit a clan owned by user
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the clan
     *         required: true
     *         schema:
     *           type: number
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
        const { id } = req.params


        if (!user.data.clan) {
            res.status(500).send()
            return
        }

        if (!(await isOwner(user.data.uid!, parseInt(id))) && !user.data.isAdmin) {
            res.status(403).send()
            return
        }

        req.body.id = id
        const clan = new Clan(req.body)

        try {
            await clan.update()
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

    /**
     * @openapi
     * "/clan/{id}":
     *   delete:
     *     tags:
     *       - Clan
     *     summary: Delete a clan owned by user
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

        if (!user.data.clan) {
            res.status(500).send()
            return
        }

        if (!(await isOwner(user.data.uid!, parseInt(id))) && !user.data.isAdmin) {
            res.status(403).send()
            return
        }

        var { error } = await supabase
            .from('clans')
            .delete()
            .eq('id', id)

        if (error) {
            res.status(500).send()
            return
        }

        await supabase
            .storage
            .from('clanPhotos')
            .remove([`${id}.jpg`])

        res.send()
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

router.route('/leave')
    /**
     * @openapi
     * "/clan/leave":
     *   put:
     *     tags:
     *       - Clan
     *     summary: Leave joined clan
     *     responses:
     *       200:
     *         description: Success
     */
    .put(userAuth, async (req, res) => {
        const { user } = res.locals

        if (!user.data.clan) {
            res.status(500).send()
            return
        }

        const clan = new Clan({ id: user.data.clan })
        await clan.pull()

        if (user.data.uid == clan.data.owner) {
            res.status(500).send()
            return
        }

        await clan.removeMember(user.data.uid!)

        res.send()
    })

router.route('/:id/join')
    /**
      * @openapi
      * "/clan/{id}/join":
      *   put:
      *     tags:
      *       - Clan
      *     summary: Join a clan
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
    .put(userAuth, async (req, res) => {
        const { user } = res.locals
        const { id } = req.params
        const clan = new Clan({ id: parseInt(id) })
        await clan.pull()

        if (!clan.data.isPublic) {
            res.status(403).send()
            return
        }

        if (user.data.clan) {
            res.status(500).send()
            return
        }

        await clan.addMember(user.data.uid!)

        const { error } = await supabase
            .from('clanInvitations')
            .delete()
            .eq('to', user.data.uid!)

        res.send()
    })

router.route('/:id/invitation/:uid')
    /**
     * @openapi
     * "/clan/{id}/invitation/{uid}":
     *   get:
     *     tags:
     *       - Clan
     *     summary: Get an invitation
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the clan
     *         required: true
     *         schema:
     *           type: number
     *       - name: uid
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .get(async (req, res) => {
        const { id, uid } = req.params

        try {
            const invitation = new ClanInvitation({ clan: parseInt(id), to: uid })
            await invitation.pull()

            res.send(invitation.data)
        } catch (err) {
            console.error(err)
            res.status(404).send()
        }
    })

    /**
     * @openapi
     * "/clan/{id}/invitation/{uid}":
     *   delete:
     *     tags:
     *       - Clan
     *     summary: Delete an invitation
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the clan
     *         required: true
     *         schema:
     *           type: number
     *       - name: uid
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .delete(userAuth, async (req, res) => {
        const { id, uid } = req.params
        const { user } = res.locals
        const clan = new Clan({ id: parseInt(id) })
        await clan.pull()

        console.log(clan.data.owner, user.data.uid)

        if (clan.data.owner != user.data.uid) {
            res.status(403).send()
            return
        }

        try {
            const invitation = new ClanInvitation({ clan: parseInt(id), to: uid })
            await invitation.reject()

            res.send()
        } catch (err) {
            console.error(err)
            res.status(404).send()
        }
    })

router.route('/:id/kick/:uid')
    /**
     * @openapi
     * "/clan/{id}/kick/{uid}":
     *   patch:
     *     tags:
     *       - Clan
     *     summary: Kick a player
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the clan
     *         required: true
     *         schema:
     *           type: number
     *       - name: uid
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .patch(userAuth, async (req, res) => {
        const { id, uid } = req.params
        const { user } = res.locals
        const clan = new Clan({ id: parseInt(id) })
        await clan.pull()

        if (user.data.uid == uid) {
            res.status(500).send()
            return
        }

        if (user.data.uid != clan.data.owner) {
            res.status(403).send()
            return
        }

        await clan.removeMember(uid)
        res.send()
    })

router.route('/:id/invitations')
    /**
     * @openapi
     * "/clan/invitations":
     *   get:
     *     tags:
     *       - Clan
     *     summary: Get all invitations sent by clan
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
    .get(async (req, res) => {
        const { id } = req.params
        const { data, error } = await supabase
            .from('clanInvitations')
            .select('*, players(*)')
            .eq('clan', parseInt(id))
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
            res.status(500).send()
            return
        }

        res.send(data)
    })

router.route('/:id/ban/:uid')
    .post(userAuth, async (req, res) => {

    })

export default router