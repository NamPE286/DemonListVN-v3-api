import userAuth from '@src/middleware/userAuth'
import express from 'express'
import clanController from '@src/controllers/clanController'

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
    .post(userAuth, clanController.createClan.bind(clanController))

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
    .get(userAuth, clanController.getUserInvitations.bind(clanController))

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
    .get(clanController.getClan.bind(clanController))

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
    .patch(userAuth, clanController.updateClan.bind(clanController))

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
    .delete(userAuth, clanController.deleteClan.bind(clanController))

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
    .get(clanController.getClanMembers.bind(clanController))


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
    .get(clanController.getClanRecords.bind(clanController))

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
    .post(userAuth, clanController.invitePlayer.bind(clanController))

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
    .patch(userAuth, clanController.acceptInvitation.bind(clanController))

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
    .delete(userAuth, clanController.rejectInvitation.bind(clanController))

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
    .put(userAuth, clanController.leaveClan.bind(clanController))

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
    .put(userAuth, clanController.joinClan.bind(clanController))

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
    .get(clanController.getInvitation.bind(clanController))

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
    .delete(userAuth, clanController.deleteInvitation.bind(clanController))

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
    .patch(userAuth, clanController.kickMember.bind(clanController))

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
    .get(clanController.getClanInvitations.bind(clanController))

router.route('/:id/ban/:uid')
    .post(userAuth, clanController.banMember.bind(clanController))

router.route('/:id/list/:list')
    .get(clanController.getClanList.bind(clanController))

export default router