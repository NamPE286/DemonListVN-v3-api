import supabase from '@src/database/supabase'
import { sendNotification } from '@src/lib/client/notification'
import { getOrder } from '@src/lib/client/store'
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
        const { content, link } = req.body as { content: string; link?: string }
        const { id } = req.params

        var { error } = await supabase
            .from("orderTracking")
            .insert({
                orderID: parseInt(id),
                content: content,
                link: (link ? link : null)
            })

        if (error) {
            console.error(error)
            res.status(500).send()
        }

        if (content.toLowerCase().includes("delivered")) {
            var { error } = await supabase
                .from("orders")
                .update({ state: "PAID", delivered: true })
                .eq('id', parseInt(id))

            if (error) {
                console.error(error)
                res.status(500).send()
            }
        }

        res.send()

        const order = await getOrder(parseInt(id))

        sendNotification({
            content: content,
            redirect: `https://demonlistvn.com/orders/${id}`,
            to: order.userID
        }, true)

    })

export default router