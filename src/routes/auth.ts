import express from "express"

const router = express.Router()

router.route("/callback/discord")
    .get(async (req, res) => {
        const { code } = req.query

        // TODO
    })

export default router