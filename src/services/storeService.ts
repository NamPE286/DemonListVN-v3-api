import { 
    getProductByID, 
    getProducts,
    addNewOrder,
    changeOrderState,
    getOrders,
    getCoupon,
    redeem,
    updateStock,
    addOrderItems,
    getOrder,
    renewStock,
    handlePayment
} from '@src/lib/client/store'

export class StoreService {
    async getProductById(id: number) {
        return await getProductByID(id)
    }

    async getProducts(ids: number[] | null) {
        return await getProducts(ids)
    }

    async addNewOrder(...args: Parameters<typeof addNewOrder>) {
        return await addNewOrder(...args)
    }

    async changeOrderState(...args: Parameters<typeof changeOrderState>) {
        return await changeOrderState(...args)
    }

    async getOrders(userID: string) {
        return await getOrders(userID)
    }

    async getCoupon(code: string) {
        return await getCoupon(code)
    }

    async redeem(...args: Parameters<typeof redeem>) {
        return await redeem(...args)
    }

    async updateStock(...args: Parameters<typeof updateStock>) {
        return await updateStock(...args)
    }

    async addOrderItems(...args: Parameters<typeof addOrderItems>) {
        return await addOrderItems(...args)
    }

    async getOrder(id: number) {
        return await getOrder(id)
    }

    async renewStock(...args: Parameters<typeof renewStock>) {
        return await renewStock(...args)
    }

    async handlePayment(...args: Parameters<typeof handlePayment>) {
        return await handlePayment(...args)
    }
}

export default new StoreService()
