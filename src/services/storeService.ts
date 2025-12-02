import { getProductByID, getProducts } from '@src/lib/client/store'

export class StoreService {
    async getProductById(id: number) {
        return await getProductByID(id)
    }

    async getProducts(ids: number[] | null) {
        return await getProducts(ids)
    }
}

export default new StoreService()
