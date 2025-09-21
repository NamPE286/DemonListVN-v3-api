import supabase from "@src/database/supabase"
import { createDirectMessageChannel, getAccessToken, getUserByToken } from "@src/lib/client/discord"
import { getUsernameByToken } from "@src/lib/client/pointercrate"
import userAuth from "@src/middleware/userAuth"
import express from "express"

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

        res.redirect(`https://www.demonlistvn.com/link/discord?token=${data.access_token}`)
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

        await user.updateDiscord(id);

        res.send();
    })

router.route("/link/pointercrate")
    .patch(userAuth, async (req, res) => {
        const { user } = res.locals
        const { token } = req.body
        const username = await getUsernameByToken(token);

        const { data, error } = await supabase
            .from("players")
            .update({ pointercrate: username })
            .eq("uid", user.uid!)

        if (error) {
            console.error(error)
            res.status(500).send()
            return;
        }

        res.send()
    })

export default router