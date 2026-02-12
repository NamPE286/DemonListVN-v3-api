import supabase from "@src/client/supabase"
import { createDirectMessageChannel, getAccessToken, getUserByToken } from "@src/services/discord.service"
import { getUsernameByToken as getIDByToken } from "@src/services/pointercrate.service"
import { updatePlayerDiscord } from "@src/services/player.service"
import { createOTP, grantOTP, consumeOTP } from "@src/services/otp.service"
import userAuth from "@src/middleware/user-auth.middleware"
import express from "express"
import { FRONTEND_URL } from "@src/config/url"

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

/**
 * @swagger
 * /auth/otp:
 *   post:
 *     summary: Create a new OTP code
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns the newly created 6-digit OTP code
 *       500:
 *         description: Internal server error
 */
router.route("/otp")
    .post(async (req, res) => {
        try {
            const code = await createOTP()
            res.send({ code })
        } catch (err) {
            res.status(500).send()
        }
    })

/**
 * @swagger
 * /auth/otp/{code}:
 *   patch:
 *     summary: Grant an OTP code
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The 6-digit OTP code
 *     responses:
 *       200:
 *         description: OTP code granted successfully
 *       400:
 *         description: OTP code is expired or already granted
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Check OTP code grant status
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The 6-digit OTP code
 *     responses:
 *       200:
 *         description: Returns grant status. If granted, returns APIKey on first check
 *       400:
 *         description: OTP code is expired
 *       500:
 *         description: Internal server error
 */
router.route("/otp/:code")
    .patch(userAuth, async (req, res) => {
        const { authType } = res.locals

        if(authType != 'token') {
            res.status(403).send();

            return;
        }

        try {
            await grantOTP(req.params.code, res.locals.user.uid!)
            res.send()
        } catch (err: any) {
            res.status(400).send({ error: err.message })
        }
    })
    .get(async (req, res) => {
        try {
            const result = await consumeOTP(req.params.code)
            res.send(result)
        } catch (err: any) {
            res.status(400).send({ error: err.message })
        }
    })

export default router