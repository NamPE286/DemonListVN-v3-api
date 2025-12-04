import supabase from '@src/client/supabase'
import ClanInvitation from '@src/classes/ClanInvitation'
import userAuth from '@src/middleware/userAuth.middleware'
import express from 'express'
import { getClans, getClan, createClan, updateClan, fetchClanMembers, addClanMember, removeClanMember, inviteToClan, fetchClanRecords } from '@src/services/clan.service'

const router = express.Router()

async function isOwner(uid: string, clanID: number) {
    const clan = await getClan(clanID)

    return uid == clan.owner
}

router.route('/')
    /**
     * @openapi
     * "/clans":
     *   get:
     *     tags:
     *       - Clan
     *     summary: Get clan list
     *     parameters:
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
     *           default: name
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
     *         required: false
     *         schema:
     *           type: boolean
     *           default: true
     *       - name: searchQuery
     *         in: query
     *         description: Search query
     *         required: false
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getClans(req.query))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

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

        if (user.clan) {
            res.status(500).send()
            return
        }

        if (!user.rating && !user.totalFLpt) {
            res.status(500).send()
            return
        }

        req.body.owner = user.uid
        delete req.body.id

        try {
            const clan = await createClan(req.body)
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
            .eq('to', user.uid!)

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

        try {
            const clan = await getClan(Number(id))
            res.send(clan)
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


        if (!user.clan) {
            res.status(500).send()
            return
        }

        if (!(await isOwner(user.uid!, parseInt(id))) && !user.isAdmin) {
            res.status(403).send()
            return
        }

        req.body.id = id

        try {
            await updateClan(req.body)
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

        if (!user.clan) {
            res.status(500).send()
            return
        }

        if (!(await isOwner(user.uid!, parseInt(id))) && !user.isAdmin) {
            res.status(403).send()
            return
        }

        var { error } = await supabase
            .from('clans')
            .delete()
            .eq('id', Number(id))

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

        try {
            res.send(await fetchClanMembers(parseInt(id), req.query))
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

        try {
            res.send(await fetchClanRecords(parseInt(id), req.query))
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

        if (!user.clan) {
            res.status(500).send()
            return
        }

        const clan = await getClan(user.clan)

        if (clan.isPublic || clan.owner == user.uid) {
            await inviteToClan(user.clan, clan.name!, uid)
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
        const invitation = new ClanInvitation({ to: user.uid, clan: parseInt(id) })

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
        const invitation = new ClanInvitation({ to: user.uid, clan: parseInt(id) })

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

        if (!user.clan) {
            res.status(500).send()
            return
        }

        const clan = await getClan(user.clan)

        if (user.uid == clan.owner) {
            res.status(500).send()
            return
        }

        await removeClanMember(user.clan, user.uid!)

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
        const clan = await getClan(Number(id))

        if (!clan.isPublic) {
            res.status(403).send()
            return
        }

        if (user.clan) {
            res.status(500).send()
            return
        }

        await addClanMember(Number(id), user.uid!)

        const { error } = await supabase
            .from('clanInvitations')
            .delete()
            .eq('to', user.uid!)

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

            res.send(invitation)
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
        const clan = await getClan(Number(id))

        if (clan.owner != user.uid) {
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
        const clan = await getClan(Number(id))

        if (user.uid == uid) {
            res.status(500).send()
            return
        }

        if (user.uid != clan.owner) {
            res.status(403).send()
            return
        }

        await removeClanMember(Number(id), uid)
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

router.route('/:id/list/:list')
    .get(async (req, res) => {
        const { id, list } = req.params;
        const { from, to } = req.query
        let x = '', isPlat = false;

        if (list == 'dl') {
            x = 'rating', isPlat = false;
        } else if (list == 'pl') {
            x = 'rating', isPlat = true;
        } else if (list == 'fl') {
            x = 'flPt', isPlat = false;
        }

        const { data, error } = await supabase
            .from('levels')
            .select('*, records!inner(userid, levelid, isChecked, players!public_records_userid_fkey!inner(uid, clan))')
            .eq("records.players.clan", Number(id))
            .eq("records.isChecked", true)
            .eq('isPlatformer', isPlat)
            .not(x, 'is', null)
            .order(x, { ascending: false })
            .range(from ? Number(from) : 0, to ? Number(to) : 49)

        if (error) {
            console.error(error)
            throw new Error(error.message);
        }

        for (const i of data) {
            // @ts-ignore
            delete i.records;
        }

        res.send(data)
    })

export default router