import { getAccessToken } from "@src/lib/client/discord"
import express from "express"

const router = express.Router()

router.route("/callback/discord")
    .get(async (req, res) => {
        const { code } = req.query
        const data = await getAccessToken(String(code));

        if(data.access_token == undefined) {
            res.status(401).send(data);
            
            return;
        }

        console.log(data.access_token)

        res.redirect(`https://demonlistvn.com/link/discord?access_token=${data.access_token}`)
    })

export default router