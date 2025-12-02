import express from 'express'
import userAuth from '@src/middleware/userAuth'
import playerController from '@src/controllers/playerController'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/player":
     *   put:
     *     tags:
     *       - Player
     *     summary: Add or update a Player
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *     responses:
     *       200:
     *         description: Success
     */
    .put(userAuth, (req, res) => playerController.updatePlayer(req, res))

    /**
     * @openapi
     * "/player":
     *   post:
     *     tags:
     *       - Player
     *     summary: Add a Player
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *     responses:
     *       200:
     *         description: Success
     */
    .post(userAuth, (req, res) => playerController.createPlayer(req, res))

router.route('/:uid')
    /**
     * @openapi
     * "/player/{uid}":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get a single player by the uid
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
     *         content:
     *           application/json:
     *             schema:
     */
    .get((req, res) => playerController.getPlayer(req, res))

router.route('/:uid/records')
    /**
     * @openapi
     * "/player/{uid}/records":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get all records of a player
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
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
     *       - name: isChecked
     *         in: query
     *         description: Record acception status
     *         required: false
     *         schema:
     *           type: boolean
     *           default: true
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get((req, res) => playerController.getPlayerRecords(req, res))

router.route('/:uid/heatmap/:year')
    /**
     * @openapi
     * "/player/{uid}/heatmap":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get player heatmap
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
     *       - name: year
     *         in: path
     *         description: Year to fetch
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .get((req, res) => playerController.getPlayerHeatmap(req, res))

router.route('/heatmap/:count')
    /**
     * @openapi
     * "/player/heatmap/{count}":
     *   post:
     *     tags:
     *       - Player
     *     summary: Add 1 attempt to the heatmap
     *     parameters:
     *       - name: count
     *         in: path
     *         description: Amount of attempt to add
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .post(userAuth, (req, res) => playerController.updatePlayerHeatmap(req, res))

router.route('/:uid/submissions')
    /**
     * @openapi
     * "/{uid}/submissions":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get player's submissions
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The UID of the player
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get((req, res) => playerController.getPlayerSubmissions(req, res))


router.route('/syncRole')
    /**
     * @openapi
     * "/player/syncRole":
     *   patch:
     *     tags:
     *       - Player
     *     summary: Synchronize the player's role to Discord
     *     responses:
     *       200:
     *         description: Role synchronized successfully
     *       500:
     *         description: Internal server error
     */
    .patch(userAuth, (req, res) => playerController.syncPlayerRoles(req, res))

router.route('/:id/medals')
    /**
     * @openapi
     * "/{uid}/medals":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get player's medals
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The UID of the player
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get((req, res) => playerController.getPlayerMedals(req, res))

router.route('/:uid/events')
    /**
     * @openapi
     * "/player/{uid}/events":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get player's events
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The UID of the player
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get((req, res) => playerController.getPlayerEvents(req, res))

router.route('/:uid/cards')
    /**
     * @openapi
     * "/player/{uid}/cards":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get player's cards
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The UID of the player
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get((req, res) => playerController.getPlayerCards(req, res))

export default router
