import express from 'express'
import userAuth from '@src/middleware/userAuth'
import authController from '@src/controllers/authController'

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

const router = express.Router()

/**
 * @openapi
 * /auth/callback/discord:
 *   get:
 *     summary: Discord OAuth callback
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Discord
 *     responses:
 *       200:
 *         description: Redirects to the Discord link page with access token
 *       401:
 *         description: Unauthorized, invalid authorization code
 */
router.route('/callback/discord')
    .get((req, res) => authController.handleDiscordCallback(req, res))

/**
 * @openapi
 * /auth/link/discord:
 *   patch:
 *     summary: Link Discord account to user
 *     tags: [Auth]
 *     parameters:
 *       - in: body
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Discord access token
 *     responses:
 *       200:
 *         description: Successfully linked Discord account
 *       401:
 *         description: Unauthorized, invalid access token
 */
router.route('/link/discord')
    .patch(userAuth, (req, res) => authController.linkDiscord(req, res))

router.route('/link/pointercrate')
    /**
     * @openapi
     * /auth/link/pointercrate:
     *   patch:
     *     summary: Link Pointercrate account to user
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Successfully linked Pointercrate account
     *       401:
     *         description: Unauthorized
     */
    .patch(userAuth, (req, res) => authController.linkPointercrate(req, res))

export default router
