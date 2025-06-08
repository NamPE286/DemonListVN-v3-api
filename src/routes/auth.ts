import { getAccessToken } from "@src/lib/client/discord"
import express from "express"

const router = express.Router()

router.route("/callback/discord")
    .get(async (req, res) => {
        const { code } = req.query

        res.send({
            access_token: await getAccessToken(String(code))
        })
    })

export default router