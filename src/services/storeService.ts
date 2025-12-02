import { getProductByID, getProducts } from '@src/services/storeClientService'

export class StoreService {
    async getProductById(id: number) {
        return await getProductByID(id)
    }

    async getProducts(ids: number[] | null) {
        return await getProducts(ids)
    }
}

export default new StoreService()
