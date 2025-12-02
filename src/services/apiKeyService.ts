import { createAPIKey, deleteAPIKey, getAllAPIKey } from '@src/lib/client/APIKey'

export class APIKeyService {
    async getAllAPIKeys(uid: string) {
        return await getAllAPIKey(uid)
    }

    async createAPIKey(uid: string) {
        await createAPIKey(uid)
    }

    async deleteAPIKey(uid: string, key: string) {
        await deleteAPIKey(uid, key)
    }
}

export default new APIKeyService()
