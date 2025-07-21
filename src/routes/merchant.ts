import supabase from '@src/database/supabase'
import adminAuth from '@src/middleware/adminAuth'
import express from 'express'

const router = express.Router()

router.route('/orders')
    .get(adminAuth, async (req, res) => {
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .or("and(paymentMethod.eq.COD,state.eq.PENDING),and(paymentMethod.eq.Bank Transfer,state.eq.PAID,delivered.eq.false)")
            .order("created_at", { ascending: false })

        if (error) {
            console.error(error)
            res.status(500).send()
        }

        res.send(data)
    })

router.route('/order/:id/tracking')
    .post(adminAuth, async (req, res) => {
        const { content, link } = req.body
        const { id } = req.params

        // TODO
    })

export default router