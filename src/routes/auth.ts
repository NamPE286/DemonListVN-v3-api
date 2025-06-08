import { getAccessToken, getUserByToken } from "@src/lib/client/discord"
import userAuth from "@src/middleware/userAuth"
import express from "express"

const router = express.Router()

router.route("/callback/discord")
    .get(async (req, res) => {
        const { code } = req.query
        const data = await getAccessToken(String(code));

        if (data.access_token == undefined) {
            res.status(401).send(data);

            return;
        }

        console.log(data.access_token)

        res.redirect(`https://demonlistvn.com/link/discord?access_token=${data.access_token}`)
    })

router.route("/link/discord")
    .patch(userAuth, async (req, res) => {
        const { user } = res.locals
        const { access_token } = req.headers
        const data = await getUserByToken(String(access_token));
        const id: number = data.id

        await user.updateDiscord(id);

        res.send();
    })

export default router