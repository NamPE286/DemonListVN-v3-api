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

function getHeaderValue(value: string | string[] | undefined): string | null {
    if (typeof value === 'string') {
        return value
    }

    if (Array.isArray(value) && value.length > 0) {
        return value[0]
    }

    return null
}

function normalizeCountryCode(value: string | null | undefined): string | null {
    if (!value) {
        return null
    }

    const normalized = value.trim().toUpperCase()

    if (!/^[A-Z]{2}$/.test(normalized) || normalized === 'XX') {
        return null
    }

    return normalized
}

function isPrivateIp(ip: string): boolean {
    const normalized = ip.trim().replace(/^::ffff:/, '').toLowerCase()

    if (!normalized.length) {
        return true
    }

    if (normalized === '::1' || normalized === '127.0.0.1' || normalized === 'localhost') {
        return true
    }

    if (normalized.startsWith('10.') || normalized.startsWith('192.168.') || normalized.startsWith('169.254.')) {
        return true
    }

    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) {
        return true
    }

    return normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')
}

function getRequestIp(req: express.Request): string | null {
    const cfConnectingIp = getHeaderValue(req.headers['cf-connecting-ip'])

    if (cfConnectingIp?.trim()) {
        return cfConnectingIp.trim()
    }

    const forwardedFor = getHeaderValue(req.headers['x-forwarded-for'])

    if (forwardedFor?.trim()) {
        return forwardedFor.split(',')[0]?.trim() || null
    }

    const realIp = getHeaderValue(req.headers['x-real-ip'])

    if (realIp?.trim()) {
        return realIp.trim()
    }

    return req.ip?.trim() || null
}

async function getCountryCodeFromIp(ip: string): Promise<string | null> {
    if (isPrivateIp(ip)) {
        return null
    }

    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`)

    if (!response.ok) {
        return null
    }

    const data = await response.json() as { success?: boolean, country_code?: unknown }

    if (data.success === false) {
        return null
    }

    return normalizeCountryCode(typeof data.country_code === 'string' ? data.country_code : null)
}

async function resolveRequestCountry(req: express.Request): Promise<string | null> {
    const cloudflareCountry = normalizeCountryCode(getHeaderValue(req.headers['cf-ipcountry']))

    if (cloudflareCountry) {
        return cloudflareCountry
    }

    const ip = getRequestIp(req)

    if (!ip) {
        return null
    }

    try {
        return await getCountryCodeFromIp(ip)
    } catch (error) {
        console.error('Failed to resolve request country', error)
        return null
    }
}

async function updatePlayerCountry(uid: string, country: string): Promise<void> {
    const { error } = await supabase
        .from('players')
        .update({ country })
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }
}

router.route('/me')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals

        if (res.locals.authType === 'token' && user?.uid) {
            const detectedCountry = await resolveRequestCountry(req)

            if (detectedCountry && user.country !== detectedCountry) {
                try {
                    await updatePlayerCountry(user.uid, detectedCountry)
                    user.country = detectedCountry
                } catch (error) {
                    console.error('Failed to update player country', error)
                }
            }
        }

        res.send(user)
    })

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