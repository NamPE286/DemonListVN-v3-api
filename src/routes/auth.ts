import { getAccessToken } from "@src/lib/client/discord"
import express from "express"

const router = express.Router()

router.route("/callback/discord")
    .get(async (req, res) => {
        const { code } = req.query

        console.log(await getAccessToken(String(code)))

        res.send()
        // TODO
    })

export default router