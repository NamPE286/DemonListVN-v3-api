import express from 'express'
import userAuth from '@src/middleware/userAuth'
import authController from '@src/controllers/authController'

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

const router = express.Router()

/**
 * @swagger
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
    .get(authController.handleDiscordCallback.bind(authController))

/**
 * @swagger
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
    .patch(userAuth, authController.linkDiscord.bind(authController))

router.route('/link/pointercrate')
    .patch(userAuth, authController.linkPointercrate.bind(authController))

export default router
