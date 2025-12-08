import supabase from "@src/client/supabase"
import { createDirectMessageChannel, getAccessToken, getUserByToken } from "@src/services/discord.service"
import { getUsernameByToken as getIDByToken } from "@src/services/pointercrate.service"
import { updatePlayerDiscord } from "@src/services/player.service"
import userAuth from "@src/middleware/user-auth.middleware"
import express from "express"
import { FRONTEND_URL } from "@src/config/constants"

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
router.route("/callback/discord")
    .get(async (req, res) => {
        const { code } = req.query
        const data = await getAccessToken(String(code));

        if (data.access_token == undefined) {
            res.status(401).send(data);

            return;
        }

        res.redirect(`${FRONTEND_URL}/link/discord?token=${data.access_token}`)
    })

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
router.route("/link/discord")
    .patch(userAuth, async (req, res) => {
        const { user } = res.locals
        const { token } = req.body
        const data = await getUserByToken(String(token));

        if (data.id == undefined) {
            res.status(401).send(data);

            return;
        }

        const id: string = String(data.id)

        await updatePlayerDiscord(user.uid!, id);

        res.send();
    })

/**
 * @swagger
 * /auth/link/pointercrate:
 *   patch:
 *     summary: Link Pointercrate account to user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Pointercrate access token
 *     responses:
 *       200:
 *         description: Successfully linked Pointercrate account
 *       500:
 *         description: Internal server error
 */
router.route("/link/pointercrate")
    .patch(userAuth, async (req, res) => {
        const { user } = res.locals
        const { token } = req.body
        const name = await getIDByToken(token);

        const { data, error } = await supabase
            .from("players")
            .update({ pointercrate: name })
            .eq("uid", user.uid!)

        if (error) {
            console.error(error)
            res.status(500).send()
            return;
        }

        res.send()
    })

export default router