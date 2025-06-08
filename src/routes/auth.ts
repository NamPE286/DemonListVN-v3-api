import express from "express"

const router = express.Router()

router.route("/callback/discord")
    .get(async (req, res) => {
        const { code } = req.query

        console.log(code)
        
        res.send()
        // TODO
    })

export default router