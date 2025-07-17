import { getProductByID } from "@src/lib/client/store"
import express from "express"

const router = express.Router()

router.route('/product/:id')
    .get(async (req, res) => {
       const { id } = req.params
       const product = await getProductByID(parseInt(id))
       
       res.send(product)
    })

export default router