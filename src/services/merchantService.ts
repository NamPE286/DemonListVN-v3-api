import supabase from '@src/database/supabase'
import notificationService from '@src/services/notificationService'
import { getOrder } from '@src/lib/client/store'
import { FRONTEND_URL } from '@src/lib/constants'

export class MerchantService {
    async getOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*, orderTracking(*)')
            .or('and(paymentMethod.eq.COD,state.eq.PENDING),and(paymentMethod.eq.Bank Transfer,state.eq.PAID,delivered.eq.false)')
            .order('created_at', { ascending: false })
            .order('created_at', { referencedTable: 'orderTracking', ascending: false })

        if (error) {
            throw error
        }

        return data
    }

    async addOrderTracking(orderId: number, content: string, link?: string) {
        const { error } = await supabase
            .from('orderTracking')
            .insert({
                orderID: orderId,
                content: content,
                link: (link ? link : null)
            })

        if (error) {
            throw error
        }

        if (content.toLowerCase().includes('delivered')) {
            const { error: updateError } = await supabase
                .from('orders')
                .update({ state: 'PAID', delivered: true })
                .eq('id', orderId)

            if (updateError) {
                throw updateError
            }
        }

        const order = await getOrder(orderId)

        await notificationService.sendNotification({
            content: content,
            redirect: `${FRONTEND_URL}/orders/${orderId}`,
            to: order.userID
        }, true)
    }
}

export default new MerchantService()
